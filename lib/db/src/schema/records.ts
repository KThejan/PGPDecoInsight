import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recordsTable = sqliteTable("production_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  shift: text("shift").notNull(),
  shiftGroup: text("shift_group").notNull(),
  machine: text("machine").notNull(),
  operator1Id: integer("operator1_id"),
  operator2Id: integer("operator2_id"),
  targetQty: integer("target_qty").notNull(),
  actualQty: integer("actual_qty").notNull(),
  defectPercentage: real("defect_percentage").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertRecordSchema = createInsertSchema(recordsTable).omit({ id: true, createdAt: true });
export type InsertRecord = z.infer<typeof insertRecordSchema>;
export type ProductionRecord = typeof recordsTable.$inferSelect;
