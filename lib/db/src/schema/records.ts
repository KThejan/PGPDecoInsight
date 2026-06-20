import { pgTable, serial, text, integer, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recordsTable = pgTable("production_records", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  shift: text("shift").notNull(),
  shiftGroup: text("shift_group").notNull(),
  machine: text("machine").notNull(),
  operator1Id: integer("operator1_id"),
  operator2Id: integer("operator2_id"),
  targetQty: integer("target_qty").notNull(),
  actualQty: integer("actual_qty").notNull(),
  defectPercentage: numeric("defect_percentage", { precision: 8, scale: 4 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRecordSchema = createInsertSchema(recordsTable).omit({ id: true, createdAt: true });
export type InsertRecord = z.infer<typeof insertRecordSchema>;
export type ProductionRecord = typeof recordsTable.$inferSelect;
