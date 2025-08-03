import { type Category, type Item, type Settings, type InsertCategory, type InsertItem, type InsertSettings } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Items
  getItems(): Promise<Item[]>;
  getItemsByCategory(categoryId: string): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: string, item: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: string): Promise<boolean>;
  resetAllItems(): Promise<void>;

  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private categories: Map<string, Category>;
  private items: Map<string, Item>;
  private settings: Settings;

  constructor() {
    this.categories = new Map();
    this.items = new Map();
    this.settings = {
      id: randomUUID(),
      notificationTime: "08:00",
      is24HourFormat: true,
      lastResetDate: new Date().toDateString(),
    };

    // Initialize with default categories
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    const defaultCategories = [
      { name: "Devices", icon: "laptop", color: "blue" },
      { name: "Food", icon: "utensils", color: "green" },
      { name: "Keys", icon: "key", color: "yellow" },
      { name: "Miscellaneous", icon: "box", color: "purple" },
    ];

    defaultCategories.forEach(cat => {
      const id = randomUUID();
      const category: Category = {
        ...cat,
        id,
        createdAt: new Date(),
      };
      this.categories.set(id, category);

      // Add default items for each category
      const defaultItems = this.getDefaultItemsForCategory(cat.name);
      defaultItems.forEach(itemName => {
        const itemId = randomUUID();
        const item: Item = {
          id: itemId,
          name: itemName,
          categoryId: id,
          checked: false,
          createdAt: new Date(),
        };
        this.items.set(itemId, item);
      });
    });
  }

  private getDefaultItemsForCategory(categoryName: string): string[] {
    switch (categoryName) {
      case "Devices":
        return ["Laptop", "Phone Charger", "Headphones"];
      case "Food":
        return ["Rice", "Curry", "Snacks", "Water Bottle"];
      case "Keys":
        return ["House Keys", "Car Keys", "Office Keys"];
      case "Miscellaneous":
        return ["Wallet", "Sunglasses"];
      default:
        return [];
    }
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = {
      id,
      name: insertCategory.name,
      icon: insertCategory.icon || "box",
      color: insertCategory.color || "blue",
      createdAt: new Date(),
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;

    const updated = { ...category, ...updates };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    // Delete all items in this category first
    const categoryItems = Array.from(this.items.values()).filter(item => item.categoryId === id);
    categoryItems.forEach(item => this.items.delete(item.id));

    return this.categories.delete(id);
  }

  async getItems(): Promise<Item[]> {
    return Array.from(this.items.values());
  }

  async getItemsByCategory(categoryId: string): Promise<Item[]> {
    return Array.from(this.items.values()).filter(item => item.categoryId === categoryId);
  }

  async getItem(id: string): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = randomUUID();
    const item: Item = {
      id,
      name: insertItem.name,
      categoryId: insertItem.categoryId,
      checked: insertItem.checked || false,
      createdAt: new Date(),
    };
    this.items.set(id, item);
    return item;
  }

  async updateItem(id: string, updates: Partial<InsertItem>): Promise<Item | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;

    const updated = { ...item, ...updates };
    this.items.set(id, updated);
    return updated;
  }

  async deleteItem(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  async resetAllItems(): Promise<void> {
    this.items.forEach((item, id) => {
      this.items.set(id, { ...item, checked: false });
    });
    this.settings.lastResetDate = new Date().toDateString();
  }

  async getSettings(): Promise<Settings> {
    return this.settings;
  }

  async updateSettings(updates: Partial<InsertSettings>): Promise<Settings> {
    this.settings = { ...this.settings, ...updates };
    return this.settings;
  }
}

export const storage = new MemStorage();
