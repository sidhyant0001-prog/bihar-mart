import { pgTable, serial, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const propertiesTable = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["flat", "shop", "grocery_store", "market"] }).notNull(),
  bhk: integer("bhk"),
  sizeSqft: numeric("size_sqft", { precision: 10, scale: 2 }).notNull(),
  floor: integer("floor"),
  blockOrSector: text("block_or_sector"),
  address: text("address").notNull(),
  locality: text("locality").notNull(),
  landmark: text("landmark"),
  rentPrice: numeric("rent_price", { precision: 12, scale: 2 }),
  salePriceINR: numeric("sale_price_inr", { precision: 14, scale: 2 }),
  rentPeriod: text("rent_period", { enum: ["daily", "weekly", "monthly", "yearly"] }),
  purpose: text("purpose", { enum: ["rent", "sale", "both"] }).notNull(),
  status: text("status", { enum: ["available", "occupied", "for_sale"] }).notNull().default("available"),
  description: text("description"),
  photos: text("photos").array().notNull().default([]),
  businessType: text("business_type"),
  amenities: text("amenities").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPropertySchema = createInsertSchema(propertiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof propertiesTable.$inferSelect;
