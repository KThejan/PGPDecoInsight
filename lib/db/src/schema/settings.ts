import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const machineSettingsTable = sqliteTable("machine_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  machine: text("machine").notNull().unique(),
  pc: real("pc").notNull().default(100),
  qc: real("qc").notNull().default(100),
  k: real("k").notNull().default(50),
  wp: real("wp").notNull().default(0.6),
  wq: real("wq").notNull().default(0.4),
  c: real("c").notNull().default(10),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertMachineSettingsSchema = createInsertSchema(machineSettingsTable).omit({ id: true, updatedAt: true });
export type InsertMachineSettings = z.infer<typeof insertMachineSettingsSchema>;
export type MachineSettings = typeof machineSettingsTable.$inferSelect;
