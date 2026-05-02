import { TenantLayout } from "@/components/layout/TenantLayout";
import { useListPayments, useProcessPayment, getListPaymentsQueryKey } from "@workspace/api-client-react";
import { getSession } from "@/lib/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function TenantPayments() {
  const session = getSession();
  const tenantId = session?.user?.id;
  const { data: payments, isLoading } = useListPayments({ tenantId }, { query: { enabled: !!tenantId, queryKey: getListPaymentsQueryKey({ tenantId }) } });
  const processPayment = useProcessPayment();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handlePay = (paymentId: number, amount: number, method: any, notes: string) => {
    processPayment.mutate(
      { paymentId, data: { amountPaid: amount, paymentMethod: method, notes } },
      {
        onSuccess: () => {
          toast({ title: "Payment processed successfully" });
          queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey({ tenantId }) });
        },
        onError: (err) => {
          toast({ title: "Payment failed", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  return (
    <TenantLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Payments</h1>
        <div className="bg-card rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
              ) : payments?.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.invoiceNumber}</TableCell>
                  <TableCell>{new Date(p.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{formatINR(p.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "paid" ? "default" : p.status === "overdue" ? "destructive" : "secondary"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {p.status !== "paid" && (
                      <PaymentDialog payment={p} onPay={(method, notes) => handlePay(p.id, p.amount, method, notes)} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </TenantLayout>
  );
}

function PaymentDialog({ payment, onPay }: { payment: any, onPay: (method: any, notes: string) => void }) {
  const [method, setMethod] = useState("upi");
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Pay Now</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay Invoice {payment.invoiceNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <div className="text-sm text-muted-foreground mb-2">Amount Due</div>
            <div className="text-2xl font-bold">{formatINR(payment.amount)}</div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Method</label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Transaction ID / Notes (Optional)</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Txn ID or reference..." />
          </div>
          <Button 
            className="w-full" 
            onClick={() => {
              onPay(method, notes);
              setOpen(false);
            }}
          >
            Confirm Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
