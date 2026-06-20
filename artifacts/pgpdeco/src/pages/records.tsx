import { useState } from "react";
import {
  useListRecords, useUpdateRecord, useDeleteRecord, useListOperators,
  getListRecordsQueryKey, getGetDashboardStatsQueryKey, getGetOperatorRankingsQueryKey, getGetShiftRankingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const MACHINES = ["Techno 5", "Kammann"];
const SHIFTS = ["Morning", "Afternoon", "Night"];
const GROUPS = ["A", "B", "C", "D"];

type FilterState = { date: string; shift: string; shiftGroup: string };

export default function RecordsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filters, setFilters] = useState<FilterState>({ date: "", shift: "", shiftGroup: "" });
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const params = {
    dateFrom: filters.date || undefined,
    dateTo: filters.date || undefined,
    shift: filters.shift || undefined,
    shiftGroup: filters.shiftGroup || undefined,
  };

  const { data: records = [], isLoading } = useListRecords(params, {
    query: { queryKey: getListRecordsQueryKey(params) }
  });
  const { data: operators = [] } = useListOperators();
  const updateRecord = useUpdateRecord();
  const deleteRecord = useDeleteRecord();

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: getListRecordsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetOperatorRankingsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetShiftRankingsQueryKey() });
  };

  const openEdit = (rec: any) => {
    setEditRecord(rec);
    setEditForm({
      date: rec.date,
      shift: rec.shift,
      shiftGroup: rec.shiftGroup,
      machine: rec.machine,
      operator1Id: rec.operator1Id ? String(rec.operator1Id) : "",
      operator2Id: rec.operator2Id ? String(rec.operator2Id) : "",
      targetQty: String(rec.targetQty),
      actualQty: String(rec.actualQty),
      defectPercentage: String(rec.defectPercentage),
    });
  };

  const handleUpdate = () => {
    updateRecord.mutate({
      id: editRecord.id,
      data: {
        date: editForm.date,
        shift: editForm.shift,
        shiftGroup: editForm.shiftGroup,
        machine: editForm.machine,
        operator1Id: editForm.operator1Id ? parseInt(editForm.operator1Id) : null,
        operator2Id: editForm.operator2Id ? parseInt(editForm.operator2Id) : null,
        targetQty: parseInt(editForm.targetQty) || 0,
        actualQty: parseInt(editForm.actualQty) || 0,
        defectPercentage: parseFloat(editForm.defectPercentage) || 0,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Record updated" });
        invalidateAll();
        setEditRecord(null);
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteRecord.mutate({ id: deleteId }, {
      onSuccess: () => {
        toast({ title: "Record deleted" });
        invalidateAll();
        setDeleteId(null);
      },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  };

  const setF = (k: string, v: string) => setFilters(f => ({ ...f, [k]: v }));
  const setEF = (k: string, v: string) => setEditForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Production Records</h1>
        <p className="text-sm text-muted-foreground mt-0.5">View, edit and delete all logged production entries.</p>
      </div>

      {/* Filters */}
      <div className="bg-card border border-card-border rounded-lg p-4 mb-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Date</Label>
          <input type="date" value={filters.date} onChange={e => setF("date", e.target.value)}
            className="bg-secondary border border-border text-foreground text-sm rounded px-2 py-1" />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Shift</Label>
          <select value={filters.shift} onChange={e => setF("shift", e.target.value)}
            className="bg-secondary border border-border text-foreground text-sm rounded px-2 py-1">
            <option value="">All</option>
            {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Shift Group</Label>
          <select value={filters.shiftGroup} onChange={e => setF("shiftGroup", e.target.value)}
            className="bg-secondary border border-border text-foreground text-sm rounded px-2 py-1">
            <option value="">All</option>
            {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <button onClick={() => setFilters({ date: "", shift: "", shiftGroup: "" })}
          className="text-xs text-primary hover:underline">Clear</button>
      </div>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{records.length} records</span>
        </div>

        {isLoading ? (
          <div className="p-6 text-muted-foreground text-sm">Loading...</div>
        ) : records.length === 0 ? (
          <div className="p-6 text-muted-foreground text-sm">No records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  {["DATE","SHIFT","GROUP","MACHINE","OPERATOR 1","OPERATOR 2","TARGET","ACTUAL","DEFECTS","SCORE","ACTIONS"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} data-testid={`row-record-${r.id}`}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-xs">{r.date}</td>
                    <td className="px-3 py-2.5 text-xs">{r.shift}</td>
                    <td className="px-3 py-2.5"><Badge variant="secondary" className="text-xs font-mono">{r.shiftGroup}</Badge></td>
                    <td className="px-3 py-2.5 text-xs">{r.machine}</td>
                    <td className="px-3 py-2.5 text-xs">{r.operator1Name ?? "—"}</td>
                    <td className="px-3 py-2.5 text-xs">{r.operator2Name ?? "—"}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{r.targetQty.toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{r.actualQty.toLocaleString()}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">
                      <span className={Number(r.defectPercentage) > 0 ? "text-red-400" : "text-muted-foreground"}>
                        {Number(r.defectPercentage).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-primary">{r.score !== null ? (r.score as number).toFixed(1) : "—"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button data-testid={`button-edit-${r.id}`} onClick={() => openEdit(r)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button data-testid={`button-delete-${r.id}`} onClick={() => setDeleteId(r.id)}
                          className="p-1 text-muted-foreground hover:text-red-400 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editRecord} onOpenChange={() => setEditRecord(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Production Record</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input type="date" value={editForm.date ?? ""} onChange={e => setEF("date", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Shift</Label>
                <Select value={editForm.shift ?? ""} onValueChange={v => setEF("shift", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Group</Label>
                <Select value={editForm.shiftGroup ?? ""} onValueChange={v => setEF("shiftGroup", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Machine</Label>
                <Select value={editForm.machine ?? ""} onValueChange={v => setEF("machine", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{MACHINES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Operator 1</Label>
                <Select value={editForm.operator1Id || "__none"} onValueChange={v => setEF("operator1Id", v === "__none" ? "" : v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">None</SelectItem>
                    {operators.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Operator 2</Label>
                <Select value={editForm.operator2Id || "__none"} onValueChange={v => setEF("operator2Id", v === "__none" ? "" : v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">None</SelectItem>
                    {operators.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Target Qty</Label>
                <Input type="number" value={editForm.targetQty ?? ""} onChange={e => setEF("targetQty", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Actual Qty</Label>
                <Input type="number" value={editForm.actualQty ?? ""} onChange={e => setEF("actualQty", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Defect %</Label>
                <Input type="number" step="0.01" value={editForm.defectPercentage ?? ""} onChange={e => setEF("defectPercentage", e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRecord(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateRecord.isPending}>
              {updateRecord.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the production record. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
