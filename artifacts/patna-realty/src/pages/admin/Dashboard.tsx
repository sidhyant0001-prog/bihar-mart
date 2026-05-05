import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";

interface DashboardStats {
  totalProperties: number;
  occupiedProperties: number;
  availableProperties: number;
  totalTenants: number;
  rentCollectedThisMonth: number;
  pendingMaintenance: number;
  overduePayments: number;
  forSaleProperties: number;
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-xl p-5 ${color} shadow-sm`}>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("adminToken") || "admin-token-123";
    fetch("/api/dashboard", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1e2535]">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Welcome back, Admin</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl p-5 bg-gray-100 animate-pulse h-24" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Properties" value={stats.totalProperties} color="bg-blue-50" />
            <StatCard label="Occupied" value={stats.occupiedProperties} sub={`${Math.round((stats.occupiedProperties/stats.totalProperties)*100)}% occupancy`} color="bg-green-50" />
            <StatCard label="Available" value={stats.availableProperties} color="bg-yellow-50" />
            <StatCard label="For Sale" value={stats.forSaleProperties ?? 0} color="bg-purple-50" />
            <StatCard label="Total Tenants" value={stats.totalTenants} color="bg-indigo-50" />
            <StatCard label="Rent Collected" value={fmt(stats.rentCollectedThisMonth)} sub="This month" color="bg-emerald-50" />
            <StatCard label="Pending Maintenance" value={stats.pendingMaintenance} color="bg-orange-50" />
            <StatCard label="Overdue Payments" value={stats.overduePayments} color="bg-red-50" />
          </div>
        ) : (
          <p className="text-gray-500">Failed to load stats.</p>
        )}
      </div>
    </AdminLayout>
  );
}
