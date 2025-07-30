-- Create users table (matching the actual schema)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  retro_achievements_username TEXT,
  score INTEGER DEFAULT 0 NOT NULL,
  prize_eligible BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  last_submission TIMESTAMP
);

-- Create submissions table (matching the actual schema)
CREATE TABLE IF NOT EXISTS submissions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  wordle_date TEXT NOT NULL,
  wordle_solution TEXT NOT NULL,
  achievements JSONB NOT NULL,
  is_valid BOOLEAN NOT NULL,
  validation_details JSONB,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create wordle_solutions table (matching the actual schema)
CREATE TABLE IF NOT EXISTS wordle_solutions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  date TEXT UNIQUE NOT NULL,
  solution TEXT NOT NULL,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create bot_config table (matching the actual schema)
CREATE TABLE IF NOT EXISTS bot_config (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);