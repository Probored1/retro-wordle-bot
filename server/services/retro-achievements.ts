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
    
    // Validate environment variables
    if (!this.username || !this.webApiKey) {
      console.error('⚠️  RetroAchievements API credentials not configured!');
      console.error('Please set RETROACHIEVEMENTS_USERNAME and RETROACHIEVEMENTS_API_KEY environment variables');
    }
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
        console.error('Expected format: https://retroachievements.org/achievement/[ID]');
        return null;
      }

      const achievementId = achievementIdMatch[1];
      console.log(`Extracted achievement ID ${achievementId} from URL: ${url}`);
      return await this.getAchievement(achievementId);
    } catch (error) {
      console.error('Error fetching achievement from URL:', error);
      return null;
    }
  }

  async getAchievement(achievementId: string): Promise<Achievement | null> {
    try {
      // Check if credentials are available
      if (!this.username || !this.webApiKey) {
        console.error('RetroAchievements API credentials not configured');
        return null;
      }

      console.log(`Fetching achievement ${achievementId} from RetroAchievements API...`);
      
      const response = await axios.get(`${this.baseUrl}/API_GetAchievementInfo.php`, {
        params: {
          ...this.getAuthParams(),
          i: achievementId
        },
        timeout: 10000
      });

      console.log('RetroAchievements API response:', JSON.stringify(response.data, null, 2));

      // The API_GetAchievementInfo.php returns the achievement data directly
      if (response.data && response.data.ID) {
        const achievement = response.data;
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

      console.error('Achievement not found in API response:', response.data);
      return null;
    } catch (error) {
      console.error('Error fetching achievement:', error);
      if (error.response) {
        console.error('API Error Response:', error.response.status, error.response.data);
      }
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
      // Check if credentials are available
      if (!this.username || !this.webApiKey) {
        console.error('RetroAchievements API credentials not configured');
        return false;
      }

      console.log(`Checking if user ${username} earned achievement ${achievementId} on ${targetDate}...`);
      
      const response = await axios.get(`${this.baseUrl}/API_GetAchievementUnlocks.php`, {
        params: {
          ...this.getAuthParams(),
          a: achievementId
        },
        timeout: 10000
      });

      console.log('Achievement unlocks response:', JSON.stringify(response.data, null, 2));

      if (response.data && response.data.RecentWinners) {
        const recentWinners = response.data.RecentWinners || [];
        
        console.log(`Checking ${recentWinners.length} recent winners for user ${username} on ${targetDate}`);
        
        // Check if the user earned this achievement on the target date
        const userUnlock = recentWinners.find((winner: any) => {
          const matchesUser = winner.User === username;
          const matchesDate = winner.DateEarned?.startsWith(targetDate);
          console.log(`Winner: ${winner.User}, Date: ${winner.DateEarned}, Matches User: ${matchesUser}, Matches Date: ${matchesDate}`);
          return matchesUser && matchesDate;
        });
        
        const result = !!userUnlock;
        console.log(`User ${username} earned achievement ${achievementId} on ${targetDate}: ${result}`);
        return result;
      }

      console.log('No RecentWinners found in response');
      return false;
    } catch (error) {
      console.error('Error checking user achievement unlock date:', error);
      if (error.response) {
        console.error('API Error Response:', error.response.status, error.response.data);
      }
      return false;
    }
  }

  async validateUserAchievementToday(username: string, url: string, targetDate: string): Promise<{ valid: boolean; achievement: Achievement | null }> {
    try {
      console.log(`\n=== Validating achievement for user ${username} ===`);
      console.log(`URL: ${url}`);
      console.log(`Target date: ${targetDate}`);
      
      // First check if URL format is valid
      if (!this.isValidRetroAchievementsUrl(url)) {
        console.log('❌ URL format validation failed');
        return { valid: false, achievement: null };
      }
      console.log('✅ URL format is valid');

      // Extract achievement ID
      const achievementIdMatch = url.match(/\/achievement\/(\d+)/);
      if (!achievementIdMatch) {
        console.log('❌ Could not extract achievement ID from URL');
        return { valid: false, achievement: null };
      }

      const achievementId = achievementIdMatch[1];
      console.log(`✅ Extracted achievement ID: ${achievementId}`);
      
      // Get achievement details
      const achievement = await this.getAchievement(achievementId);
      if (!achievement) {
        console.log('❌ Achievement not found or could not be fetched');
        return { valid: false, achievement: null };
      }
      console.log(`✅ Achievement found: "${achievement.title}"`);

      // Check if user earned it today
      const earnedToday = await this.checkUserEarnedAchievementToday(username, achievementId, targetDate);
      
      const result = { 
        valid: earnedToday, 
        achievement: earnedToday ? achievement : achievement // Return achievement even if not earned today for better error messages
      };
      
      console.log(`=== Validation result: ${earnedToday ? '✅ VALID' : '❌ INVALID'} ===\n`);
      return result;
    } catch (error) {
      console.error('Error validating user achievement today:', error);
      return { valid: false, achievement: null };
    }
  }

  isValidRetroAchievementsUrl(url: string): boolean {
    // Allow both http and https, and optional trailing slash or query parameters
    const regex = /^https?:\/\/(?:www\.)?retroachievements\.org\/achievement\/\d+(?:\/.*)?(?:\?.*)?$/;
    const isValid = regex.test(url);
    console.log(`URL validation for "${url}": ${isValid}`);
    return isValid;
  }
}

export const retroAchievementsService = new RetroAchievementsService();
