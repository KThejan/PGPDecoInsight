import { useState } from "react";
import {
  useGetShiftRankings, useListShiftExecutives, useUpdateShiftExecutive, useGetMe,
  getGetShiftRankingsQueryKey, getListShiftExecutivesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Check, X, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

const RANK_COLORS = ["#F59E0B","#94A3B8","#CD7F32","#6B7280"];
const RANK_LABELS = ["1ST","2ND","3RD","4TH"];

function getDateRange(period: string) {
  const now = new Date();
  const y = now.getFullYear();
  if (period === "All Time") return { dateFrom: undefined, dateTo: undefined };
  if (period === "This Year") return { dateFrom: `${y}-01-01`, dateTo: `${y}-12-31` };
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const idx = months.indexOf(period);
  if (idx >= 0) {
    const start = `${y}-${String(idx+1).padStart(2,"0")}-01`;
    const lastDay = new Date(y, idx+1, 0).getDate();
    return { dateFrom: start, dateTo: `${y}-${String(idx+1).padStart(2,"0")}-${lastDay}` };
  }
  return { dateFrom: undefined, dateTo: undefined };
}

export default function ShiftRankingPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: user } = useGetMe({ query: { retry: false, queryKey: ["auth", "me"] } });
  const [period, setPeriod] = useState("All Time");
  const [editingShift, setEditingShift] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const { dateFrom, dateTo } = getDateRange(period);
  const rankParams = { dateFrom, dateTo };
  const { data: rankings = [], isLoading } = useGetShiftRankings(rankParams, {
    query: { queryKey: getGetShiftRankingsQueryKey(rankParams) }
  });
  const { data: executives = [] } = useListShiftExecutives();
  const updateExec = useUpdateShiftExecutive();

  const handleSaveExec = (shiftGroup: string) => {
    updateExec.mutate({ shiftGroup, data: { executiveName: editName } }, {
      onSuccess: () => {
        toast({ title: `Shift ${shiftGroup} executive updated` });
        qc.invalidateQueries({ queryKey: getListShiftExecutivesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetShiftRankingsQueryKey() });
        setEditingShift(null);
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    });
  };

  const periods = ["All Time", "This Year", "January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Shift Ranking</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Shifts ranked by average operator score and production performance.</p>
      </div>

      <div className="mb-5">
        <select
          data-testid="select-period"
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="bg-secondary border border-border text-foreground text-sm rounded px-3 py-1.5"
        >
          {periods.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {rankings.map(s => {
            const color = RANK_COLORS[s.rank - 1] ?? "#6B7280";
            const label = RANK_LABELS[s.rank - 1] ?? `${s.rank}TH`;
            return (
              <div key={s.shiftGroup}
                data-testid={`card-shift-${s.shiftGroup}`}
                className={`bg-card border rounded-lg p-4 ${s.rank === 1 ? "border-yellow-500/50" : "border-card-border"}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-mono font-bold text-2xl" style={{ color }}>#{s.rank}</span>
                    <span className="text-xs font-mono ml-1" style={{ color }}>{s.shiftGroup === "A" ? "Shift A" : `Shift ${s.shiftGroup}`}</span>
                  </div>
                  <span className="text-xs font-mono px-1.5 py-0.5 rounded border" style={{ color, borderColor: `${color}40`, background: `${color}15` }}>{label}</span>
                </div>
                <p className="text-sm font-semibold text-foreground mb-3">Shift {s.shiftGroup}</p>
                <p className="text-xs text-muted-foreground mb-3">{s.executiveName}</p>

                <div className="mb-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Avg Score</span>
                    <span className="font-mono text-foreground">{s.avgScore != null ? Number(s.avgScore).toFixed(1) : "—"}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    {s.avgScore != null && (
                      <div className="h-full rounded-full" style={{ width: `${Math.min(Number(s.avgScore), 100)}%`, background: color }} />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mt-3">
                  <div>
                    <span className="text-muted-foreground">Records</span>
                    <div className="font-mono text-foreground">{s.totalRecords}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Defect Rate</span>
                    <div className={`font-mono ${s.defectRate > 0 ? "text-red-400" : "text-muted-foreground"}`}>{s.defectRate.toFixed(2)}%</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Actual</span>
                    <div className="font-mono text-foreground">{s.totalActual.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Efficiency</span>
                    <div className="font-mono text-foreground">{s.efficiency.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shift Executives */}
      <div className="bg-card border border-card-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Shift Executives</span>
        </div>
        {user && <p className="text-xs text-muted-foreground mb-4">Click the pencil icon to update an executive name.</p>}
        <div className="grid grid-cols-2 gap-3">
          {executives.map(exec => (
            <div key={exec.shiftGroup} className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground">SHIFT {exec.shiftGroup}</span>
                {editingShift === exec.shiftGroup ? (
                  <Input
                    data-testid={`input-exec-${exec.shiftGroup}`}
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="h-7 w-36 text-sm"
                    autoFocus
                  />
                ) : (
                  <span className="text-sm font-medium text-foreground">{exec.executiveName}</span>
                )}
              </div>
              {user && (
                <div className="flex items-center gap-1">
                  {editingShift === exec.shiftGroup ? (
                    <>
                      <button data-testid={`button-save-exec-${exec.shiftGroup}`}
                        onClick={() => handleSaveExec(exec.shiftGroup)}
                        className="p-1 text-primary hover:text-primary/80">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setEditingShift(null)} className="p-1 text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <button data-testid={`button-edit-exec-${exec.shiftGroup}`}
                      onClick={() => { setEditingShift(exec.shiftGroup); setEditName(exec.executiveName); }}
                      className="p-1 text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
