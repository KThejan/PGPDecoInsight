import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shiftExecutivesTable = pgTable("shift_executives", {
  id: serial("id").primaryKey(),
  shiftGroup: text("shift_group").notNull().unique(),
  executiveName: text("executive_name").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertShiftExecutiveSchema = createInsertSchema(shiftExecutivesTable).omit({ id: true, updatedAt: true });
export type InsertShiftExecutive = z.infer<typeof insertShiftExecutiveSchema>;
export type ShiftExecutive = typeof shiftExecutivesTable.$inferSelect;
