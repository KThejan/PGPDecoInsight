import { Router } from "express";
import { db } from "@workspace/db";
import { machineSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const toNum = (v: unknown) => parseFloat(String(v));

const format = (row: typeof machineSettingsTable.$inferSelect) => ({
  machine: row.machine,
  pc: toNum(row.pc),
  qc: toNum(row.qc),
  k: toNum(row.k),
  wp: toNum(row.wp),
  wq: toNum(row.wq),
  c: toNum(row.c),
});

router.get("/settings/machines", async (req, res) => {
  const rows = await db.select().from(machineSettingsTable).orderBy(machineSettingsTable.machine);
  res.json(rows.map(format));
});

router.put("/settings/machines/:machine", async (req, res) => {
  const machine = decodeURIComponent(req.params.machine);
  const { pc, qc, k, wp, wq, c } = req.body;

  const existing = await db.select().from(machineSettingsTable).where(eq(machineSettingsTable.machine, machine));

  let row;
  if (existing[0]) {
    const updated = await db.update(machineSettingsTable)
      .set({
        pc: parseFloat(pc),
        qc: parseFloat(qc),
        k: parseFloat(k),
        wp: parseFloat(wp),
        wq: parseFloat(wq),
        c: parseFloat(c),
        updatedAt: new Date(),
      })
      .where(eq(machineSettingsTable.machine, machine))
      .returning();
    row = updated[0];
  } else {
    const inserted = await db.insert(machineSettingsTable)
      .values({ machine, pc: parseFloat(pc), qc: parseFloat(qc), k: parseFloat(k), wp: parseFloat(wp), wq: parseFloat(wq), c: parseFloat(c) })
      .returning();
    row = inserted[0];
  }

  res.json(format(row));
});

export default router;
