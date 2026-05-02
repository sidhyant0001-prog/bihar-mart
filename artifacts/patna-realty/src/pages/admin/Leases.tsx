import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useListLeases, useCreateLease, useUpdateLease,
  useListTenants, useListProperties, getListLeasesQueryKey,
} from "@workspace/api-client-react";
import type { Lease } from "@workspace/api-client-react";
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Search, FileText, Loader2 } from "lucide-react";
import { formatINR } from "@/lib/format";

interface LeaseForm {
  tenantId: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  rentAmount: string;
  rentPeriod: string;
  securityDeposit: string;
  status: string;
  notes: string;
}

const defaultForm: LeaseForm = {
  tenantId: "", propertyId: "", startDate: "", endDate: "",
  rentAmount: "", rentPeriod: "monthly", securityDeposit: "", status: "active", notes: "",
};

function leaseToForm(l: Lease): LeaseForm {
  return {
    tenantId: String(l.tenantId),
    propertyId: String(l.propertyId),
    startDate: l.startDate.split("T")[0],
    endDate: l.endDate ? l.endDate.split("T")[0] : "",
    rentAmount: String(l.rentAmount),
    rentPeriod: l.rentPeriod,
    securityDeposit: l.securityDeposit != null ? String(l.securityDeposit) : "",
    status: l.status,
    notes: l.notes ?? "",
  };
}

function LeaseFormModal({ open, onClose, editing }: {
  open: boolean; onClose: () => void; editing: Lease | null;
}) {
  const [form, setForm] = useState<LeaseForm>(editing ? leaseToForm(editing) : defaultForm);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateLease();
  const updateMutation = useUpdateLease();
  const { data: tenants } = useListTenants();
  const { data: properties } = useListProperties();

  const set = (k: keyof LeaseForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenantId || !form.propertyId || !form.startDate || !form.rentAmount) {
      toast({ title: "Tenant, property, start date and rent are required", variant: "destructive" });
      return;
    }
    const body = {
      tenantId: Number(form.tenantId),
      propertyId: Number(form.propertyId),
      startDate: form.startDate,
      endDate: form.endDate || null,
      rentAmount: Number(form.rentAmount),
      rentPeriod: form.rentPeriod as "daily" | "weekly" | "monthly" | "yearly",
      securityDeposit: form.securityDeposit ? Number(form.securityDeposit) : null,
      autoRenew: false,
      notes: form.notes.trim() || null,
    };
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getListLeasesQueryKey() });
    if (editing) {
      updateMutation.mutate(
        { leaseId: editing.id, data: { ...body, status: form.status as "active" | "expired" | "terminated" } },
        {
          onSuccess: () => { toast({ title: "Lease updated" }); invalidate(); onClose(); },
          onError: (err) => toast({ title: "Update failed", description: err.message, variant: "destructive" }),
        }
      );
    } else {
      createMutation.mutate(
        { data: body },
        {
          onSuccess: () => { toast({ title: "Lease created" }); invalidate(); onClose(); },
          onError: (err) => toast({ title: "Create failed", description: err.message, variant: "destructive" }),
        }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const F = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Lease" : "Add New Lease"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 py-2">
          <F label="Tenant" required>
            <Select value={form.tenantId} onValueChange={v => set("tenantId", v)}>
              <SelectTrigger><SelectValue placeholder="Select tenant…" /></SelectTrigger>
              <SelectContent>
                {(tenants ?? []).filter(t => t.status === "active").map(t => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.name} · {t.phone}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          <F label="Property" required>
            <Select value={form.propertyId} onValueChange={v => set("propertyId", v)}>
              <SelectTrigger><SelectValue placeholder="Select property…" /></SelectTrigger>
              <SelectContent>
                {(properties ?? []).map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name} · {p.type}{p.bhk ? ` ${p.bhk}BHK` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>
          <div className="grid grid-cols-2 gap-4">
            <F label="Start Date" required>
              <Input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} />
            </F>
            <F label="End Date">
              <Input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} />
            </F>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <F label="Monthly Rent (₹)" required>
              <Input type="number" value={form.rentAmount} onChange={e => set("rentAmount", e.target.value)} placeholder="12000" />
            </F>
            <F label="Rent Period">
              <Select value={form.rentPeriod} onValueChange={v => set("rentPeriod", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </F>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <F label="Security Deposit (₹)">
              <Input type="number" value={form.securityDeposit} onChange={e => set("securityDeposit", e.target.value)} placeholder="24000" />
            </F>
            {editing && (
              <F label="Status">
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </F>
            )}
          </div>
          <F label="Notes">
            <textarea
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              rows={2}
              placeholder="Any additional lease notes..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </F>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="min-w-24">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Save Changes" : "Create Lease"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminLeases() {
  const { data: leases, isLoading } = useListLeases();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Lease | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = (leases ?? []).filter((l) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (l.tenant?.name ?? "").toLowerCase().includes(q) ||
      (l.property?.name ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (l: Lease) => { setEditing(l); setFormOpen(true); };

  const statusColor: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    expired: "bg-slate-100 text-slate-700",
    terminated: "bg-red-100 text-red-800",
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Leases</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {leases?.filter(l => l.status === "active").length ?? 0} active leases
            </p>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Add Lease
          </Button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tenant or property…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="bg-white rounded-lg border h-14" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No leases found</p>
            <Button onClick={openAdd} variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> Add First Lease
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Security Deposit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">{l.tenant?.name ?? `#${l.tenantId}`}</TableCell>
                    <TableCell>{l.property?.name ?? `#${l.propertyId}`}</TableCell>
                    <TableCell className="font-semibold text-primary">{formatINR(l.rentAmount)}</TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(l.startDate).toLocaleDateString("en-IN")}</div>
                      <div className="text-xs text-muted-foreground">
                        {l.endDate ? `to ${new Date(l.endDate).toLocaleDateString("en-IN")}` : "Indefinite"}
                      </div>
                    </TableCell>
                    <TableCell>{l.securityDeposit != null ? formatINR(l.securityDeposit) : "—"}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColor[l.status] ?? "bg-muted"}`}>
                        {l.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(l)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <LeaseFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} editing={editing} />
    </AdminLayout>
  );
}
