import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/format";

export default function AdminDashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        {isLoading || !summary ? (
          <div>Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Revenue (This Month)</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{formatINR(summary.totalRevenue)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Properties</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{summary.occupiedProperties} / {summary.totalProperties} Occupied</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Tenants</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{summary.activeTenants}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Open Maintenance</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{summary.openMaintenanceRequests}</div></CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
