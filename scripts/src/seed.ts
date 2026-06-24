import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { eq } from "drizzle-orm";
import path from "path";
import { fileURLToPath } from "url";
import {
  usersTable, operatorsTable, machineSettingsTable, shiftExecutivesTable, recordsTable,
} from "../../lib/db/src/schema/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH ?? path.resolve(__dirname, "../../database/db.sqlite");
const client = createClient({ url: `file:${dbPath}` });
const db = drizzle(client);

async function seed() {
  console.log("Seeding SQLite database at:", dbPath);

  const existingUser = await db.select().from(usersTable).where(eq(usersTable.username, "Admin"));
  if (existingUser.length === 0) {
    await db.insert(usersTable).values({ username: "Admin", password: "printing1234" });
    console.log("✓ Admin user created");
  } else {
    console.log("- Admin user already exists");
  }

  const machines = [
    { machine: "Techno 5", pc: 100, qc: 100, k: 50, wp: 0.6, wq: 0.4, c: 10 },
    { machine: "Kammann",  pc: 100, qc: 100, k: 50, wp: 0.6, wq: 0.4, c: 10 },
  ];
  for (const m of machines) {
    const exists = await db.select().from(machineSettingsTable).where(eq(machineSettingsTable.machine, m.machine));
    if (exists.length === 0) {
      await db.insert(machineSettingsTable).values(m);
      console.log(`✓ Machine settings created: ${m.machine}`);
    } else {
      console.log(`- Machine settings already exist: ${m.machine}`);
    }
  }

  const execs = [
    { shiftGroup: "A", executiveName: "Sasidu" },
    { shiftGroup: "B", executiveName: "Avishka" },
    { shiftGroup: "C", executiveName: "Sandun" },
    { shiftGroup: "D", executiveName: "Thejan" },
  ];
  for (const e of execs) {
    const exists = await db.select().from(shiftExecutivesTable).where(eq(shiftExecutivesTable.shiftGroup, e.shiftGroup));
    if (exists.length === 0) {
      await db.insert(shiftExecutivesTable).values(e);
      console.log(`✓ Shift executive created: Shift ${e.shiftGroup} — ${e.executiveName}`);
    } else {
      console.log(`- Shift executive already exists: Shift ${e.shiftGroup}`);
    }
  }

  const operators = [
    { name: "Chandu",   shiftGroup: "C" },
    { name: "Roshan",   shiftGroup: "A" },
    { name: "Sachith",  shiftGroup: "B" },
    { name: "Kapila",   shiftGroup: "C" },
    { name: "Premalal", shiftGroup: "B" },
    { name: "Kasun",    shiftGroup: "A" },
    { name: "Nimal",    shiftGroup: "D" },
    { name: "Sunil",    shiftGroup: "D" },
  ];
  const existingOps = await db.select().from(operatorsTable);
  if (existingOps.length === 0) {
    await db.insert(operatorsTable).values(operators);
    console.log(`✓ ${operators.length} operators created`);
  } else {
    console.log(`- Operators already exist (${existingOps.length})`);
  }

  const ops = await db.select().from(operatorsTable);
  const findOp = (name: string) => ops.find(o => o.name === name)?.id ?? null;

  const records = [
    { date: "2026-06-01", shift: "Morning",   shiftGroup: "A", machine: "Kammann",  operator1Id: findOp("Roshan"),   operator2Id: findOp("Kasun"),    targetQty: 10000, actualQty: 9800,  defectPercentage: 5.0 },
    { date: "2026-06-01", shift: "Afternoon", shiftGroup: "B", machine: "Techno 5", operator1Id: findOp("Sachith"),  operator2Id: findOp("Premalal"), targetQty: 12000, actualQty: 11800, defectPercentage: 3.5 },
    { date: "2026-06-01", shift: "Night",     shiftGroup: "C", machine: "Kammann",  operator1Id: findOp("Chandu"),   operator2Id: findOp("Kapila"),   targetQty: 10000, actualQty: 10500, defectPercentage: 2.0 },
    { date: "2026-06-02", shift: "Morning",   shiftGroup: "D", machine: "Techno 5", operator1Id: findOp("Nimal"),    operator2Id: findOp("Sunil"),    targetQty: 12000, actualQty: 10800, defectPercentage: 8.0 },
    { date: "2026-06-02", shift: "Afternoon", shiftGroup: "A", machine: "Kammann",  operator1Id: findOp("Roshan"),   operator2Id: null,              targetQty: 10000, actualQty: 10200, defectPercentage: 4.0 },
    { date: "2026-06-02", shift: "Night",     shiftGroup: "B", machine: "Techno 5", operator1Id: findOp("Sachith"),  operator2Id: findOp("Premalal"), targetQty: 12000, actualQty: 11500, defectPercentage: 6.0 },
    { date: "2026-06-03", shift: "Morning",   shiftGroup: "C", machine: "Kammann",  operator1Id: findOp("Chandu"),   operator2Id: findOp("Kapila"),   targetQty: 10000, actualQty: 11000, defectPercentage: 1.0 },
    { date: "2026-06-03", shift: "Afternoon", shiftGroup: "D", machine: "Techno 5", operator1Id: findOp("Nimal"),    operator2Id: findOp("Sunil"),    targetQty: 12000, actualQty: 10500, defectPercentage: 9.0 },
  ];

  const existingRecords = await db.select().from(recordsTable);
  if (existingRecords.length === 0) {
    await db.insert(recordsTable).values(records);
    console.log(`✓ ${records.length} sample production records created`);
  } else {
    console.log(`- Production records already exist (${existingRecords.length})`);
  }

  console.log("\nSeed complete.");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
