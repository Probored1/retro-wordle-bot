# Wordle Bot Application

## Overview

This is a full-stack Discord bot application that manages a Wordle-based game where users submit RetroAchievements URLs. The application features a React frontend dashboard for monitoring and managing the bot, with Express.js backend API and PostgreSQL database using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared components:

- **Frontend**: React with TypeScript, Vite for bundling, and shadcn/ui for components
- **Backend**: Express.js with TypeScript for API endpoints
- **Database**: PostgreSQL with Drizzle ORM for data persistence
- **Discord Integration**: Discord.js for bot functionality
- **External APIs**: RetroAchievements API and Wordle API integrations

## Key Components

### Frontend Architecture
- **React Router**: Uses wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: shadcn/ui components with Tailwind CSS styling
- **Component Structure**: Modular components in `/client/src/components/` with reusable UI components in `/client/src/components/ui/`

### Backend Architecture
- **API Routes**: RESTful endpoints in `/server/routes.ts` for dashboard stats, submissions, and leaderboard
- **Database Layer**: Drizzle ORM with connection pooling via Neon serverless
- **Services**: Separate service classes for Discord bot, RetroAchievements API, and Wordle API integration
- **Middleware**: Express middleware for logging, JSON parsing, and error handling

### Database Schema
The application uses four main tables:
- **users**: Stores Discord user information, scores, and prize eligibility
- **submissions**: Tracks daily Wordle submissions with achievement URLs and validation
- **wordleSolutions**: Caches Wordle solutions by date
- **botConfig**: Stores bot configuration key-value pairs

### Discord Bot Integration
- **Command System**: 7 slash commands including user registration and submissions
- **User Registration**: `/register` command allows users to link Discord accounts to RetroAchievements usernames
- **Achievement Validation**: Validates RetroAchievements URLs against current Wordle solution using registered usernames
- **Date Validation**: Ensures users can only submit achievements earned on the same day as the Wordle solution
- **User Management**: Automatic user creation and score tracking with proper account linking

## Data Flow

1. **User Interaction**: Users interact with the Discord bot via slash commands
2. **Submission Processing**: Bot validates RetroAchievements URLs and extracts achievement data
3. **Database Storage**: Valid submissions are stored with user information and achievement details
4. **Dashboard Display**: React frontend queries API endpoints to display real-time statistics
5. **External API Calls**: Backend services fetch data from RetroAchievements and Wordle APIs

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **Discord**: Discord.js for bot functionality
- **APIs**: RetroAchievements API and RapidAPI Wordle service
- **UI Library**: Radix UI primitives with shadcn/ui components

### Development Tools
- **Build System**: Vite for frontend bundling, esbuild for backend
- **Type Safety**: TypeScript across the entire stack
- **Database Migrations**: Drizzle Kit for schema management
- **Styling**: Tailwind CSS with CSS variables for theming

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public/`
- **Backend**: esbuild bundles server code to `dist/`
- **Database**: Drizzle migrations handled via `db:push` script

### Environment Configuration
The application requires several environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `DISCORD_BOT_TOKEN`: Discord bot authentication
- `RETROACHIEVEMENTS_USERNAME` and `RETROACHIEVEMENTS_API_KEY`: RetroAchievements API access
- `RAPIDAPI_KEY`: Wordle API access

### Production Setup
- Backend serves both API endpoints and static frontend files
- Database connections use connection pooling for scalability
- Error handling and logging for production monitoring
- CORS and security middleware for API protection

The application is designed to be deployed as a single Node.js process that handles both the web dashboard and Discord bot functionality.