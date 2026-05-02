import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { formatINR } from "@/lib/format";
import {
  Building2, Users, Wallet, Wrench, TrendingUp, AlertCircle,
  Home, CheckCircle2, Clock, MessageSquare,
} from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

function StatCard({ label, value, sub, icon, color, bg }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm flex items-start gap-4">
      <div className={`${bg} ${color} rounded-xl p-3 shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-bold mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: s, isLoading } = useGetDashboardSummary();

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Live overview of your property complex</p>
        </div>

        {isLoading || !s ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl border h-28" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Properties"
                value={s.totalProperties}
                sub={`${s.occupancyRate}% occupancy rate`}
                icon={<Building2 className="w-5 h-5" />}
                color="text-blue-700"
                bg="bg-blue-100"
              />
              <StatCard
                label="Occupied / Available"
                value={`${s.occupiedProperties} / ${s.availableProperties}`}
                sub={`${s.totalProperties - s.occupiedProperties - s.availableProperties} others`}
                icon={<Home className="w-5 h-5" />}
                color="text-emerald-700"
                bg="bg-emerald-100"
              />
              <StatCard
                label="Total Tenants"
                value={s.totalTenants}
                sub={`${s.activeTenants} active`}
                icon={<Users className="w-5 h-5" />}
                color="text-violet-700"
                bg="bg-violet-100"
              />
              <StatCard
                label="Rent Collected (This Month)"
                value={formatINR(s.totalRentCollectedThisMonth)}
                sub={`Total revenue: ${formatINR(s.totalRevenue)}`}
                icon={<Wallet className="w-5 h-5" />}
                color="text-amber-700"
                bg="bg-amber-100"
              />
              <StatCard
                label="Pending Payments"
                value={s.pendingPayments}
                sub="awaiting collection"
                icon={<Clock className="w-5 h-5" />}
                color="text-orange-700"
                bg="bg-orange-100"
              />
              <StatCard
                label="Overdue Payments"
                value={s.overduePayments}
                sub="require immediate action"
                icon={<AlertCircle className="w-5 h-5" />}
                color="text-red-700"
                bg="bg-red-100"
              />
              <StatCard
                label="Pending Maintenance"
                value={s.openMaintenanceRequests}
                sub="open requests"
                icon={<Wrench className="w-5 h-5" />}
                color="text-slate-700"
                bg="bg-slate-100"
              />
              <StatCard
                label="New Inquiries"
                value={s.newInquiries}
                sub="buyer leads"
                icon={<MessageSquare className="w-5 h-5" />}
                color="text-teal-700"
                bg="bg-teal-100"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border p-5 shadow-sm">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Occupancy Breakdown
                </h2>
                <div className="space-y-3">
                  {[
                    { label: "Occupied", value: s.occupiedProperties, total: s.totalProperties, color: "bg-emerald-500" },
                    { label: "Available", value: s.availableProperties, total: s.totalProperties, color: "bg-blue-400" },
                    { label: "Other", value: s.totalProperties - s.occupiedProperties - s.availableProperties, total: s.totalProperties, color: "bg-slate-300" },
                  ].map(row => (
                    <div key={row.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-medium">{row.value}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${row.color} rounded-full transition-all`}
                          style={{ width: `${row.total ? (row.value / row.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border p-5 shadow-sm">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Quick Health Check
                </h2>
                <div className="space-y-3">
                  {[
                    { label: "Occupancy Rate", ok: s.occupancyRate >= 70, detail: `${s.occupancyRate}%` },
                    { label: "Overdue Payments", ok: s.overduePayments === 0, detail: s.overduePayments === 0 ? "None" : `${s.overduePayments} overdue` },
                    { label: "Open Maintenance", ok: s.openMaintenanceRequests <= 5, detail: `${s.openMaintenanceRequests} open` },
                    { label: "New Inquiries", ok: true, detail: `${s.newInquiries} leads` },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.ok ? "bg-emerald-500" : "bg-red-500"}`} />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <span className={`text-sm font-medium ${item.ok ? "text-emerald-700" : "text-red-600"}`}>{item.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
