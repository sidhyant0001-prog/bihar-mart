import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useListTenants, useCreateTenant, useUpdateTenant,
  useListProperties, getListTenantsQueryKey,
} from "@workspace/api-client-react";
import type { Tenant } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Users, Loader2 } from "lucide-react";

interface TenantForm {
  name: string;
  email: string;
  phone: string;
  aadharNumber: string;
  emergencyContact: string;
  notes: string;
}

const defaultForm: TenantForm = {
  name: "", email: "", phone: "", aadharNumber: "", emergencyContact: "", notes: "",
};

function TenantFormModal({
  open, onClose, editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Tenant | null;
}) {
  const [form, setForm] = useState<TenantForm>(
    editing
      ? {
          name: editing.name,
          email: editing.email,
          phone: editing.phone,
          aadharNumber: editing.aadharNumber ?? "",
          emergencyContact: editing.emergencyContact ?? "",
          notes: editing.notes ?? "",
        }
      : defaultForm
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateTenant();
  const updateMutation = useUpdateTenant();

  const set = (k: keyof TenantForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      toast({ title: "Name, phone and email are required", variant: "destructive" });
      return;
    }
    const body = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      aadharNumber: form.aadharNumber.trim() || null,
      emergencyContact: form.emergencyContact.trim() || null,
      notes: form.notes.trim() || null,
    };
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getListTenantsQueryKey() });
    if (editing) {
      updateMutation.mutate(
        { tenantId: editing.id, data: body },
        {
          onSuccess: () => { toast({ title: "Tenant updated" }); invalidate(); onClose(); },
          onError: (err) => toast({ title: "Update failed", description: err.message, variant: "destructive" }),
        }
      );
    } else {
      createMutation.mutate(
        { data: body },
        {
          onSuccess: () => { toast({ title: "Tenant added" }); invalidate(); onClose(); },
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Tenant" : "Add New Tenant"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <F label="Full Name" required>
              <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ramesh Kumar" />
            </F>
            <F label="Phone" required>
              <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="9876543210" />
            </F>
          </div>
          <F label="Email" required>
            <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="tenant@example.com" />
          </F>
          <div className="grid grid-cols-2 gap-4">
            <F label="Aadhaar / ID Number">
              <Input value={form.aadharNumber} onChange={e => set("aadharNumber", e.target.value)} placeholder="XXXX XXXX XXXX" />
            </F>
            <F label="Emergency Contact">
              <Input value={form.emergencyContact} onChange={e => set("emergencyContact", e.target.value)} placeholder="Name: 9876543210" />
            </F>
          </div>
          <F label="Notes">
            <textarea
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              rows={2}
              placeholder="Any additional notes..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </F>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="min-w-24">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Save Changes" : "Add Tenant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteTenantDialog({ tenant, onClose }: { tenant: Tenant | null; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // No useDeleteTenant hook generated — soft-delete via update status
  const updateMutation = useUpdateTenant();

  const onConfirm = () => {
    if (!tenant) return;
    updateMutation.mutate(
      { tenantId: tenant.id, data: { name: tenant.name, email: tenant.email, phone: tenant.phone, status: "inactive" } },
      {
        onSuccess: () => {
          toast({ title: "Tenant deactivated" });
          queryClient.invalidateQueries({ queryKey: getListTenantsQueryKey() });
          onClose();
        },
        onError: (err) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
      }
    );
  };

  return (
    <AlertDialog open={!!tenant} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate Tenant</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to deactivate <strong>{tenant?.name}</strong>? Their record will be kept but marked inactive.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Deactivate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AdminTenants() {
  const { data: tenants, isLoading } = useListTenants();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [deleting, setDeleting] = useState<Tenant | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = (tenants ?? []).filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.phone.includes(q);
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openAdd = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (t: Tenant) => { setEditing(t); setFormOpen(true); };

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Tenants</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {tenants?.length ?? 0} total · {tenants?.filter(t => t.status === "active").length ?? 0} active
            </p>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Add Tenant
          </Button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or phone…"
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
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="bg-white rounded-lg border h-14" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No tenants found</p>
            <Button onClick={openAdd} variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> Add First Tenant
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Aadhaar</TableHead>
                  <TableHead>Emergency Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">{t.phone}</div>
                      <div className="text-xs text-muted-foreground">{t.email}</div>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{t.aadharNumber ?? "—"}</TableCell>
                    <TableCell className="text-sm">{t.emergencyContact ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={t.status === "active" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(t.joinedAt).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(t)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-red-600" onClick={() => setDeleting(t)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <TenantFormModal open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} editing={editing} />
      <DeleteTenantDialog tenant={deleting} onClose={() => setDeleting(null)} />
    </AdminLayout>
  );
}
