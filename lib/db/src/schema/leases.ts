import { pgTable, serial, text, numeric, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leasesTable = pgTable("leases", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  rentAmount: numeric("rent_amount", { precision: 12, scale: 2 }).notNull(),
  rentPeriod: text("rent_period", { enum: ["daily", "weekly", "monthly", "yearly"] }).notNull(),
  securityDeposit: numeric("security_deposit", { precision: 12, scale: 2 }),
  status: text("status", { enum: ["active", "expired", "terminated"] }).notNull().default("active"),
  autoRenew: boolean("auto_renew").notNull().default(false),
  lateFeePercentage: numeric("late_fee_percentage", { precision: 5, scale: 2 }),
  gracePeriodDays: integer("grace_period_days"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLeaseSchema = createInsertSchema(leasesTable).omit({ id: true, createdAt: true });
export type InsertLease = z.infer<typeof insertLeaseSchema>;
export type Lease = typeof leasesTable.$inferSelect;
