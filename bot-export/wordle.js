const axios = require('axios');

class WordleService {
  constructor() {
    this.rapidApiKey = process.env.RAPIDAPI_KEY || '';
    this.currentSolution = 'FOCUS'; // Fallback solution
  }

  async fetchTodaysSolution() {
    if (!this.rapidApiKey) {
      console.log('No RapidAPI key provided, using fallback solution');
      return this.currentSolution;
    }

    try {
      const response = await axios.get('https://wordle-answers-solutions.p.rapidapi.com/today', {
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': 'wordle-answers-solutions.p.rapidapi.com'
        },
        timeout: 10000
      });

      const solution = response.data?.today?.toUpperCase();
      if (solution && solution.length === 5) {
        this.currentSolution = solution;
        console.log(`Updated daily Wordle solution: ${solution}`);
        return solution;
      }
    } catch (error) {
      console.error('Error fetching Wordle solution from API:', error);
    }

    // Return fallback if API fails
    console.log(`Using fallback Wordle solution: ${this.currentSolution}`);
    return this.currentSolution;
  }

  getCurrentSolution() {
    return {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      solution: this.currentSolution
    };
  }

  startDailyUpdate() {
    // Update solution immediately
    this.fetchTodaysSolution();

    // Update every 24 hours
    setInterval(() => {
      this.fetchTodaysSolution();
    }, 24 * 60 * 60 * 1000);
  }
}

module.exports = { WordleService };