import { Router } from "express";
import { db } from "@workspace/db";
import { recordsTable, operatorsTable } from "@workspace/db";
import { eq, and, gte, lte, SQL } from "drizzle-orm";

const router = Router();

router.get("/records", async (req, res) => {
  const { dateFrom, dateTo, shift, shiftGroup, machine } = req.query as Record<string, string>;

  const conditions: SQL[] = [];
  if (dateFrom) conditions.push(gte(recordsTable.date, dateFrom));
  if (dateTo) conditions.push(lte(recordsTable.date, dateTo));
  if (shift) conditions.push(eq(recordsTable.shift, shift));
  if (shiftGroup) conditions.push(eq(recordsTable.shiftGroup, shiftGroup));
  if (machine) conditions.push(eq(recordsTable.machine, machine));

  const records = await db.select().from(recordsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(recordsTable.date);

  // Fetch operator names
  const operators = await db.select().from(operatorsTable);
  const opMap = new Map(operators.map(o => [o.id, o]));

  const enriched = records.map(r => ({
    ...r,
    defectPercentage: parseFloat(r.defectPercentage as unknown as string),
    operator1Name: r.operator1Id ? opMap.get(r.operator1Id)?.name ?? null : null,
    operator2Name: r.operator2Id ? opMap.get(r.operator2Id)?.name ?? null : null,
    score: null,
  }));

  res.json(enriched);
});

router.post("/records", async (req, res) => {
  const { date, shift, shiftGroup, machine, operator1Id, operator2Id, targetQty, actualQty, defectPercentage } = req.body;
  if (!date || !shift || !shiftGroup || !machine) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const inserted = await db.insert(recordsTable).values({
    date,
    shift,
    shiftGroup,
    machine,
    operator1Id: operator1Id ?? null,
    operator2Id: operator2Id ?? null,
    targetQty: parseInt(targetQty),
    actualQty: parseInt(actualQty),
    defectPercentage: String(defectPercentage),
  }).returning();

  const record = inserted[0];
  const operators = await db.select().from(operatorsTable);
  const opMap = new Map(operators.map(o => [o.id, o]));

  res.status(201).json({
    ...record,
    defectPercentage: parseFloat(record.defectPercentage as unknown as string),
    operator1Name: record.operator1Id ? opMap.get(record.operator1Id)?.name ?? null : null,
    operator2Name: record.operator2Id ? opMap.get(record.operator2Id)?.name ?? null : null,
    score: null,
  });
});

router.patch("/records/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { date, shift, shiftGroup, machine, operator1Id, operator2Id, targetQty, actualQty, defectPercentage } = req.body;

  const updateFields: Record<string, unknown> = {};
  if (date !== undefined) updateFields.date = date;
  if (shift !== undefined) updateFields.shift = shift;
  if (shiftGroup !== undefined) updateFields.shiftGroup = shiftGroup;
  if (machine !== undefined) updateFields.machine = machine;
  if (operator1Id !== undefined) updateFields.operator1Id = operator1Id;
  if (operator2Id !== undefined) updateFields.operator2Id = operator2Id;
  if (targetQty !== undefined) updateFields.targetQty = parseInt(targetQty);
  if (actualQty !== undefined) updateFields.actualQty = parseInt(actualQty);
  if (defectPercentage !== undefined) updateFields.defectPercentage = String(defectPercentage);

  const updated = await db.update(recordsTable).set(updateFields).where(eq(recordsTable.id, id)).returning();
  if (!updated[0]) {
    res.status(404).json({ error: "Record not found" });
    return;
  }

  const record = updated[0];
  const operators = await db.select().from(operatorsTable);
  const opMap = new Map(operators.map(o => [o.id, o]));

  res.json({
    ...record,
    defectPercentage: parseFloat(record.defectPercentage as unknown as string),
    operator1Name: record.operator1Id ? opMap.get(record.operator1Id)?.name ?? null : null,
    operator2Name: record.operator2Id ? opMap.get(record.operator2Id)?.name ?? null : null,
    score: null,
  });
});

router.delete("/records/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(recordsTable).where(eq(recordsTable.id, id));
  res.json({ message: "Record deleted" });
});

export default router;
