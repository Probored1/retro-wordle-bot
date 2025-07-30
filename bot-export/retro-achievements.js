const axios = require('axios');

class RetroAchievementsService {
  constructor() {
    this.baseUrl = 'https://retroachievements.org/API';
    this.username = process.env.RETROACHIEVEMENTS_USERNAME || '';
    this.webApiKey = process.env.RETROACHIEVEMENTS_API_KEY || '';
  }

  getAuthParams() {
    return {
      z: this.username,
      y: this.webApiKey
    };
  }

  async getAchievementFromUrl(url) {
    try {
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

  async getAchievement(achievementId) {
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

  async checkUserEarnedAchievementToday(username, achievementId, targetDate) {
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
        
        const userUnlock = recentWinners.find(winner => 
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

  async validateUserAchievementToday(username, url, targetDate) {
    try {
      if (!this.isValidRetroAchievementsUrl(url)) {
        return { valid: false, achievement: null };
      }

      const achievementIdMatch = url.match(/\/achievement\/(\d+)/);
      if (!achievementIdMatch) {
        return { valid: false, achievement: null };
      }

      const achievementId = achievementIdMatch[1];
      
      const achievement = await this.getAchievement(achievementId);
      if (!achievement) {
        return { valid: false, achievement: null };
      }

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

  isValidRetroAchievementsUrl(url) {
    const regex = /^https:\/\/retroachievements\.org\/achievement\/\d+$/;
    return regex.test(url);
  }
}

module.exports = { RetroAchievementsService };