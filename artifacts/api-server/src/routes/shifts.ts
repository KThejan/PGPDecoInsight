import { Router } from "express";
import { db } from "@workspace/db";
import { shiftExecutivesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/shifts/executives", async (req, res) => {
  const rows = await db.select().from(shiftExecutivesTable).orderBy(shiftExecutivesTable.shiftGroup);
  res.json(rows.map(r => ({ shiftGroup: r.shiftGroup, executiveName: r.executiveName })));
});

router.put("/shifts/executives/:shiftGroup", async (req, res) => {
  const shiftGroup = req.params.shiftGroup;
  const { executiveName } = req.body;
  if (!executiveName) {
    res.status(400).json({ error: "executiveName required" });
    return;
  }

  const existing = await db.select().from(shiftExecutivesTable).where(eq(shiftExecutivesTable.shiftGroup, shiftGroup));
  let row;
  if (existing[0]) {
    const updated = await db.update(shiftExecutivesTable)
      .set({ executiveName, updatedAt: new Date() })
      .where(eq(shiftExecutivesTable.shiftGroup, shiftGroup))
      .returning();
    row = updated[0];
  } else {
    const inserted = await db.insert(shiftExecutivesTable)
      .values({ shiftGroup, executiveName })
      .returning();
    row = inserted[0];
  }

  res.json({ shiftGroup: row.shiftGroup, executiveName: row.executiveName });
});

export default router;
