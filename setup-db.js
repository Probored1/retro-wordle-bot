#!/usr/bin/env node

// This script will create the database tables manually
import { Pool } from '@neondatabase/serverless';

async function setupDatabase() {
  console.log('🔍 Checking for DATABASE_URL...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    console.log('\n📝 To fix this:');
    console.log('1. Make sure you added DATABASE_URL to Replit Secrets');
    console.log('2. Restart your entire Replit (not just the process)');
    console.log('3. The secret should be your Neon connection string');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL found');
  console.log('🔗 Connecting to database...');

  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    console.log('📋 Creating database tables...');

    // Create users table
    await pool.query(`
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
    `);
    console.log('✅ Users table created');

    // Create submissions table
    await pool.query(`
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
    `);
    console.log('✅ Submissions table created');

    // Create wordle_solutions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wordle_solutions (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        solution VARCHAR(5) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Wordle solutions table created');

    // Create bot_config table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bot_config (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Bot config table created');

    console.log('🎉 Database setup complete! All tables created successfully!');
    
    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();