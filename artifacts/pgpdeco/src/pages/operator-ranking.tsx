import { useState, useMemo } from "react";
import { useGetOperatorRankings, getGetOperatorRankingsQueryKey } from "@workspace/api-client-react";
import { Trophy, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-400" />;
  if (rank === 2) return <Trophy className="h-4 w-4 text-slate-300" />;
  if (rank === 3) return <Trophy className="h-4 w-4 text-orange-400" />;
  return <span className="text-sm font-mono text-muted-foreground w-4 inline-block text-center">{rank}</span>;
}

export default function OperatorRankingPage() {
  const now = new Date();
  const [month, setMonth] = useState<string>("");
  const [search, setSearch] = useState("");

  const params = month ? { month } : {};
  const { data: rankings = [], isLoading } = useGetOperatorRankings(params, {
    query: { queryKey: getGetOperatorRankingsQueryKey(params) }
  });

  const monthOptions = useMemo(() => {
    const y = now.getFullYear();
    return MONTHS.map((label, i) => ({ label, value: `${y}-${String(i+1).padStart(2,"0")}` }));
  }, []);

  const filtered = rankings.filter(r =>
    r.operatorName.toLowerCase().includes(search.toLowerCase())
  );

  const maxScore = filtered.length > 0 ? Math.max(...filtered.map(r => r.avgScore)) : 1;

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Operator Ranking</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Comprehensive leaderboard sorted by average score.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              data-testid="input-search"
              placeholder="Search operator..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 w-44 h-8 text-sm"
            />
          </div>
          <select
            data-testid="select-month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="bg-secondary border border-border text-foreground text-sm rounded px-2 py-1.5 h-8"
          >
            <option value="">All Time</option>
            {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label} {new Date().getFullYear()}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-semibold text-foreground">Leaderboard</span>
          <span className="text-xs text-muted-foreground ml-1">Performance metrics across all recorded shifts</span>
        </div>

        {isLoading ? (
          <div className="p-6 text-muted-foreground text-sm">Loading rankings...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-muted-foreground text-sm">No operators found.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium w-12">Rank</th>
                <th className="px-4 py-2.5 text-left font-medium">Operator</th>
                <th className="px-4 py-2.5 text-left font-medium w-16">Group</th>
                <th className="px-4 py-2.5 text-left font-medium w-48">Score</th>
                <th className="px-4 py-2.5 text-right font-medium">Total Records</th>
                <th className="px-4 py-2.5 text-right font-medium">Avg Output</th>
                <th className="px-4 py-2.5 text-right font-medium">Avg Defects</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.operatorId} data-testid={`row-operator-${r.operatorId}`}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center"><RankIcon rank={r.rank} /></div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${r.rank <= 3 ? "text-foreground" : "text-foreground/80"}`}>
                      {r.operatorName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs font-mono">{r.shiftGroup}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(r.avgScore / maxScore) * 100}%` }} />
                      </div>
                      <span className="font-mono text-sm text-primary font-bold w-12 text-right">{r.avgScore.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-muted-foreground">{r.totalRecords}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm text-muted-foreground">{r.totalActual.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm">
                    <span className={r.avgDefectPercentage > 0 ? "text-red-400" : "text-muted-foreground"}>
                      {r.avgDefectPercentage.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
