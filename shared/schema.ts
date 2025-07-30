import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  discordId: text("discord_id").notNull().unique(),
  username: text("username").notNull(),
  score: integer("score").default(0).notNull(),
  prizeEligible: boolean("prize_eligible").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastSubmission: timestamp("last_submission"),
});

export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  wordleDate: text("wordle_date").notNull(),
  wordleSolution: text("wordle_solution").notNull(),
  achievements: json("achievements").$type<{
    url: string;
    id: string;
    title: string;
    letter: string;
  }[]>().notNull(),
  isValid: boolean("is_valid").notNull(),
  validationDetails: json("validation_details").$type<{
    errors: string[];
    validLetters: string[];
  }>(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const wordleSolutions = pgTable("wordle_solutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull().unique(),
  solution: text("solution").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
});

export const botConfig = pgTable("bot_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  submittedAt: true,
});

export const insertWordleSolutionSchema = createInsertSchema(wordleSolutions).omit({
  id: true,
  fetchedAt: true,
});

export const insertBotConfigSchema = createInsertSchema(botConfig).omit({
  id: true,
  updatedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type WordleSolution = typeof wordleSolutions.$inferSelect;
export type InsertWordleSolution = z.infer<typeof insertWordleSolutionSchema>;
export type BotConfig = typeof botConfig.$inferSelect;
export type InsertBotConfig = z.infer<typeof insertBotConfigSchema>;
