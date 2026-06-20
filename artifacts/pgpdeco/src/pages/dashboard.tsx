import { useState, useMemo } from "react";
import { useGetDashboardStats, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Package, TrendingUp, AlertTriangle, Medal } from "lucide-react";

type Period = { label: string; dateFrom: string | null; dateTo: string | null };

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getPeriods(): Period[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const months: Period[] = MONTHS.map((label, i) => {
    const start = `${y}-${String(i+1).padStart(2,"0")}-01`;
    const lastDay = new Date(y, i+1, 0).getDate();
    const end = `${y}-${String(i+1).padStart(2,"0")}-${lastDay}`;
    return { label, dateFrom: start, dateTo: end };
  });
  const q = Math.floor(m / 3);
  const qStart = `${y}-${String(q*3+1).padStart(2,"0")}-01`;
  const qEnd = new Date(y, q*3+3, 0);
  const qEndStr = `${qEnd.getFullYear()}-${String(qEnd.getMonth()+1).padStart(2,"0")}-${qEnd.getDate()}`;
  return [
    ...months,
    { label: "This Quarter", dateFrom: qStart, dateTo: qEndStr },
    { label: "This Year", dateFrom: `${y}-01-01`, dateTo: `${y}-12-31` },
    { label: "All Time", dateFrom: null, dateTo: null },
  ];
}

const medalColors = ["#FFD700","#C0C0C0","#CD7F32"];
const medalLabels = ["GOLD","SILVER","BRONZE"];

export default function DashboardPage() {
  const periods = useMemo(() => getPeriods(), []);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(periods.find(p => p.label === "This Year") ?? periods[periods.length-1]);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const dateFrom = useCustom ? (customFrom || null) : selectedPeriod.dateFrom;
  const dateTo = useCustom ? (customTo || null) : selectedPeriod.dateTo;
  const params = { dateFrom: dateFrom ?? undefined, dateTo: dateTo ?? undefined };

  const { data: stats, isLoading } = useGetDashboardStats(params, {
    query: { queryKey: getGetDashboardStatsQueryKey(params) }
  });

  const periodLabel = useCustom ? `${customFrom} to ${customTo}` : selectedPeriod.label;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Production Command Center</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Performance summary for the selected period.</p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-card-border rounded-lg p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Quick Select</span>
          <select
            data-testid="select-period"
            value={useCustom ? "__custom" : selectedPeriod.label}
            onChange={e => {
              if (e.target.value === "__custom") { setUseCustom(true); }
              else {
                setUseCustom(false);
                setSelectedPeriod(periods.find(p => p.label === e.target.value) ?? periods[0]);
              }
            }}
            className="bg-secondary border border-border text-foreground text-sm rounded px-2 py-1.5"
          >
            {periods.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
            <option value="__custom">Custom Range</option>
          </select>
        </div>
        <span className="text-muted-foreground text-xs">or</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Custom Date Range</span>
          <input type="date" value={customFrom} onChange={e => { setCustomFrom(e.target.value); setUseCustom(true); }}
            className="bg-secondary border border-border text-foreground text-sm rounded px-2 py-1" />
          <span className="text-muted-foreground">→</span>
          <input type="date" value={customTo} onChange={e => { setCustomTo(e.target.value); setUseCustom(true); }}
            className="bg-secondary border border-border text-foreground text-sm rounded px-2 py-1" />
        </div>
        {(useCustom || selectedPeriod) && (
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">{periodLabel}</span>
        )}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : stats ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border border-card-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Production</span>
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="font-mono text-2xl font-bold text-foreground">{stats.totalActual.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Target: {stats.totalTarget.toLocaleString()} · {periodLabel}</p>
            </div>
            <div className="bg-card border border-card-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Overall Efficiency</span>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="font-mono text-2xl font-bold text-foreground">{stats.overallEfficiency.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Actual vs Target · {periodLabel}</p>
            </div>
            <div className="bg-card border border-card-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Defect Rate</span>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="font-mono text-2xl font-bold text-foreground">{stats.defectRate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Avg defect % · {periodLabel}</p>
            </div>
          </div>

          {/* Machine + Top 5 */}
          <div className="grid grid-cols-2 gap-4">
            {/* Machine Performance */}
            <div className="bg-card border border-card-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-foreground">Machine Performance</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Target vs Actual · {periodLabel}</p>
              {stats.machineSummary.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data for this period.</p>
              ) : (
                <div className="space-y-4">
                  {stats.machineSummary.map(m => (
                    <div key={m.machine}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{m.machine}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {m.totalActual.toLocaleString()} / {m.totalTarget.toLocaleString()} ({m.efficiencyPct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(m.efficiencyPct, 100)}%` }} />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>Records: {m.records}</span>
                        <span className={m.defectRate > 0 ? "text-red-400" : ""}>Defect Rate: {m.defectRate.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bar chart */}
              {stats.machineSummary.length > 0 && (
                <div className="mt-4 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.machineSummary}>
                      <XAxis dataKey="machine" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                      <Tooltip contentStyle={{ background: "#1e2a3a", border: "1px solid #334155", borderRadius: 6 }} />
                      <Bar dataKey="totalActual" name="Actual" radius={[3,3,0,0]}>
                        {stats.machineSummary.map((_, idx) => (
                          <Cell key={idx} fill="hsl(201 100% 50%)" />
                        ))}
                      </Bar>
                      <Bar dataKey="totalTarget" name="Target" fill="#334155" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Top 5 Operators */}
            <div className="bg-card border border-card-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Medal className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-semibold text-foreground">Top 5 Operators</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Highest avg score · {periodLabel}</p>
              {stats.top5Operators.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data for this period.</p>
              ) : (
                <div className="space-y-2">
                  {stats.top5Operators.map(op => (
                    <div key={op.operatorId} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: op.rank <= 3 ? `${medalColors[op.rank-1]}20` : "#334155", color: op.rank <= 3 ? medalColors[op.rank-1] : "#94a3b8" }}>
                        {op.rank <= 3 ? ["🥇","🥈","🥉"][op.rank-1] : op.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{op.operatorName}</div>
                        <div className="text-xs text-muted-foreground">Shift {op.shiftGroup}</div>
                      </div>
                      <div className="font-mono text-sm font-bold text-primary">{op.avgScore.toFixed(1)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-muted-foreground text-sm">No data available.</div>
      )}
    </div>
  );
}
