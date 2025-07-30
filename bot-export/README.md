# Wordle Achievement Discord Bot - Standalone Export

This is a standalone version of the Discord bot extracted from the full-stack application.

## Files Included
- `discord-bot.js` - Main bot logic with all slash commands
- `retro-achievements.js` - RetroAchievements API service  
- `wordle.js` - Wordle solution fetching service
- `package.json` - Dependencies for standalone bot
- `config.env.example` - Environment variables template

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Copy `config.env.example` to `.env`
   - Fill in your API keys:
     - `DISCORD_BOT_TOKEN` - Your Discord bot token
     - `DISCORD_CLIENT_ID` - Your Discord application ID
     - `RETROACHIEVEMENTS_USERNAME` - RetroAchievements username
     - `RETROACHIEVEMENTS_API_KEY` - RetroAchievements API key
     - `RAPIDAPI_KEY` - RapidAPI key for Wordle solutions (optional)

3. **Run the Bot**
   ```bash
   node discord-bot.js
   ```

## Features
- `/submit` - Submit 5 achievement URLs matching daily Wordle letters
- `/stats` - View personal statistics
- `/leaderboard` - View top participants  
- `/help` - Show help information
- `/wordle` - Get today's Wordle solution
- `/reset` - Reset daily submission for testing

## Database Note
This standalone version uses in-memory storage. For persistent data, you'll need to add a database connection.