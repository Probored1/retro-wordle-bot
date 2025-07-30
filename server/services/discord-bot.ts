import { Client, Collection, Events, GatewayIntentBits, SlashCommandBuilder, REST, Routes } from "discord.js";
import { storage } from "../storage";
import { retroAchievementsService } from "./retro-achievements";
import { wordleService } from "./wordle";

class DiscordBot {
  private client: Client;
  private commands: Collection<string, any>;

  constructor() {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
    });
    this.commands = new Collection();
    this.setupCommands();
    this.setupEventHandlers();
  }

  private setupCommands() {
    // Submit command
    const submitCommand = {
      data: new SlashCommandBuilder()
        .setName('submit')
        .setDescription('Submit 5 RetroAchievements URLs for today\'s Wordle')
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
      async execute(interaction: any) {
        await interaction.deferReply();

        try {
          const achievementUrls = [
            interaction.options.getString('achievement1'),
            interaction.options.getString('achievement2'),
            interaction.options.getString('achievement3'),
            interaction.options.getString('achievement4'),
            interaction.options.getString('achievement5'),
          ];

          // Get current Wordle solution
          const wordleSolution = await wordleService.getCurrentSolution();
          if (!wordleSolution) {
            await interaction.editReply('❌ Could not fetch today\'s Wordle solution. Please try again later.');
            return;
          }

          // Validate achievements - must be earned today
          const achievements = [];
          const errors = [];
          const validLetters = [];
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

          for (let i = 0; i < achievementUrls.length; i++) {
            const url = achievementUrls[i];
            const letter = wordleSolution.solution[i].toLowerCase();

            try {
              // Validate URL format first
              if (!retroAchievementsService.isValidRetroAchievementsUrl(url)) {
                errors.push(`Achievement ${i + 1}: Invalid RetroAchievements URL format`);
                continue;
              }

              // Get or create user first to check for registered RA username
              let user = await storage.getUserByDiscordId(interaction.user.id);
              if (!user) {
                user = await storage.createUser({
                  discordId: interaction.user.id,
                  username: interaction.user.username,
                });
              }

              // Use registered RetroAchievements username or fallback to Discord username
              const raUsername = user.retroAchievementsUsername || interaction.user.username;

              // Check if user earned this achievement today
              const validation = await retroAchievementsService.validateUserAchievementToday(
                raUsername, 
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

          // Get user (should already exist from validation loop)
          let user = await storage.getUserByDiscordId(interaction.user.id);
          if (!user) {
            user = await storage.createUser({
              discordId: interaction.user.id,
              username: interaction.user.username,
            });
          }

          // Check if user already submitted today
          const existingSubmission = await storage.getUserSubmissionForDate(user.id, today);
          if (existingSubmission) {
            await interaction.editReply('❌ You have already submitted for today! Come back tomorrow for the next Wordle.');
            return;
          }

          // Create submission
          await storage.createSubmission({
            userId: user.id,
            wordleDate: today,
            wordleSolution: wordleSolution.solution,
            achievements,
            isValid,
            validationDetails: { errors, validLetters }
          });

          if (isValid) {
            // Update user score
            const newScore = (user.score || 0) + 1;
            const prizeEligible = newScore >= 30;
            
            await storage.updateUserScore(user.id, newScore, prizeEligible);

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
      async execute(interaction: any) {
        await interaction.deferReply();

        try {
          const user = await storage.getUserByDiscordId(interaction.user.id);
          if (!user) {
            await interaction.editReply('❌ You haven\'t participated in the event yet! Use `/submit` to get started.');
            return;
          }

          const userSubmissions = await storage.getUserSubmissions(user.id);
          const successfulSubmissions = userSubmissions.filter(s => s.isValid).length;
          const totalSubmissions = userSubmissions.length;

          let response = `📊 **Your Wordle Achievement Stats**\n\n`;
          response += `**Score:** ${user.score}/30\n`;
          response += `**Successful Submissions:** ${successfulSubmissions}\n`;
          response += `**Total Submissions:** ${totalSubmissions}\n`;
          
          if (user.retroAchievementsUsername) {
            response += `**RetroAchievements Username:** ${user.retroAchievementsUsername}\n`;
          } else {
            response += `**RetroAchievements Username:** Not registered (using Discord username)\n`;
            response += `*Use \`/register\` to link your RetroAchievements account*\n`;
          }
          
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
      async execute(interaction: any) {
        await interaction.deferReply();

        try {
          const leaderboard = await storage.getLeaderboard(10);
          
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
      async execute(interaction: any) {
        let response = `🎮 **Wordle Achievement Event Help**\n\n`;
        response += `**How it works:**\n`;
        response += `1. First, use \`/register\` to link your RetroAchievements username\n`;
        response += `2. Each day, get the daily Wordle solution\n`;
        response += `3. Find 5 achievements on RetroAchievements.org whose titles start with each letter of the Wordle\n`;
        response += `4. Use \`/submit\` with the 5 achievement URLs\n`;
        response += `5. Earn +1 point for each valid submission\n`;
        response += `6. Reach 30 points to become eligible for a prize!\n\n`;
        
        response += `**Example:**\n`;
        response += `If today's Wordle is "GAMES":\n`;
        response += `• G: "Gold Medal" achievement\n`;
        response += `• A: "All Clear" achievement\n`;
        response += `• M: "Master Key" achievement\n`;
        response += `• E: "Expert Mode" achievement\n`;
        response += `• S: "Speed Run" achievement\n\n`;
        
        response += `**Commands:**\n`;
        response += `• \`/register\` - Link your RetroAchievements username\n`;
        response += `• \`/submit\` - Submit your 5 achievements\n`;
        response += `• \`/stats\` - View your progress\n`;
        response += `• \`/leaderboard\` - See top participants\n`;
        response += `• \`/wordle\` - Get today's Wordle letters\n`;
        response += `• \`/help\` - Show this help message\n\n`;
        
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
      async execute(interaction: any) {
        await interaction.deferReply();

        try {
          const wordleSolution = await wordleService.getCurrentSolution();
          if (!wordleSolution) {
            await interaction.editReply('❌ Could not fetch today\'s Wordle solution. Please try again later.');
            return;
          }

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

    // Reset command for testing (admin only)
    const resetCommand = {
      data: new SlashCommandBuilder()
        .setName('reset')
        .setDescription('Reset your submission for today (testing only)')
        .addBooleanOption(option =>
          option.setName('confirm')
            .setDescription('Confirm you want to reset today\'s submission')
            .setRequired(true)),
      async execute(interaction: any) {
        await interaction.deferReply({ ephemeral: true });

        try {
          const confirm = interaction.options.getBoolean('confirm');
          if (!confirm) {
            await interaction.editReply('❌ Reset cancelled. Set confirm to true to reset your submission.');
            return;
          }

          const user = await storage.getUserByDiscordId(interaction.user.id);
          if (!user) {
            await interaction.editReply('❌ You haven\'t participated in the event yet!');
            return;
          }

          const today = new Date().toISOString().split('T')[0];
          const deleted = await storage.deleteUserSubmissionForDate(user.id, today);
          
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

    // Register command
    const registerCommand = {
      data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Link your Discord account to your RetroAchievements username')
        .addStringOption(option =>
          option.setName('username')
            .setDescription('Your RetroAchievements username')
            .setRequired(true)),
      async execute(interaction: any) {
        await interaction.deferReply({ ephemeral: true });

        try {
          const raUsername = interaction.options.getString('username');
          
          // Validate username format (basic check)
          if (!raUsername || raUsername.length < 2 || raUsername.length > 50) {
            await interaction.editReply('❌ Please provide a valid RetroAchievements username (2-50 characters).');
            return;
          }

          // Get or create user
          let user = await storage.getUserByDiscordId(interaction.user.id);
          if (!user) {
            user = await storage.createUser({
              discordId: interaction.user.id,
              username: interaction.user.username,
            });
          }

          // Update RetroAchievements username
          await storage.updateUserRetroAchievementsUsername(user.id, raUsername);

          let response = `✅ **Registration successful!**\n\n`;
          response += `Your Discord account is now linked to RetroAchievements username: **${raUsername}**\n\n`;
          response += `This username will be used to validate that you earned achievements on the correct day when using \`/submit\`.\n\n`;
          response += `You can update this anytime by running \`/register\` again with a different username.`;

          await interaction.editReply(response);
        } catch (error) {
          console.error('Error registering user:', error);
          await interaction.editReply('❌ An error occurred while registering your RetroAchievements username. Please try again later.');
        }
      }
    };

    this.commands.set('submit', submitCommand);
    this.commands.set('stats', statsCommand);
    this.commands.set('leaderboard', leaderboardCommand);
    this.commands.set('help', helpCommand);
    this.commands.set('wordle', wordleCommand);
    this.commands.set('reset', resetCommand);
    this.commands.set('register', registerCommand);
  }

  private setupEventHandlers() {
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
        const reply = { content: 'There was an error executing this command!', ephemeral: true };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
    });
  }

  async deployCommands() {
    const token = process.env.DISCORD_BOT_TOKEN;
    const clientId = process.env.DISCORD_CLIENT_ID;
    const guildId = process.env.DISCORD_GUILD_ID;

    if (!token || !clientId) {
      console.error('Missing Discord bot configuration');
      return;
    }

    const rest = new REST().setToken(token);

    try {
      const commands = Array.from(this.commands.values()).map(cmd => cmd.data.toJSON());
      
      console.log(`Started refreshing ${commands.length} application (/) commands.`);

      if (guildId) {
        // Guild-specific deployment (for testing)
        await rest.put(
          Routes.applicationGuildCommands(clientId, guildId),
          { body: commands },
        );
      } else {
        // Global deployment (for production)
        await rest.put(
          Routes.applicationCommands(clientId),
          { body: commands }
        );
      }

      console.log(`Successfully reloaded application (/) commands.`);
    } catch (error) {
      console.error('Error deploying commands:', error);
    }
  }

  async start() {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      console.error('Discord bot token not provided');
      return;
    }

    try {
      await this.client.login(token);
      await this.deployCommands();
    } catch (error) {
      console.error('Error starting Discord bot:', error);
    }
  }

  getClient() {
    return this.client;
  }
}

export const discordBot = new DiscordBot();
