-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  discord_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) NOT NULL,
  retro_achievements_username VARCHAR(255),
  score INTEGER DEFAULT 0,
  prize_eligible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  wordle_date DATE NOT NULL,
  achievement_urls TEXT[] NOT NULL,
  achievement_ids TEXT[] NOT NULL,
  achievement_titles TEXT[] NOT NULL,
  letters VARCHAR(5) NOT NULL,
  is_valid BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, wordle_date)
);

-- Create wordle_solutions table
CREATE TABLE IF NOT EXISTS wordle_solutions (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  solution VARCHAR(5) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create bot_config table
CREATE TABLE IF NOT EXISTS bot_config (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);