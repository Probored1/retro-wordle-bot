import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubmissionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get recent submissions
  app.get("/api/submissions/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const submissions = await storage.getRecentSubmissions(limit);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching recent submissions:", error);
      res.status(500).json({ message: "Failed to fetch recent submissions" });
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Get current Wordle solution
  app.get("/api/wordle/current", async (req, res) => {
    try {
      const solution = await storage.getCurrentWordleSolution();
      res.json(solution);
    } catch (error) {
      console.error("Error fetching current Wordle solution:", error);
      res.status(500).json({ message: "Failed to fetch Wordle solution" });
    }
  });

  // Get system status
  app.get("/api/system/status", async (req, res) => {
    try {
      const status = await storage.getSystemStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching system status:", error);
      res.status(500).json({ message: "Failed to fetch system status" });
    }
  });

  // Get all submissions (paginated)
  app.get("/api/submissions", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const submissions = await storage.getSubmissions(page, limit);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  // Get user by Discord ID
  app.get("/api/users/:discordId", async (req, res) => {
    try {
      const user = await storage.getUserByDiscordId(req.params.discordId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin: Reset all scores
  app.post("/api/admin/reset-scores", async (req, res) => {
    try {
      await storage.resetAllScores();
      res.json({ message: "All scores reset successfully" });
    } catch (error) {
      console.error("Error resetting scores:", error);
      res.status(500).json({ message: "Failed to reset scores" });
    }
  });

  // Admin: Export data
  app.get("/api/admin/export", async (req, res) => {
    try {
      const data = await storage.exportAllData();
      res.json(data);
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
