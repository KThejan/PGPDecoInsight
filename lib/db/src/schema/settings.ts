import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const machineSettingsTable = pgTable("machine_settings", {
  id: serial("id").primaryKey(),
  machine: text("machine").notNull().unique(),
  pc: numeric("pc", { precision: 10, scale: 4 }).notNull().default("100"),
  qc: numeric("qc", { precision: 10, scale: 4 }).notNull().default("100"),
  k: numeric("k", { precision: 10, scale: 4 }).notNull().default("50"),
  wp: numeric("wp", { precision: 10, scale: 4 }).notNull().default("0.6"),
  wq: numeric("wq", { precision: 10, scale: 4 }).notNull().default("0.4"),
  c: numeric("c", { precision: 10, scale: 4 }).notNull().default("10"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMachineSettingsSchema = createInsertSchema(machineSettingsTable).omit({ id: true, updatedAt: true });
export type InsertMachineSettings = z.infer<typeof insertMachineSettingsSchema>;
export type MachineSettings = typeof machineSettingsTable.$inferSelect;
