import { useState, useEffect } from "react";
import {
  useListMachineSettings, useUpdateMachineSettings,
  getListMachineSettingsQueryKey, getGetDashboardStatsQueryKey,
  getGetOperatorRankingsQueryKey, getGetShiftRankingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2 } from "lucide-react";

const MACHINES = ["Techno 5", "Kammann"];

interface SettingsForm {
  pc: string; qc: string; k: string; wp: string; wq: string; c: string;
}

interface Preview {
  actual: string; target: string; defects: string; nextActual: string; nextTarget: string;
}

function calcScore(actual: number, target: number, defectPct: number, nextActual: number, nextTarget: number, s: { pc: number; qc: number; k: number; wp: number; wq: number; c: number }) {
  const P = target > 0 ? (actual / target) * s.pc : 0;
  const Q = s.qc - (defectPct / 100) * s.k;
  const base = P * s.wp + Q * s.wq;
  const nsr = nextTarget > 0 ? nextActual / nextTarget : 0;
  const carry = Math.max(0, (nsr - 1) * s.c);
  return { P, Q, base, carry, final: base + carry };
}

export default function SettingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [machine, setMachine] = useState(MACHINES[0]);
  const [form, setForm] = useState<SettingsForm>({ pc: "100", qc: "100", k: "50", wp: "0.6", wq: "0.4", c: "10" });
  const [preview, setPreview] = useState<Preview>({ actual: "5000", target: "5000", defects: "2", nextActual: "5200", nextTarget: "5000" });

  const { data: allSettings = [] } = useListMachineSettings();
  const updateSettings = useUpdateMachineSettings();

  useEffect(() => {
    const s = allSettings.find(s => s.machine === machine);
    if (s) {
      setForm({ pc: String(s.pc), qc: String(s.qc), k: String(s.k), wp: String(s.wp), wq: String(s.wq), c: String(s.c) });
    }
  }, [machine, allSettings]);

  const pn = (v: string) => parseFloat(v) || 0;
  const scoreResult = calcScore(pn(preview.actual), pn(preview.target), pn(preview.defects), pn(preview.nextActual), pn(preview.nextTarget), {
    pc: pn(form.pc), qc: pn(form.qc), k: pn(form.k), wp: pn(form.wp), wq: pn(form.wq), c: pn(form.c),
  });

  const handleSave = () => {
    updateSettings.mutate({
      machine: encodeURIComponent(machine),
      data: { pc: pn(form.pc), qc: pn(form.qc), k: pn(form.k), wp: pn(form.wp), wq: pn(form.wq), c: pn(form.c) }
    }, {
      onSuccess: () => {
        toast({ title: `${machine} settings saved` });
        qc.invalidateQueries({ queryKey: getListMachineSettingsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetOperatorRankingsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetShiftRankingsQueryKey() });
      },
      onError: () => toast({ title: "Failed to save settings", variant: "destructive" }),
    });
  };

  const fields = [
    { key: "pc", label: "PC — Production Constant", desc: "Multiplier for production ratio. Default 100." },
    { key: "qc", label: "QC — Quality Constant", desc: "Starting quality score. Default 100." },
    { key: "k", label: "K — Defect Penalty Factor", desc: "Multiplied by defect rate. Higher = harsher penalty." },
    { key: "wp", label: "wp — Production Weight", desc: "Weight for production score in base (0-1)." },
    { key: "wq", label: "wq — Quality Weight", desc: "Weight for quality score in base (0-1)." },
    { key: "c", label: "C — Carry Bonus Factor", desc: "Scales the next-shift carry bonus." },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Score Configuration</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure per-machine scoring constants. All rankings update immediately after saving.</p>
      </div>

      {/* Formula */}
      <div className="bg-card border border-card-border rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-sm font-semibold text-foreground">Active Formula</span>
        </div>
        <div className="font-mono text-xs space-y-1 bg-secondary/50 rounded p-3 text-left">
          <div><span className="text-primary">P</span> <span className="text-muted-foreground">= (Actual / Target) × PC</span></div>
          <div><span className="text-yellow-400">Q</span> <span className="text-muted-foreground">= QC − ((Defects / 100) × K)</span></div>
          <div><span className="text-green-400">Base</span> <span className="text-muted-foreground">= (P × wp) + (Q × wq)</span></div>
          <div><span className="text-purple-400">NSR</span> <span className="text-muted-foreground">= NextShift Actual / NextShift Target</span></div>
          <div><span className="text-orange-400">Carry</span> <span className="text-muted-foreground">= max(0, (NSR − 1) × C)</span></div>
          <div><span className="text-foreground font-bold">Final</span> <span className="text-muted-foreground">= Base + Carry</span></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Machine Constants */}
        <div className="bg-card border border-card-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-1">
            <Settings2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Machine Constants</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Each machine has independent scoring constants.</p>

          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Machine</Label>
            <Select value={machine} onValueChange={setMachine}>
              <SelectTrigger data-testid="select-machine"><SelectValue /></SelectTrigger>
              <SelectContent>{MACHINES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {fields.map(f => (
              <div key={f.key}>
                <Label className="text-xs font-medium text-foreground mb-0.5 block">{f.label}</Label>
                <Input
                  data-testid={`input-${f.key}`}
                  type="number"
                  step="0.01"
                  value={form[f.key as keyof SettingsForm]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>

          <Button onClick={handleSave} disabled={updateSettings.isPending} className="w-full mt-5" data-testid="button-save-settings">
            {updateSettings.isPending ? "Saving..." : "Save & Apply to All Rankings"}
          </Button>
        </div>

        {/* Live Preview */}
        <div className="bg-card border border-card-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-sm font-semibold text-foreground">Live Score Preview</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Enter hypothetical values to see how the formula scores them.</p>

          <div className="space-y-3 mb-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Actual Qty</Label>
                <Input type="number" value={preview.actual} onChange={e => setPreview(p => ({ ...p, actual: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Target Qty</Label>
                <Input type="number" value={preview.target} onChange={e => setPreview(p => ({ ...p, target: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Total Defects %</Label>
              <Input type="number" step="0.01" value={preview.defects} onChange={e => setPreview(p => ({ ...p, defects: e.target.value }))} />
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground mb-2">Next Shift (Carry Bonus Inputs)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Next Shift Actual</Label>
                  <Input type="number" value={preview.nextActual} onChange={e => setPreview(p => ({ ...p, nextActual: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Next Shift Target</Label>
                  <Input type="number" value={preview.nextTarget} onChange={e => setPreview(p => ({ ...p, nextTarget: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          {/* Score breakdown */}
          <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
            {[
              { label: "P (Production Score)", value: scoreResult.P.toFixed(3), color: "text-primary" },
              { label: "Q (Quality Score)", value: scoreResult.Q.toFixed(3), color: "text-yellow-400" },
              { label: "Base (P×wp + Q×wq)", value: scoreResult.base.toFixed(3), color: "text-foreground" },
              { label: "Carry Bonus", value: `+${scoreResult.carry.toFixed(3)}`, color: scoreResult.carry > 0 ? "text-green-400" : "text-muted-foreground" },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground font-mono text-xs">{row.label}</span>
                <span className={`font-mono text-xs font-medium ${row.color}`}>{row.value}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="text-sm font-semibold text-foreground">Final Score</span>
              <span className="font-mono text-base font-bold text-primary">{scoreResult.final.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
