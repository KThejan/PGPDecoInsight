import { useState } from "react";
import {
  useListOperators, useCreateOperator, useUpdateOperator, useDeleteOperator,
  getListOperatorsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, UserPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const GROUPS = ["A", "B", "C", "D"];

export default function OperatorsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: operators = [], isLoading } = useListOperators();
  const createOp = useCreateOperator();
  const updateOp = useUpdateOperator();
  const deleteOp = useDeleteOperator();

  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [editOp, setEditOp] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editGroup, setEditGroup] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListOperatorsQueryKey() });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newGroup) {
      toast({ title: "Please enter name and shift group", variant: "destructive" }); return;
    }
    createOp.mutate({ data: { name: newName.trim(), shiftGroup: newGroup } }, {
      onSuccess: () => {
        toast({ title: `${newName} added to Shift ${newGroup}` });
        invalidate(); setNewName(""); setNewGroup("");
      },
      onError: () => toast({ title: "Failed to add operator", variant: "destructive" }),
    });
  };

  const handleUpdate = () => {
    updateOp.mutate({ id: editOp.id, data: { name: editName, shiftGroup: editGroup } }, {
      onSuccess: () => {
        toast({ title: "Operator updated" });
        invalidate(); setEditOp(null);
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteOp.mutate({ id: deleteId }, {
      onSuccess: () => {
        toast({ title: "Operator deleted" });
        invalidate(); setDeleteId(null);
      },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  };

  const grouped = GROUPS.reduce((acc, g) => {
    acc[g] = operators.filter(o => o.shiftGroup === g);
    return acc;
  }, {} as Record<string, typeof operators>);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Operator Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Add or remove operators from the ranking system.</p>
      </div>

      {/* Add form */}
      <div className="bg-card border border-card-border rounded-lg p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <UserPlus className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Add New Operator</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Enter the operator name and assign a shift group.</p>
        <form onSubmit={handleAdd} className="flex items-end gap-3">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Operator Name</Label>
            <Input
              data-testid="input-operator-name"
              placeholder="e.g. Nimal"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Shift Group</Label>
            <Select value={newGroup} onValueChange={setNewGroup}>
              <SelectTrigger data-testid="select-shift-group"><SelectValue placeholder="Select shift" /></SelectTrigger>
              <SelectContent>{GROUPS.map(g => <SelectItem key={g} value={g}>Shift {g}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button type="submit" data-testid="button-add-operator" disabled={createOp.isPending}>
            {createOp.isPending ? "Adding..." : "Add Operator"}
          </Button>
        </form>
      </div>

      {/* Current Operators */}
      <div className="bg-card border border-card-border rounded-lg p-5">
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Current Operators</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{operators.length} operators registered</p>
        {isLoading ? (
          <div className="text-muted-foreground text-sm">Loading...</div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {GROUPS.map(g => (
              <div key={g}>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Shift {g}</div>
                <div className="space-y-1">
                  {grouped[g].length === 0 ? (
                    <div className="text-xs text-muted-foreground italic">No operators</div>
                  ) : (
                    grouped[g].map(op => (
                      <div key={op.id} data-testid={`row-operator-${op.id}`}
                        className="flex items-center justify-between bg-secondary/50 rounded px-3 py-2">
                        <span className="text-sm text-foreground">{op.name}</span>
                        <div className="flex items-center gap-0.5">
                          <button data-testid={`button-edit-op-${op.id}`}
                            onClick={() => { setEditOp(op); setEditName(op.name); setEditGroup(op.shiftGroup); }}
                            className="p-1 text-muted-foreground hover:text-foreground">
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button data-testid={`button-delete-op-${op.id}`}
                            onClick={() => setDeleteId(op.id)}
                            className="p-1 text-muted-foreground hover:text-red-400">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editOp} onOpenChange={() => setEditOp(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Operator</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Shift Group</Label>
              <Select value={editGroup} onValueChange={setEditGroup}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{GROUPS.map(g => <SelectItem key={g} value={g}>Shift {g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOp(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateOp.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Operator</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this operator. Historical records will still reference them by name.</AlertDialogDescription>
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
