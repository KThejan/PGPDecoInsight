import { Router } from "express";
import { db } from "@workspace/db";
import { recordsTable, operatorsTable, machineSettingsTable, shiftExecutivesTable } from "@workspace/db";
import { and, gte, lte, SQL } from "drizzle-orm";

const router = Router();

interface MachineSettingsMap {
  [machine: string]: { pc: number; qc: number; k: number; wp: number; wq: number; c: number };
}

async function getMachineSettingsMap(): Promise<MachineSettingsMap> {
  const rows = await db.select().from(machineSettingsTable);
  const map: MachineSettingsMap = {};
  for (const row of rows) {
    map[row.machine] = {
      pc: parseFloat(String(row.pc)),
      qc: parseFloat(String(row.qc)),
      k: parseFloat(String(row.k)),
      wp: parseFloat(String(row.wp)),
      wq: parseFloat(String(row.wq)),
      c: parseFloat(String(row.c)),
    };
  }
  return map;
}

function defaultSettings() {
  return { pc: 100, qc: 100, k: 50, wp: 0.6, wq: 0.4, c: 10 };
}

function calcScore(
  actual: number,
  target: number,
  defectPct: number,
  nextActual: number | null,
  nextTarget: number | null,
  settings: { pc: number; qc: number; k: number; wp: number; wq: number; c: number }
): number {
  const { pc, qc, k, wp, wq, c } = settings;
  const P = (actual / target) * pc;
  const Q = qc - (defectPct / 100) * k;
  const base = P * wp + Q * wq;

  let carry = 0;
  if (nextActual !== null && nextTarget !== null && nextTarget > 0) {
    const nsr = nextActual / nextTarget;
    carry = Math.max(0, (nsr - 1) * c);
  }

  return base + carry;
}

type RecordRow = {
  id: number;
  date: string;
  shift: string;
  shiftGroup: string;
  machine: string;
  operator1Id: number | null;
  operator2Id: number | null;
  targetQty: number;
  actualQty: number;
  defectPercentage: string;
};

function enrichWithScores(records: RecordRow[], settingsMap: MachineSettingsMap) {
  // Sort by date + shift order for carry bonus computation
  const shiftOrder = ["Morning", "Afternoon", "Night"];
  const sorted = [...records].sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    return shiftOrder.indexOf(a.shift) - shiftOrder.indexOf(b.shift);
  });

  return sorted.map((rec, idx) => {
    const settings = settingsMap[rec.machine] ?? defaultSettings();
    const defPct = parseFloat(String(rec.defectPercentage));

    // Find next record for same machine (carry bonus)
    const nextRec = sorted.slice(idx + 1).find(r => r.machine === rec.machine) ?? null;

    const score = calcScore(
      rec.actualQty,
      rec.targetQty,
      defPct,
      nextRec?.actualQty ?? null,
      nextRec?.targetQty ?? null,
      settings
    );

    return { ...rec, score };
  });
}

function parseDateRange(dateFrom?: string, dateTo?: string, month?: string) {
  const conditions: SQL[] = [];
  if (month) {
    // month format: "2026-06"
    const [year, mon] = month.split("-");
    const start = `${year}-${mon.padStart(2, "0")}-01`;
    const lastDay = new Date(parseInt(year), parseInt(mon), 0).getDate();
    const end = `${year}-${mon.padStart(2, "0")}-${lastDay}`;
    conditions.push(gte(recordsTable.date, start));
    conditions.push(lte(recordsTable.date, end));
  } else {
    if (dateFrom) conditions.push(gte(recordsTable.date, dateFrom));
    if (dateTo) conditions.push(lte(recordsTable.date, dateTo));
  }
  return conditions;
}

router.get("/rankings/operators", async (req, res) => {
  const { dateFrom, dateTo, month } = req.query as Record<string, string>;
  const conditions = parseDateRange(dateFrom, dateTo, month);

  const records = await db.select().from(recordsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(recordsTable.date);

  const operators = await db.select().from(operatorsTable);
  const settingsMap = await getMachineSettingsMap();

  const enriched = enrichWithScores(records as RecordRow[], settingsMap);

  // Aggregate per operator
  const opStats: Map<number, {
    operatorId: number;
    operatorName: string;
    shiftGroup: string;
    scores: number[];
    totalActual: number;
    defPcts: number[];
    machines: Set<string>;
  }> = new Map();

  const opMap = new Map(operators.map(o => [o.id, o]));

  for (const rec of enriched) {
    const opIds = [rec.operator1Id, rec.operator2Id].filter(Boolean) as number[];
    for (const opId of opIds) {
      const op = opMap.get(opId);
      if (!op) continue;
      if (!opStats.has(opId)) {
        opStats.set(opId, {
          operatorId: opId,
          operatorName: op.name,
          shiftGroup: op.shiftGroup,
          scores: [],
          totalActual: 0,
          defPcts: [],
          machines: new Set(),
        });
      }
      const stat = opStats.get(opId)!;
      stat.scores.push(rec.score);
      stat.totalActual += rec.actualQty;
      stat.defPcts.push(parseFloat(String(rec.defectPercentage)));
      stat.machines.add(rec.machine);
    }
  }

  const rankings = Array.from(opStats.values())
    .map(s => ({
      operatorId: s.operatorId,
      operatorName: s.operatorName,
      shiftGroup: s.shiftGroup,
      avgScore: s.scores.length > 0 ? s.scores.reduce((a, b) => a + b, 0) / s.scores.length : 0,
      totalRecords: s.scores.length,
      totalActual: s.totalActual,
      avgDefectPercentage: s.defPcts.length > 0 ? s.defPcts.reduce((a, b) => a + b, 0) / s.defPcts.length : 0,
      machines: Array.from(s.machines),
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .map((r, idx) => ({ ...r, rank: idx + 1, avgScore: parseFloat(r.avgScore.toFixed(1)) }));

  res.json(rankings);
});

router.get("/rankings/shifts", async (req, res) => {
  const { dateFrom, dateTo } = req.query as Record<string, string>;
  const conditions = parseDateRange(dateFrom, dateTo);

  const records = await db.select().from(recordsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const executives = await db.select().from(shiftExecutivesTable);
  const execMap = new Map(executives.map(e => [e.shiftGroup, e.executiveName]));
  const settingsMap = await getMachineSettingsMap();

  const enriched = enrichWithScores(records as RecordRow[], settingsMap);

  const shiftStats: Map<string, {
    shiftGroup: string;
    scores: number[];
    totalActual: number;
    totalTarget: number;
    defPcts: number[];
  }> = new Map();

  for (const sg of ["A", "B", "C", "D"]) {
    shiftStats.set(sg, { shiftGroup: sg, scores: [], totalActual: 0, totalTarget: 0, defPcts: [] });
  }

  for (const rec of enriched) {
    const stat = shiftStats.get(rec.shiftGroup);
    if (!stat) continue;
    stat.scores.push(rec.score);
    stat.totalActual += rec.actualQty;
    stat.totalTarget += rec.targetQty;
    stat.defPcts.push(parseFloat(String(rec.defectPercentage)));
  }

  const rankings = Array.from(shiftStats.values())
    .map(s => ({
      shiftGroup: s.shiftGroup,
      executiveName: execMap.get(s.shiftGroup) ?? "-",
      avgScore: s.scores.length > 0 ? parseFloat((s.scores.reduce((a, b) => a + b, 0) / s.scores.length).toFixed(1)) : null,
      totalRecords: s.scores.length,
      totalActual: s.totalActual,
      defectRate: s.defPcts.length > 0 ? parseFloat((s.defPcts.reduce((a, b) => a + b, 0) / s.defPcts.length).toFixed(2)) : 0,
      efficiency: s.totalTarget > 0 ? parseFloat(((s.totalActual / s.totalTarget) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => {
      if (a.avgScore === null && b.avgScore === null) return 0;
      if (a.avgScore === null) return 1;
      if (b.avgScore === null) return -1;
      return b.avgScore - a.avgScore;
    })
    .map((r, idx) => ({ ...r, rank: idx + 1 }));

  res.json(rankings);
});

router.get("/dashboard/stats", async (req, res) => {
  const { dateFrom, dateTo } = req.query as Record<string, string>;
  const conditions = parseDateRange(dateFrom, dateTo);

  const records = await db.select().from(recordsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const operators = await db.select().from(operatorsTable);
  const settingsMap = await getMachineSettingsMap();
  const enriched = enrichWithScores(records as RecordRow[], settingsMap);

  const totalActual = enriched.reduce((s, r) => s + r.actualQty, 0);
  const totalTarget = enriched.reduce((s, r) => s + r.targetQty, 0);
  const overallEfficiency = totalTarget > 0 ? parseFloat(((totalActual / totalTarget) * 100).toFixed(2)) : 0;
  const defPcts = enriched.map(r => parseFloat(String(r.defectPercentage)));
  const defectRate = defPcts.length > 0 ? parseFloat((defPcts.reduce((a, b) => a + b, 0) / defPcts.length).toFixed(2)) : 0;

  // Machine summary
  const machineMap: Map<string, { actualSum: number; targetSum: number; records: number; defPcts: number[] }> = new Map();
  for (const rec of enriched) {
    if (!machineMap.has(rec.machine)) machineMap.set(rec.machine, { actualSum: 0, targetSum: 0, records: 0, defPcts: [] });
    const m = machineMap.get(rec.machine)!;
    m.actualSum += rec.actualQty;
    m.targetSum += rec.targetQty;
    m.records += 1;
    m.defPcts.push(parseFloat(String(rec.defectPercentage)));
  }

  const machineSummary = Array.from(machineMap.entries()).map(([machine, m]) => ({
    machine,
    totalActual: m.actualSum,
    totalTarget: m.targetSum,
    records: m.records,
    defectRate: m.defPcts.length > 0 ? parseFloat((m.defPcts.reduce((a, b) => a + b, 0) / m.defPcts.length).toFixed(2)) : 0,
    efficiencyPct: m.targetSum > 0 ? parseFloat(((m.actualSum / m.targetSum) * 100).toFixed(2)) : 0,
  }));

  // Top 5 operators
  const opMap = new Map(operators.map(o => [o.id, o]));
  const opStats: Map<number, { scores: number[] }> = new Map();

  for (const rec of enriched) {
    for (const opId of [rec.operator1Id, rec.operator2Id].filter(Boolean) as number[]) {
      if (!opStats.has(opId)) opStats.set(opId, { scores: [] });
      opStats.get(opId)!.scores.push(rec.score);
    }
  }

  const top5Operators = Array.from(opStats.entries())
    .map(([opId, s]) => ({
      operatorId: opId,
      operatorName: opMap.get(opId)?.name ?? "Unknown",
      shiftGroup: opMap.get(opId)?.shiftGroup ?? "-",
      avgScore: parseFloat((s.scores.reduce((a, b) => a + b, 0) / s.scores.length).toFixed(1)),
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 5)
    .map((r, idx) => ({ ...r, rank: idx + 1 }));

  res.json({ totalActual, totalTarget, overallEfficiency, defectRate, machineSummary, top5Operators });
});

export default router;
