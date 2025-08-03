import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  icon: text("icon").notNull().default("box"),
  color: text("color").notNull().default("blue"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const items = pgTable("items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  categoryId: varchar("category_id").notNull(),
  checked: boolean("checked").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  notificationTime: text("notification_time").notNull().default("08:00"),
  is24HourFormat: boolean("is_24_hour_format").notNull().default(true),
  lastResetDate: text("last_reset_date").notNull().default(""),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

export type Category = typeof categories.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Settings = typeof settings.$inferSelect;
