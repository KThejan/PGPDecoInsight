import { useState } from "react";
import {
  useListOperators, useCreateRecord,
  getListRecordsQueryKey, getGetDashboardStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MACHINES = ["Techno 5", "Kammann"];
const SHIFTS = ["Morning", "Afternoon", "Night"];
const GROUPS = ["A", "B", "C", "D"];

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function DataEntryPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: operators = [] } = useListOperators();
  const createRecord = useCreateRecord();

  const [form, setForm] = useState({
    date: today(),
    shift: "Morning",
    shiftGroup: "A",
    machine: "",
    operator1Id: "",
    operator2Id: "",
    targetQty: "0",
    actualQty: "0",
    defectQty: "0",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const actualNum = parseFloat(form.actualQty) || 0;
  const defectNum = parseFloat(form.defectQty) || 0;
  const computedDefectRate = actualNum > 0 ? (defectNum / actualNum) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.machine) { toast({ title: "Please select a machine", variant: "destructive" }); return; }

    const defectPercentage = actualNum > 0 ? (defectNum / actualNum) * 100 : 0;

    createRecord.mutate({
      data: {
        date: form.date,
        shift: form.shift,
        shiftGroup: form.shiftGroup,
        machine: form.machine,
        operator1Id: form.operator1Id ? parseInt(form.operator1Id) : null,
        operator2Id: form.operator2Id ? parseInt(form.operator2Id) : null,
        targetQty: parseInt(form.targetQty) || 0,
        actualQty: parseInt(form.actualQty) || 0,
        defectPercentage,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Record saved successfully" });
        qc.invalidateQueries({ queryKey: getListRecordsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        setForm({ date: today(), shift: "Morning", shiftGroup: "A", machine: "", operator1Id: "", operator2Id: "", targetQty: "0", actualQty: "0", defectQty: "0" });
      },
      onError: () => toast({ title: "Failed to save record", variant: "destructive" }),
    });
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Data Entry</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Log a production record for a specific machine and operator pair.</p>
      </div>

      <div className="bg-card border border-card-border rounded-lg p-6">
        <h2 className="text-base font-semibold text-foreground mb-1">Shift Record</h2>
        <p className="text-xs text-muted-foreground mb-5">Fill out all required production metrics</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Production Date</Label>
              <Input data-testid="input-date" type="date" value={form.date} onChange={e => set("date", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Shift Timing</Label>
              <Select value={form.shift} onValueChange={v => set("shift", v)}>
                <SelectTrigger data-testid="select-shift"><SelectValue /></SelectTrigger>
                <SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Shift Group</Label>
              <Select value={form.shiftGroup} onValueChange={v => set("shiftGroup", v)}>
                <SelectTrigger data-testid="select-shiftgroup"><SelectValue /></SelectTrigger>
                <SelectContent>{GROUPS.map(g => <SelectItem key={g} value={g}>Group {g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Machine</Label>
              <Select value={form.machine} onValueChange={v => set("machine", v)}>
                <SelectTrigger data-testid="select-machine"><SelectValue placeholder="Select Machine" /></SelectTrigger>
                <SelectContent>{MACHINES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Operator 1</Label>
              <Select value={form.operator1Id || "__none"} onValueChange={v => set("operator1Id", v === "__none" ? "" : v)}>
                <SelectTrigger data-testid="select-operator1"><SelectValue placeholder="Select Op 1" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None</SelectItem>
                  {operators.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name} (Shift {o.shiftGroup})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Operator 2</Label>
              <Select value={form.operator2Id || "__none"} onValueChange={v => set("operator2Id", v === "__none" ? "" : v)}>
                <SelectTrigger data-testid="select-operator2"><SelectValue placeholder="Select Op 2" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None</SelectItem>
                  {operators.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name} (Shift {o.shiftGroup})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Target Qty</Label>
              <Input data-testid="input-target" type="number" min="0" value={form.targetQty} onChange={e => set("targetQty", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Actual Qty</Label>
              <Input data-testid="input-actual" type="number" min="0" value={form.actualQty} onChange={e => set("actualQty", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Defect Qty</Label>
              <Input data-testid="input-defects" type="number" min="0" value={form.defectQty} onChange={e => set("defectQty", e.target.value)} />
            </div>
          </div>

          {/* Auto-computed defect rate preview */}
          <div className="bg-secondary/50 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Auto-calculated Defect Rate</span>
            <span className={`font-mono text-sm font-semibold ${computedDefectRate > 0 ? "text-red-400" : "text-muted-foreground"}`}>
              {computedDefectRate.toFixed(3)}%
            </span>
          </div>

          <Button type="submit" data-testid="button-save-record" disabled={createRecord.isPending} className="w-full">
            {createRecord.isPending ? "Saving..." : "Save Production Record"}
          </Button>
        </form>
      </div>
    </div>
  );
}
