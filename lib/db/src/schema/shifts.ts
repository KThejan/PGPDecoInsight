import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shiftExecutivesTable = sqliteTable("shift_executives", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  shiftGroup: text("shift_group").notNull().unique(),
  executiveName: text("executive_name").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertShiftExecutiveSchema = createInsertSchema(shiftExecutivesTable).omit({ id: true, updatedAt: true });
export type InsertShiftExecutive = z.infer<typeof insertShiftExecutiveSchema>;
export type ShiftExecutive = typeof shiftExecutivesTable.$inferSelect;
