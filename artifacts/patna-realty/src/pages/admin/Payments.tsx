import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useListPayments, useCreatePayment, useProcessPayment,
  useListLeases, getListPaymentsQueryKey,
} from "@workspace/api-client-react";
import type { Payment } from "@workspace/api-client-react";
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
import { Plus, Search, Wallet, Loader2, CheckCircle2 } from "lucide-react";
import { formatINR } from "@/lib/format";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface RecordForm {
  leaseId: string;
  amount: string;
  dueDate: string;
  paymentMethod: string;
  notes: string;
}

const defaultForm: RecordForm = {
  leaseId: "", amount: "", dueDate: new Date().toISOString().split("T")[0],
  paymentMethod: "cash", notes: "",
};

function RecordPaymentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<RecordForm>(defaultForm);
  const [step, setStep] = useState<"create" | "process">("create");
  const [createdPaymentId, setCreatedPaymentId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreatePayment();
  const processMutation = useProcessPayment();
  const { data: leases } = useListLeases();

  const activeLeases = (leases ?? []).filter(l => l.status === "active");

  const set = (k: keyof RecordForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleClose = () => {
    setForm(defaultForm);
    setStep("create");
    setCreatedPaymentId(null);
    onClose();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leaseId || !form.amount || !form.dueDate) {
      toast({ title: "Lease, amount, and due date are required", variant: "destructive" });
      return;
    }

    const invalidate = () => queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });

    if (step === "create") {
      createMutation.mutate(
        { data: { leaseId: Number(form.leaseId), amount: Number(form.amount), dueDate: form.dueDate, notes: form.notes || null } },
        {
          onSuccess: (payment) => {
            setCreatedPaymentId(payment.id);
            setStep("process");
          },
          onError: (err) => toast({ title: "Failed to create payment", description: err.message, variant: "destructive" }),
        }
      );
    } else if (step === "process" && createdPaymentId) {
      processMutation.mutate(
        {
          paymentId: createdPaymentId,
          data: {
            amountPaid: Number(form.amount),
            paymentMethod: form.paymentMethod as "upi" | "card" | "cash" | "bank_transfer" | "razorpay" | "stripe",
            notes: form.notes || null,
          },
        },
        {
          onSuccess: () => {
            toast({ title: "Payment recorded successfully" });
            invalidate();
            handleClose();
          },
          onError: (err) => toast({ title: "Failed to process payment", description: err.message, variant: "destructive" }),
        }
      );
    }
  };

  const selectedLease = activeLeases.find(l => String(l.id) === form.leaseId);
  const isPending = createMutation.isPending || processMutation.isPending;

  const F = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        {step === "process" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2 text-sm text-emerald-800">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Invoice created. Now mark it as paid below.
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 py-1">
          <F label="Lease (Tenant → Property)" required>
            <Select value={form.leaseId} onValueChange={v => {
              set("leaseId", v);
              const lease = activeLeases.find(l => String(l.id) === v);
              if (lease) set("amount", String(lease.rentAmount));
            }} disabled={step === "process"}>
              <SelectTrigger><SelectValue placeholder="Select active lease…" /></SelectTrigger>
              <SelectContent>
                {activeLeases.map(l => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.tenant?.name ?? `Tenant #${l.tenantId}`} → {l.property?.name ?? `Property #${l.propertyId}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedLease && (
              <p className="text-xs text-muted-foreground">
                Rent: {formatINR(selectedLease.rentAmount)} / {selectedLease.rentPeriod}
              </p>
            )}
          </F>

          <div className="grid grid-cols-2 gap-4">
            <F label="Amount (₹)" required>
              <Input
                type="number"
                value={form.amount}
                onChange={e => set("amount", e.target.value)}
                placeholder="12000"
                disabled={step === "process"}
              />
            </F>
            <F label="Due Date" required>
              <Input
                type="date"
                value={form.dueDate}
                onChange={e => set("dueDate", e.target.value)}
                disabled={step === "process"}
              />
            </F>
          </div>

          {step === "process" && (
            <F label="Payment Method" required>
              <Select value={form.paymentMethod} onValueChange={v => set("paymentMethod", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💵 Cash</SelectItem>
                  <SelectItem value="upi">📱 UPI</SelectItem>
                  <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                  <SelectItem value="card">💳 Card</SelectItem>
                </SelectContent>
              </Select>
            </F>
          )}

          <F label="Notes">
            <textarea
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              rows={2}
              placeholder="e.g. May 2026 rent, partial payment, etc."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </F>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="min-w-28">
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : step === "create" ? (
                "Create Invoice"
              ) : (
                "Mark as Paid"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800",
  partial: "bg-blue-100 text-blue-800",
  waived: "bg-slate-100 text-slate-600",
};

export default function AdminPayments() {
  const { data: payments, isLoading } = useListPayments();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = (payments ?? []).filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (p.tenant?.name ?? "").toLowerCase().includes(q) ||
      (p.invoiceNumber ?? "").toLowerCase().includes(q) ||
      (p.property?.name ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: (payments ?? []).reduce((s, p) => s + Number(p.amount), 0),
    paid: (payments ?? []).filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amountPaid ?? p.amount), 0),
    pending: (payments ?? []).filter(p => p.status === "pending").length,
    overdue: (payments ?? []).filter(p => p.status === "overdue").length,
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Payments</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Collected: {formatINR(stats.paid)} · {stats.pending} pending · {stats.overdue} overdue
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Record Payment
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Billed", value: formatINR(stats.total), color: "text-slate-700" },
            { label: "Collected", value: formatINR(stats.paid), color: "text-emerald-700" },
            { label: "Pending", value: stats.pending, color: "text-amber-700" },
            { label: "Overdue", value: stats.overdue, color: "text-red-700" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border p-3 text-center shadow-sm">
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by tenant, invoice or property…"
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
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="waived">Waived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="bg-white rounded-lg border h-14" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No payments found</p>
            <Button onClick={() => setModalOpen(true)} variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> Record First Payment
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Invoice</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid On</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs">{p.invoiceNumber}</TableCell>
                    <TableCell className="font-medium">{p.tenant?.name ?? `#${p.tenantId}`}</TableCell>
                    <TableCell className="text-sm">{p.property?.name ?? "—"}</TableCell>
                    <TableCell className="font-semibold">{formatINR(p.amount)}</TableCell>
                    <TableCell className="text-sm">{new Date(p.dueDate).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell className="text-sm">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-IN") : "—"}
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {p.paymentMethod ? p.paymentMethod.replace("_", " ") : "—"}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[p.status] ?? "bg-muted"}`}>
                        {p.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <RecordPaymentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </AdminLayout>
  );
}
