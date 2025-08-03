import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCategorySchema, insertItemSchema, insertSettingsSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const category = insertCategorySchema.parse(req.body);
      const created = await storage.createCategory(category);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const updates = insertCategorySchema.partial().parse(req.body);
      const updated = await storage.updateCategory(req.params.id, updates);
      if (!updated) {
        res.status(404).json({ message: "Category not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update category" });
      }
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCategory(req.params.id);
      if (!deleted) {
        res.status(404).json({ message: "Category not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Items
  app.get("/api/items", async (req, res) => {
    try {
      const items = await storage.getItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get("/api/items/category/:categoryId", async (req, res) => {
    try {
      const items = await storage.getItemsByCategory(req.params.categoryId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.post("/api/items", async (req, res) => {
    try {
      const item = insertItemSchema.parse(req.body);
      const created = await storage.createItem(item);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid item data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create item" });
      }
    }
  });

  app.put("/api/items/:id", async (req, res) => {
    try {
      const updates = insertItemSchema.partial().parse(req.body);
      const updated = await storage.updateItem(req.params.id, updates);
      if (!updated) {
        res.status(404).json({ message: "Item not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid item data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update item" });
      }
    }
  });

  app.delete("/api/items/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteItem(req.params.id);
      if (!deleted) {
        res.status(404).json({ message: "Item not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  app.post("/api/items/reset", async (req, res) => {
    try {
      await storage.resetAllItems();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to reset items" });
    }
  });

  // Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const updates = insertSettingsSchema.partial().parse(req.body);
      const updated = await storage.updateSettings(updates);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
