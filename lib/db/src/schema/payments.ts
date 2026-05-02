import { pgTable, serial, text, numeric, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  leaseId: integer("lease_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  propertyId: integer("property_id").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }),
  lateFee: numeric("late_fee", { precision: 12, scale: 2 }),
  dueDate: date("due_date").notNull(),
  paidDate: date("paid_date"),
  status: text("status", { enum: ["pending", "paid", "partial", "overdue", "failed"] }).notNull().default("pending"),
  paymentMethod: text("payment_method", { enum: ["upi", "card", "cash", "bank_transfer", "razorpay", "stripe"] }),
  transactionId: text("transaction_id"),
  invoiceNumber: text("invoice_number").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
