import { Router } from "express";
import { db } from "@workspace/db";
import { operatorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/operators", async (req, res) => {
  const operators = await db.select().from(operatorsTable).orderBy(operatorsTable.shiftGroup, operatorsTable.name);
  res.json(operators);
});

router.post("/operators", async (req, res) => {
  const { name, shiftGroup } = req.body;
  if (!name || !shiftGroup) {
    res.status(400).json({ error: "Name and shiftGroup required" });
    return;
  }
  const inserted = await db.insert(operatorsTable).values({ name, shiftGroup }).returning();
  res.status(201).json(inserted[0]);
});

router.patch("/operators/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, shiftGroup } = req.body;
  const updated = await db.update(operatorsTable)
    .set({ ...(name && { name }), ...(shiftGroup && { shiftGroup }) })
    .where(eq(operatorsTable.id, id))
    .returning();
  if (!updated[0]) {
    res.status(404).json({ error: "Operator not found" });
    return;
  }
  res.json(updated[0]);
});

router.delete("/operators/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(operatorsTable).where(eq(operatorsTable.id, id));
  res.json({ message: "Operator deleted" });
});

export default router;
