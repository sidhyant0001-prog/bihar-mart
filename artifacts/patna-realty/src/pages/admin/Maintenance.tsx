import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useListMaintenanceRequests,
  useUpdateMaintenanceRequest,
  getListMaintenanceRequestsQueryKey,
} from "@workspace/api-client-react";
import type { MaintenanceRequest } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, Wrench, Loader2, ChevronDown } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  closed: "bg-slate-100 text-slate-700 border-slate-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

function UpdateStatusModal({
  request,
  onClose,
}: {
  request: MaintenanceRequest | null;
  onClose: () => void;
}) {
  const [status, setStatus] = useState(request?.status ?? "pending");
  const [adminNotes, setAdminNotes] = useState(request?.adminNotes ?? "");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateMaintenanceRequest();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) return;
    updateMutation.mutate(
      { maintenanceRequestId: request.id, data: { status: status as "pending" | "in_progress" | "resolved" | "closed", adminNotes: adminNotes || null } },
      {
        onSuccess: () => {
          toast({ title: "Status updated" });
          queryClient.invalidateQueries({ queryKey: getListMaintenanceRequestsQueryKey() });
          onClose();
        },
        onError: (err) => toast({ title: "Update failed", description: err.message, variant: "destructive" }),
      }
    );
  };

  return (
    <Dialog open={!!request} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Request Status</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 py-2">
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <p className="font-semibold">{request?.title}</p>
            <p className="text-muted-foreground">{request?.property?.name} • {request?.tenant?.name}</p>
            {request?.description && <p className="text-muted-foreground">{request.description}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">🕐 Pending</SelectItem>
                <SelectItem value="in_progress">🔧 In Progress</SelectItem>
                <SelectItem value="resolved">✅ Resolved</SelectItem>
                <SelectItem value="closed">🔒 Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Admin Remarks</Label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Add notes about the action taken..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminMaintenance() {
  const { data: requests, isLoading } = useListMaintenanceRequests();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<MaintenanceRequest | null>(null);

  const filtered = (requests ?? []).filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q) ||
      (r.property?.name ?? "").toLowerCase().includes(q) ||
      (r.tenant?.name ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    pending: (requests ?? []).filter(r => r.status === "open").length,
    in_progress: (requests ?? []).filter(r => r.status === "in_progress").length,
    resolved: (requests ?? []).filter(r => r.status === "resolved").length,
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Maintenance Requests</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage and update request statuses</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Pending", value: counts.pending, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
            { label: "In Progress", value: counts.in_progress, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
            { label: "Resolved", value: counts.resolved, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, property, tenant…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="animate-pulse bg-white rounded-xl border h-20" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Wrench className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No maintenance requests found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-border p-4 flex items-start justify-between gap-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-sm">{r.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_COLORS[r.status] ?? "bg-muted"}`}>
                      {r.status.replace("_", " ")}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[r.priority] ?? "bg-muted"}`}>
                      {r.priority}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {r.property?.name}
                    {r.tenant?.name ? ` · ${r.tenant.name}` : ""}
                    {" · "}
                    <span className="capitalize">{r.category.replace("_", " ")}</span>
                  </p>
                  {r.adminNotes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">Remark: {r.adminNotes}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelected(r)}
                  className="shrink-0 gap-1.5"
                >
                  Update <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <UpdateStatusModal request={selected} onClose={() => setSelected(null)} />
    </AdminLayout>
  );
}
