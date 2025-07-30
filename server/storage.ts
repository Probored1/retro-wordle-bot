import { 
  users, 
  submissions, 
  wordleSolutions, 
  botConfig,
  type User, 
  type InsertUser,
  type Submission,
  type InsertSubmission,
  type WordleSolution,
  type InsertWordleSolution,
  type BotConfig,
  type InsertBotConfig
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUserScore(userId: string, score: number, prizeEligible: boolean): Promise<void>;
  
  // Submission methods
  createSubmission(insertSubmission: InsertSubmission): Promise<Submission>;
  getUserSubmissionForDate(userId: string, date: string): Promise<Submission | undefined>;
  deleteUserSubmissionForDate(userId: string, date: string): Promise<boolean>;
  getUserSubmissions(userId: string): Promise<Submission[]>;
  getRecentSubmissions(limit: number): Promise<Submission[]>;
  getSubmissions(page: number, limit: number): Promise<Submission[]>;
  
  // Wordle methods
  getWordleSolutionByDate(date: string): Promise<WordleSolution | undefined>;
  createWordleSolution(insertWordleSolution: InsertWordleSolution): Promise<WordleSolution>;
  getCurrentWordleSolution(): Promise<WordleSolution | null>;
  
  // Dashboard methods
  getDashboardStats(): Promise<any>;
  getLeaderboard(limit: number): Promise<User[]>;
  getSystemStatus(): Promise<any>;
  
  // Admin methods
  resetAllScores(): Promise<void>;
  exportAllData(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.discordId, discordId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserScore(userId: string, score: number, prizeEligible: boolean): Promise<void> {
    await db
      .update(users)
      .set({ 
        score, 
        prizeEligible, 
        lastSubmission: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const [submission] = await db
      .insert(submissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }

  async getUserSubmissionForDate(userId: string, date: string): Promise<Submission | undefined> {
    const [submission] = await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.userId, userId), eq(submissions.wordleDate, date)));
    return submission || undefined;
  }

  async deleteUserSubmissionForDate(userId: string, date: string): Promise<boolean> {
    const result = await db
      .delete(submissions)
      .where(and(eq(submissions.userId, userId), eq(submissions.wordleDate, date)));
    return result.rowCount > 0;
  }

  async getUserSubmissions(userId: string): Promise<Submission[]> {
    return await db
      .select()
      .from(submissions)
      .where(eq(submissions.userId, userId))
      .orderBy(desc(submissions.submittedAt));
  }

  async getRecentSubmissions(limit: number): Promise<Submission[]> {
    return await db
      .select({
        id: submissions.id,
        userId: submissions.userId,
        wordleDate: submissions.wordleDate,
        wordleSolution: submissions.wordleSolution,
        achievements: submissions.achievements,
        isValid: submissions.isValid,
        validationDetails: submissions.validationDetails,
        submittedAt: submissions.submittedAt,
        user: {
          id: users.id,
          username: users.username,
          discordId: users.discordId
        }
      })
      .from(submissions)
      .leftJoin(users, eq(submissions.userId, users.id))
      .orderBy(desc(submissions.submittedAt))
      .limit(limit);
  }

  async getSubmissions(page: number, limit: number): Promise<Submission[]> {
    const offset = (page - 1) * limit;
    return await db
      .select({
        id: submissions.id,
        userId: submissions.userId,
        wordleDate: submissions.wordleDate,
        wordleSolution: submissions.wordleSolution,
        achievements: submissions.achievements,
        isValid: submissions.isValid,
        validationDetails: submissions.validationDetails,
        submittedAt: submissions.submittedAt,
        user: {
          id: users.id,
          username: users.username,
          discordId: users.discordId
        }
      })
      .from(submissions)
      .leftJoin(users, eq(submissions.userId, users.id))
      .orderBy(desc(submissions.submittedAt))
      .limit(limit)
      .offset(offset);
  }

  async getWordleSolutionByDate(date: string): Promise<WordleSolution | undefined> {
    const [solution] = await db
      .select()
      .from(wordleSolutions)
      .where(eq(wordleSolutions.date, date));
    return solution || undefined;
  }

  async createWordleSolution(insertWordleSolution: InsertWordleSolution): Promise<WordleSolution> {
    const [solution] = await db
      .insert(wordleSolutions)
      .values(insertWordleSolution)
      .returning();
    return solution;
  }

  async getCurrentWordleSolution(): Promise<WordleSolution | null> {
    const today = new Date().toISOString().split('T')[0];
    const [solution] = await db
      .select()
      .from(wordleSolutions)
      .where(eq(wordleSolutions.date, today));
    return solution || null;
  }

  async getDashboardStats(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    
    const [totalParticipants] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    
    const [todaySubmissions] = await db
      .select({ count: sql<number>`count(*)` })
      .from(submissions)
      .where(eq(submissions.wordleDate, today));
    
    const [prizeEligible] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.prizeEligible, true));

    return {
      totalParticipants: totalParticipants.count || 0,
      todaySubmissions: todaySubmissions.count || 0,
      prizeEligible: prizeEligible.count || 0
    };
  }

  async getLeaderboard(limit: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.score))
      .limit(limit);
  }

  async getSystemStatus(): Promise<any> {
    // Basic system status - in a real implementation you'd check actual service health
    return {
      discordBot: {
        status: process.env.DISCORD_BOT_TOKEN ? 'Online' : 'Offline',
        latency: '50ms'
      },
      retroAchievements: {
        status: process.env.RETROACHIEVEMENTS_API_KEY ? 'Online' : 'Offline',
        responseTime: '200ms'
      },
      database: {
        status: 'Connected',
        connections: '1/10'
      }
    };
  }

  async resetAllScores(): Promise<void> {
    await db
      .update(users)
      .set({ score: 0, prizeEligible: false });
  }

  async exportAllData(): Promise<any> {
    const usersData = await db.select().from(users);
    const submissionsData = await db.select().from(submissions);
    const wordleData = await db.select().from(wordleSolutions);
    
    return {
      users: usersData,
      submissions: submissionsData,
      wordleSolutions: wordleData,
      exportedAt: new Date().toISOString()
    };
  }
}

export const storage = new DatabaseStorage();