import axios from 'axios';

interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  author: string;
  dateCreated: string;
  dateModified: string;
  type: string;
  badgeName: string;
}

interface UserAchievementUnlock {
  user: string;
  dateEarned: string;
  hardcoreMode: boolean;
}

class RetroAchievementsService {
  private baseUrl = 'https://retroachievements.org/API';
  private username: string;
  private webApiKey: string;

  constructor() {
    this.username = process.env.RETROACHIEVEMENTS_USERNAME || '';
    this.webApiKey = process.env.RETROACHIEVEMENTS_API_KEY || '';
  }

  private getAuthParams() {
    return {
      z: this.username,
      y: this.webApiKey
    };
  }

  async getAchievementFromUrl(url: string): Promise<Achievement | null> {
    try {
      // Extract achievement ID from URL
      // URLs are in format: https://retroachievements.org/achievement/159558
      const achievementIdMatch = url.match(/\/achievement\/(\d+)/);
      if (!achievementIdMatch) {
        console.error('Invalid RetroAchievements URL format:', url);
        return null;
      }

      const achievementId = achievementIdMatch[1];
      return await this.getAchievement(achievementId);
    } catch (error) {
      console.error('Error fetching achievement from URL:', error);
      return null;
    }
  }

  async getAchievement(achievementId: string): Promise<Achievement | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/API_GetAchievementUnlocks.php`, {
        params: {
          ...this.getAuthParams(),
          a: achievementId
        },
        timeout: 10000
      });

      if (response.data && response.data.Achievement) {
        const achievement = response.data.Achievement;
        return {
          id: achievement.ID.toString(),
          title: achievement.Title,
          description: achievement.Description,
          points: achievement.Points,
          author: achievement.Author,
          dateCreated: achievement.DateCreated,
          dateModified: achievement.DateModified,
          type: achievement.Type || 'unknown',
          badgeName: achievement.BadgeName
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching achievement:', error);
      return null;
    }
  }

  async validateAchievementExists(achievementId: string): Promise<boolean> {
    try {
      const achievement = await this.getAchievement(achievementId);
      return achievement !== null;
    } catch (error) {
      console.error('Error validating achievement:', error);
      return false;
    }
  }

  async checkUserEarnedAchievementToday(username: string, achievementId: string, targetDate: string): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/API_GetAchievementUnlocks.php`, {
        params: {
          ...this.getAuthParams(),
          a: achievementId
        },
        timeout: 10000
      });

      if (response.data && response.data.RecentWinners) {
        const recentWinners = response.data.RecentWinners || [];
        
        // Check if the user earned this achievement on the target date
        const userUnlock = recentWinners.find((winner: any) => 
          winner.User === username && 
          winner.DateEarned?.startsWith(targetDate)
        );
        
        return !!userUnlock;
      }

      return false;
    } catch (error) {
      console.error('Error checking user achievement unlock date:', error);
      return false;
    }
  }

  async validateUserAchievementToday(username: string, url: string, targetDate: string): Promise<{ valid: boolean; achievement: Achievement | null }> {
    try {
      // First check if URL format is valid
      if (!this.isValidRetroAchievementsUrl(url)) {
        return { valid: false, achievement: null };
      }

      // Extract achievement ID
      const achievementIdMatch = url.match(/\/achievement\/(\d+)/);
      if (!achievementIdMatch) {
        return { valid: false, achievement: null };
      }

      const achievementId = achievementIdMatch[1];
      
      // Get achievement details
      const achievement = await this.getAchievement(achievementId);
      if (!achievement) {
        return { valid: false, achievement: null };
      }

      // Check if user earned it today
      const earnedToday = await this.checkUserEarnedAchievementToday(username, achievementId, targetDate);
      
      return { 
        valid: earnedToday, 
        achievement: earnedToday ? achievement : null 
      };
    } catch (error) {
      console.error('Error validating user achievement today:', error);
      return { valid: false, achievement: null };
    }
  }

  isValidRetroAchievementsUrl(url: string): boolean {
    const regex = /^https:\/\/retroachievements\.org\/achievement\/\d+$/;
    return regex.test(url);
  }
}

export const retroAchievementsService = new RetroAchievementsService();
