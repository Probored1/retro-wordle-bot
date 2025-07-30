require('dotenv').config();
const { Client, GatewayIntentBits, Events, SlashCommandBuilder, REST, Routes } = require('discord.js');
const { RetroAchievementsService } = require('./retro-achievements');
const { WordleService } = require('./wordle');

// In-memory storage for standalone bot
class MemoryStorage {
  constructor() {
    this.users = new Map();
    this.submissions = new Map();
  }

  getUserByDiscordId(discordId) {
    return Array.from(this.users.values()).find(user => user.discordId === discordId);
  }

  createUser(userData) {
    const user = {
      id: Date.now().toString(),
      discordId: userData.discordId,
      username: userData.username,
      score: 0,
      prizeEligible: false,
      lastSubmission: null
    };
    this.users.set(user.id, user);
    return user;
  }

  updateUserScore(userId, score, prizeEligible) {
    const user = this.users.get(userId);
    if (user) {
      user.score = score;
      user.prizeEligible = prizeEligible;
      user.lastSubmission = new Date();
    }
  }

  getUserSubmissionForDate(userId, date) {
    return Array.from(this.submissions.values()).find(
      sub => sub.userId === userId && sub.wordleDate === date
    );
  }

  createSubmission(submissionData) {
    const submission = {
      id: Date.now().toString(),
      ...submissionData,
      submittedAt: new Date()
    };
    this.submissions.set(submission.id, submission);
    return submission;
  }

  deleteUserSubmissionForDate(userId, date) {
    const submission = this.getUserSubmissionForDate(userId, date);
    if (submission) {
      this.submissions.delete(submission.id);
      return true;
    }
    return false;
  }

  getLeaderboard(limit = 10) {
    return Array.from(this.users.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  getUserSubmissions(userId) {
    return Array.from(this.submissions.values())
      .filter(sub => sub.userId === userId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }
}

class DiscordBot {
  constructor() {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds]
    });
    
    this.retroAchievementsService = new RetroAchievementsService();
    this.wordleService = new WordleService();
    this.storage = new MemoryStorage();
    this.commands = new Map();
    
    this.setupCommands();
    this.setupEventHandlers();
  }

  setupCommands() {
    // Submit command
    const submitCommand = {
      data: new SlashCommandBuilder()
        .setName('submit')
        .setDescription('Submit 5 achievements matching today\'s Wordle letters')
        .addStringOption(option =>
          option.setName('achievement1')
            .setDescription('First achievement URL')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('achievement2')
            .setDescription('Second achievement URL')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('achievement3')
            .setDescription('Third achievement URL')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('achievement4')
            .setDescription('Fourth achievement URL')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('achievement5')
            .setDescription('Fifth achievement URL')
            .setRequired(true)),
      async execute(interaction) {
        await interaction.deferReply();

        try {
          const achievementUrls = [
            interaction.options.getString('achievement1'),
            interaction.options.getString('achievement2'),
            interaction.options.getString('achievement3'),
            interaction.options.getString('achievement4'),
            interaction.options.getString('achievement5'),
          ];

          const wordleSolution = this.wordleService.getCurrentSolution();
          const achievements = [];
          const errors = [];
          const validLetters = [];
          const today = new Date().toISOString().split('T')[0];

          for (let i = 0; i < achievementUrls.length; i++) {
            const url = achievementUrls[i];
            const letter = wordleSolution.solution[i].toLowerCase();

            try {
              if (!this.retroAchievementsService.isValidRetroAchievementsUrl(url)) {
                errors.push(`Achievement ${i + 1}: Invalid RetroAchievements URL format`);
                continue;
              }

              const validation = await this.retroAchievementsService.validateUserAchievementToday(
                interaction.user.username, 
                url, 
                today
              );

              if (!validation.valid || !validation.achievement) {
                if (!validation.achievement) {
                  errors.push(`Achievement ${i + 1}: Achievement not found or invalid URL`);
                } else {
                  errors.push(`Achievement ${i + 1}: You must earn "${validation.achievement.title}" today (${today}) to submit it`);
                }
                continue;
              }

              const achievement = validation.achievement;
              const achievementFirstLetter = achievement.title.charAt(0).toLowerCase();
              
              if (achievementFirstLetter === letter) {
                validLetters.push(letter.toUpperCase());
                achievements.push({
                  url,
                  id: achievement.id,
                  title: achievement.title,
                  letter: letter.toUpperCase()
                });
              } else {
                errors.push(`Achievement ${i + 1}: "${achievement.title}" starts with "${achievement.title.charAt(0).toUpperCase()}" but needs "${letter.toUpperCase()}"`);
              }
            } catch (error) {
              console.error(`Error validating achievement ${i + 1}:`, error);
              errors.push(`Achievement ${i + 1}: Failed to validate - please try again`);
            }
          }

          const isValid = errors.length === 0 && achievements.length === 5;

          let user = this.storage.getUserByDiscordId(interaction.user.id);
          if (!user) {
            user = this.storage.createUser({
              discordId: interaction.user.id,
              username: interaction.user.username,
            });
          }

          const existingSubmission = this.storage.getUserSubmissionForDate(user.id, today);
          if (existingSubmission) {
            await interaction.editReply('❌ You have already submitted for today! Come back tomorrow for the next Wordle.');
            return;
          }

          this.storage.createSubmission({
            userId: user.id,
            wordleDate: today,
            wordleSolution: wordleSolution.solution,
            achievements,
            isValid,
            validationDetails: { errors, validLetters }
          });

          if (isValid) {
            const newScore = (user.score || 0) + 1;
            const prizeEligible = newScore >= 30;
            
            this.storage.updateUserScore(user.id, newScore, prizeEligible);

            let response = `🎉 **Valid submission!** You earned +1 point!\n\n`;
            response += `**Today's Wordle:** ${wordleSolution.solution}\n`;
            response += `**Your Score:** ${newScore}/30\n\n`;
            response += `**Achievements:**\n`;
            achievements.forEach((ach, i) => {
              response += `${ach.letter}: ${ach.title}\n`;
            });

            if (prizeEligible && newScore === 30) {
              response += `\n🏆 **CONGRATULATIONS!** You're now eligible for a prize! You've completed 30 successful Wordle Achievement submissions!`;
            } else if (newScore < 30) {
              response += `\n📈 Progress: ${30 - newScore} more submissions needed for prize eligibility!`;
            }

            await interaction.editReply(response);
          } else {
            let response = `❌ **Invalid submission.** No points awarded.\n\n`;
            response += `**Today's Wordle:** ${wordleSolution.solution}\n`;
            response += `**Required Letters:** ${wordleSolution.solution.split('').join(', ')}\n\n`;
            response += `**Errors:**\n`;
            errors.forEach(error => {
              response += `• ${error}\n`;
            });

            if (validLetters.length > 0) {
              response += `\n**Valid Letters:** ${validLetters.join(', ')}\n`;
            }

            await interaction.editReply(response);
          }
        } catch (error) {
          console.error('Error processing submission:', error);
          await interaction.editReply('❌ An error occurred while processing your submission. Please try again later.');
        }
      }
    };

    // Stats command
    const statsCommand = {
      data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View your Wordle Achievement Event stats'),
      async execute(interaction) {
        await interaction.deferReply();

        try {
          const user = this.storage.getUserByDiscordId(interaction.user.id);
          if (!user) {
            await interaction.editReply('❌ You haven\'t participated in the event yet! Use `/submit` to get started.');
            return;
          }

          const userSubmissions = this.storage.getUserSubmissions(user.id);
          const successfulSubmissions = userSubmissions.filter(s => s.isValid).length;
          const totalSubmissions = userSubmissions.length;

          let response = `📊 **Your Wordle Achievement Stats**\n\n`;
          response += `**Score:** ${user.score}/30\n`;
          response += `**Successful Submissions:** ${successfulSubmissions}\n`;
          response += `**Total Submissions:** ${totalSubmissions}\n`;
          
          if (user.prizeEligible) {
            response += `\n🏆 **You are eligible for a prize!**`;
          } else {
            response += `\n📈 **${30 - user.score} more successful submissions needed for prize eligibility!**`;
          }

          if (user.lastSubmission) {
            const lastSubmission = new Date(user.lastSubmission);
            response += `\n\n**Last Submission:** ${lastSubmission.toLocaleDateString()}`;
          }

          await interaction.editReply(response);
        } catch (error) {
          console.error('Error fetching user stats:', error);
          await interaction.editReply('❌ An error occurred while fetching your stats. Please try again later.');
        }
      }
    };

    // Leaderboard command
    const leaderboardCommand = {
      data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the current leaderboard'),
      async execute(interaction) {
        await interaction.deferReply();

        try {
          const leaderboard = this.storage.getLeaderboard(10);
          
          let response = `🏆 **Wordle Achievement Leaderboard**\n\n`;
          
          if (leaderboard.length === 0) {
            response += 'No participants yet! Be the first to submit with `/submit`.';
          } else {
            leaderboard.forEach((user, index) => {
              const rank = index + 1;
              const trophy = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
              const eligible = user.prizeEligible ? ' 🏆' : '';
              response += `${trophy} **${user.username}** - ${user.score} points${eligible}\n`;
            });
          }

          await interaction.editReply(response);
        } catch (error) {
          console.error('Error fetching leaderboard:', error);
          await interaction.editReply('❌ An error occurred while fetching the leaderboard. Please try again later.');
        }
      }
    };

    // Help command
    const helpCommand = {
      data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Learn how to participate in the Wordle Achievement Event'),
      async execute(interaction) {
        let response = `🎮 **Wordle Achievement Event Help**\n\n`;
        response += `**How it works:**\n`;
        response += `1. Each day, get the daily Wordle solution\n`;
        response += `2. Find 5 achievements on RetroAchievements.org whose titles start with each letter of the Wordle\n`;
        response += `3. Use \`/submit\` with the 5 achievement URLs\n`;
        response += `4. Earn +1 point for each valid submission\n`;
        response += `5. Reach 30 points to become eligible for a prize!\n\n`;
        
        response += `**Commands:**\n`;
        response += `• \`/submit\` - Submit your 5 achievements\n`;
        response += `• \`/stats\` - View your progress\n`;
        response += `• \`/leaderboard\` - See top participants\n`;
        response += `• \`/wordle\` - Get today's Wordle letters\n`;
        response += `• \`/help\` - Show this help message\n`;
        response += `• \`/reset\` - Reset daily submission (testing)\n\n`;
        
        response += `**Rules:**\n`;
        response += `• One submission per day\n`;
        response += `• Achievement titles must start with the exact Wordle letters\n`;
        response += `• URLs must be from retroachievements.org\n`;
        response += `• **NEW:** Achievements must be earned TODAY (same day as Wordle solution)\n`;
        response += `• All 5 achievements must be valid to earn a point`;

        await interaction.editReply(response);
      }
    };

    // Wordle command
    const wordleCommand = {
      data: new SlashCommandBuilder()
        .setName('wordle')
        .setDescription('Get today\'s Wordle letters'),
      async execute(interaction) {
        await interaction.deferReply();

        try {
          const wordleSolution = this.wordleService.getCurrentSolution();
          const today = new Date().toLocaleDateString();
          const letters = wordleSolution.solution.split('').join(' - ');
          
          let response = `📅 **Today's Wordle (${today})**\n\n`;
          response += `**Letters:** ${letters}\n\n`;
          response += `Find achievements starting with each of these letters and use \`/submit\` to participate!`;

          await interaction.editReply(response);
        } catch (error) {
          console.error('Error fetching Wordle solution:', error);
          await interaction.editReply('❌ An error occurred while fetching today\'s Wordle. Please try again later.');
        }
      }
    };

    // Reset command
    const resetCommand = {
      data: new SlashCommandBuilder()
        .setName('reset')
        .setDescription('Reset your submission for today (testing only)')
        .addBooleanOption(option =>
          option.setName('confirm')
            .setDescription('Confirm you want to reset today\'s submission')
            .setRequired(true)),
      async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
          const confirm = interaction.options.getBoolean('confirm');
          if (!confirm) {
            await interaction.editReply('❌ Reset cancelled. Set confirm to true to reset your submission.');
            return;
          }

          const user = this.storage.getUserByDiscordId(interaction.user.id);
          if (!user) {
            await interaction.editReply('❌ You haven\'t participated in the event yet!');
            return;
          }

          const today = new Date().toISOString().split('T')[0];
          const deleted = this.storage.deleteUserSubmissionForDate(user.id, today);
          
          if (deleted) {
            await interaction.editReply('✅ Your submission for today has been reset. You can now submit again with `/submit`.');
          } else {
            await interaction.editReply('❌ No submission found for today to reset.');
          }
        } catch (error) {
          console.error('Error resetting submission:', error);
          await interaction.editReply('❌ An error occurred while resetting your submission.');
        }
      }
    };

    // Bind context and register commands
    submitCommand.execute = submitCommand.execute.bind(this);
    statsCommand.execute = statsCommand.execute.bind(this);
    leaderboardCommand.execute = leaderboardCommand.execute.bind(this);
    helpCommand.execute = helpCommand.execute.bind(this);
    wordleCommand.execute = wordleCommand.execute.bind(this);
    resetCommand.execute = resetCommand.execute.bind(this);

    this.commands.set('submit', submitCommand);
    this.commands.set('stats', statsCommand);
    this.commands.set('leaderboard', leaderboardCommand);
    this.commands.set('help', helpCommand);
    this.commands.set('wordle', wordleCommand);
    this.commands.set('reset', resetCommand);
  }

  setupEventHandlers() {
    this.client.once(Events.ClientReady, () => {
      console.log(`Discord bot ready! Logged in as ${this.client.user?.tag}`);
    });

    this.client.on(Events.InteractionCreate, async interaction => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error('Error executing command:', error);
        
        const errorMessage = '❌ There was an error while executing this command!';
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      }
    });
  }

  async registerCommands() {
    const commands = Array.from(this.commands.values()).map(cmd => cmd.data.toJSON());
    
    const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);
    
    try {
      console.log(`Started refreshing ${commands.length} application (/) commands.`);
      
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: commands }
      );
      
      console.log(`Successfully reloaded application (/) commands.`);
    } catch (error) {
      console.error('Error registering commands:', error);
    }
  }

  async start() {
    if (!process.env.DISCORD_BOT_TOKEN) {
      console.error('Discord bot token not provided');
      return;
    }

    try {
      await this.client.login(process.env.DISCORD_BOT_TOKEN);
      await this.registerCommands();
      this.wordleService.startDailyUpdate();
      console.log('Bot started successfully!');
    } catch (error) {
      console.error('Error starting bot:', error);
    }
  }
}

// Start the bot
const bot = new DiscordBot();
bot.start();