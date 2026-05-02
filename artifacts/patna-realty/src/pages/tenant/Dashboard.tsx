import { useLocation } from "wouter";
import { getSession, clearSession } from "@/lib/auth";
import { useEffect } from "react";
import { useListLeases, useListPayments, useListMaintenanceRequests, getListLeasesQueryKey, getListPaymentsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TenantDashboard() {
  const [, setLocation] = useLocation();
  const session = getSession();

  useEffect(() => {
    if (!session || (session.role !== "tenant" && session.role !== "shopkeeper")) {
      setLocation("/login");
    }
  }, [session, setLocation]);

  const tenantId = session?.user?.id;
  const { data: leases, isLoading: loadingLeases } = useListLeases({ tenantId }, { query: { enabled: !!tenantId, queryKey: getListLeasesQueryKey({ tenantId }) } });
  const { data: payments, isLoading: loadingPayments } = useListPayments({ tenantId }, { query: { enabled: !!tenantId, queryKey: getListPaymentsQueryKey({ tenantId }) } });

  if (loadingLeases || loadingPayments) return <div className="p-8">Loading your portal...</div>;

  return (
    <div className="min-h-screen bg-muted/10">
      <header className="bg-background border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Tenant Portal</h1>
        <Button variant="outline" onClick={() => { clearSession(); setLocation("/"); }}>Logout</Button>
      </header>
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <h2 className="text-2xl font-semibold">Welcome, {session?.user?.name}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Your Active Lease</CardTitle></CardHeader>
            <CardContent>
              {leases && leases.length > 0 ? (
                <div className="space-y-2">
                  <p><strong>Property:</strong> {leases[0].property?.name}</p>
                  <p><strong>Rent Amount:</strong> ₹{leases[0].rentAmount}</p>
                  <p><strong>Status:</strong> {leases[0].status}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No active lease found.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Recent Payments</CardTitle></CardHeader>
            <CardContent>
              {payments && payments.length > 0 ? (
                <div className="space-y-2">
                  {payments.slice(0, 3).map(p => (
                    <div key={p.id} className="flex justify-between border-b pb-2 last:border-0">
                      <span>{new Date(p.dueDate).toLocaleDateString()}</span>
                      <span className="font-medium">₹{p.amount} - {p.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No recent payments.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
