import axios from 'axios';
import { storage } from '../storage';

interface WordleApiResponse {
  word: string;
  isOk: boolean;
  error: string;
}

class WordleService {
  private rapidApiKey: string;
  private apiUrl = 'https://wordle-game-api1.p.rapidapi.com';

  constructor() {
    this.rapidApiKey = process.env.RAPIDAPI_KEY || '';
  }

  async fetchTodaysWordle(): Promise<string | null> {
    try {
      // Try RapidAPI first
      if (this.rapidApiKey) {
        const response = await axios.get(`${this.apiUrl}/word`, {
          headers: {
            'X-RapidAPI-Key': this.rapidApiKey,
            'X-RapidAPI-Host': 'wordle-game-api1.p.rapidapi.com'
          },
          timeout: 10000
        });

        if (response.data && response.data.word) {
          return response.data.word.toUpperCase();
        }
      }

      // Fallback: Use a predetermined solution for today
      // In production, you might want to maintain your own list or use another API
      const today = new Date();
      const solutions = [
        'ASSAY', 'SAVVY', 'BLANK', 'FOCUS', 'TREND', 'STAGE', 'LIGHT', 'SOUND',
        'PIANO', 'HOUSE', 'DREAM', 'WORLD', 'PAPER', 'MUSIC', 'OCEAN', 'TRAIL'
      ];
      
      // Use day of year to select a consistent word for today
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      const wordIndex = dayOfYear % solutions.length;
      
      return solutions[wordIndex];
    } catch (error) {
      console.error('Error fetching Wordle solution:', error);
      
      // Emergency fallback
      return 'GAMES';
    }
  }

  async getCurrentSolution(): Promise<{ solution: string; date: string } | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if we already have today's solution
      let wordleSolution = await storage.getWordleSolutionByDate(today);
      
      if (!wordleSolution) {
        // Fetch new solution
        const solution = await this.fetchTodaysWordle();
        if (solution) {
          wordleSolution = await storage.createWordleSolution({
            date: today,
            solution: solution
          });
        } else {
          return null;
        }
      }

      return {
        solution: wordleSolution.solution,
        date: wordleSolution.date
      };
    } catch (error) {
      console.error('Error getting current solution:', error);
      return null;
    }
  }

  async updateDailySolution(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const existing = await storage.getWordleSolutionByDate(today);
      
      if (!existing) {
        const solution = await this.fetchTodaysWordle();
        if (solution) {
          await storage.createWordleSolution({
            date: today,
            solution: solution
          });
          console.log(`Updated daily Wordle solution: ${solution}`);
        }
      }
    } catch (error) {
      console.error('Error updating daily solution:', error);
    }
  }

  // Schedule daily updates
  startDailyUpdate(): void {
    // Update immediately on startup
    this.updateDailySolution();
    
    // Then update every 24 hours at midnight UTC
    setInterval(() => {
      this.updateDailySolution();
    }, 24 * 60 * 60 * 1000);
  }
}

export const wordleService = new WordleService();
