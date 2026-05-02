import { Router, type IRouter } from "express";
import { eq, count, sql } from "drizzle-orm";
import { db, propertiesTable, tenantsTable, leasesTable, paymentsTable, maintenanceTable, inquiriesTable } from "@workspace/db";
import { GetRentRollQueryParams, GetCollectionReportQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [propCounts] = await db.select({
    total: count(),
    occupied: sql<number>`count(*) filter (where status = 'occupied')`,
    available: sql<number>`count(*) filter (where status = 'available')`,
  }).from(propertiesTable);

  const [tenantCounts] = await db.select({
    total: count(),
    active: sql<number>`count(*) filter (where status = 'active')`,
  }).from(tenantsTable);

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  const thisMonthPayments = await db.select().from(paymentsTable)
    .where(sql`due_date >= ${firstOfMonth} and due_date <= ${lastOfMonth}`);

  const totalCollectedThisMonth = thisMonthPayments
    .filter(p => p.status === "paid" || p.status === "partial")
    .reduce((sum, p) => sum + Number(p.amountPaid ?? 0), 0);

  const pendingPayments = thisMonthPayments.filter(p => p.status === "pending").length;
  const overduePayments = await db.select({ count: count() }).from(paymentsTable)
    .where(eq(paymentsTable.status, "overdue"));

  const allPayments = await db.select().from(paymentsTable).where(eq(paymentsTable.status, "paid"));
  const totalRevenue = allPayments.reduce((sum, p) => sum + Number(p.amountPaid ?? 0), 0);

  const [openMaintenance] = await db.select({ count: count() }).from(maintenanceTable)
    .where(eq(maintenanceTable.status, "open"));

  const [newInquiries] = await db.select({ count: count() }).from(inquiriesTable)
    .where(eq(inquiriesTable.status, "new"));

  const totalProps = Number(propCounts?.total ?? 0);
  const occupiedProps = Number(propCounts?.occupied ?? 0);
  const occupancyRate = totalProps > 0 ? (occupiedProps / totalProps) * 100 : 0;

  res.json({
    totalProperties: totalProps,
    occupiedProperties: occupiedProps,
    availableProperties: Number(propCounts?.available ?? 0),
    totalTenants: Number(tenantCounts?.total ?? 0),
    activeTenants: Number(tenantCounts?.active ?? 0),
    totalRentCollectedThisMonth: totalCollectedThisMonth,
    pendingPayments,
    overduePayments: Number(overduePayments[0]?.count ?? 0),
    totalRevenue,
    openMaintenanceRequests: Number(openMaintenance?.count ?? 0),
    newInquiries: Number(newInquiries?.count ?? 0),
    occupancyRate: Math.round(occupancyRate * 10) / 10,
  });
});

router.get("/dashboard/rent-roll", async (req, res): Promise<void> => {
  const qp = GetRentRollQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  const now = new Date();
  const month = qp.data.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, monthNum] = month.split("-");
  const firstOfMonth = `${year}-${monthNum}-01`;
  const lastOfMonth = new Date(Number(year), Number(monthNum), 0).toISOString().split("T")[0];

  const payments = await db.select().from(paymentsTable)
    .where(sql`due_date >= ${firstOfMonth} and due_date <= ${lastOfMonth}`);

  const entries = await Promise.all(payments.map(async (p) => {
    const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, p.tenantId));
    const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, p.propertyId));
    const [lease] = await db.select().from(leasesTable).where(eq(leasesTable.id, p.leaseId));

    const balance = Number(p.amount) - Number(p.amountPaid ?? 0);

    return {
      tenantName: tenant?.name ?? "Unknown",
      propertyName: property?.name ?? "Unknown",
      propertyType: property?.type ?? "flat",
      unitNumber: property?.blockOrSector ?? null,
      rentAmount: Number(p.amount),
      rentPeriod: lease?.rentPeriod ?? "monthly",
      dueDate: p.dueDate,
      status: p.status as "pending" | "paid" | "partial" | "overdue",
      amountPaid: p.amountPaid != null ? Number(p.amountPaid) : null,
      balance: balance >= 0 ? balance : 0,
    };
  }));

  res.json(entries);
});

router.get("/dashboard/collection-report", async (req, res): Promise<void> => {
  const qp = GetCollectionReportQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  const period = qp.data.period ?? "monthly";
  const now = new Date();
  let startDate: string;
  let endDate: string;

  if (qp.data.startDate && qp.data.endDate) {
    startDate = String(qp.data.startDate);
    endDate = String(qp.data.endDate);
  } else {
    endDate = now.toISOString().split("T")[0];
    const start = new Date(now);
    if (period === "daily") start.setDate(start.getDate() - 7);
    else if (period === "weekly") start.setDate(start.getDate() - 28);
    else if (period === "monthly") start.setMonth(start.getMonth() - 12);
    else start.setFullYear(start.getFullYear() - 5);
    startDate = start.toISOString().split("T")[0];
  }

  const payments = await db.select().from(paymentsTable)
    .where(sql`due_date >= ${startDate} and due_date <= ${endDate}`);

  const totalExpected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCollected = payments
    .filter(p => p.status === "paid" || p.status === "partial")
    .reduce((sum, p) => sum + Number(p.amountPaid ?? 0), 0);
  const totalPending = totalExpected - totalCollected;
  const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

  // Build breakdown by period
  const groups: Record<string, { expected: number; collected: number }> = {};
  for (const p of payments) {
    let label: string;
    const date = new Date(p.dueDate);
    if (period === "daily") label = p.dueDate;
    else if (period === "weekly") {
      const weekNum = Math.ceil(date.getDate() / 7);
      label = `${date.toLocaleString("default", { month: "short" })} W${weekNum}`;
    } else if (period === "monthly") {
      label = date.toLocaleString("default", { month: "short", year: "numeric" });
    } else {
      label = String(date.getFullYear());
    }

    if (!groups[label]) groups[label] = { expected: 0, collected: 0 };
    groups[label].expected += Number(p.amount);
    if (p.status === "paid" || p.status === "partial") {
      groups[label].collected += Number(p.amountPaid ?? 0);
    }
  }

  const breakdown = Object.entries(groups).map(([label, vals]) => ({
    label,
    expected: vals.expected,
    collected: vals.collected,
  }));

  res.json({
    period,
    totalExpected,
    totalCollected,
    totalPending,
    collectionRate: Math.round(collectionRate * 10) / 10,
    breakdown,
  });
});

router.get("/dashboard/occupancy", async (_req, res): Promise<void> => {
  const properties = await db.select().from(propertiesTable);

  const types = ["flat", "shop", "grocery_store", "market"] as const;
  const byType = types.map((type) => {
    const typeProps = properties.filter(p => p.type === type);
    const total = typeProps.length;
    const occupied = typeProps.filter(p => p.status === "occupied").length;
    return {
      type,
      total,
      occupied,
      occupancyRate: total > 0 ? Math.round((occupied / total) * 1000) / 10 : 0,
    };
  }).filter(t => t.total > 0);

  const total = properties.length;
  const occupied = properties.filter(p => p.status === "occupied").length;
  const overall = total > 0 ? Math.round((occupied / total) * 1000) / 10 : 0;

  res.json({ overall, byType });
});

router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const activities: Array<{
    id: number;
    type: string;
    description: string;
    amount: number | null;
    timestamp: Date;
    entityId: number | null;
  }> = [];

  const recentPayments = await db.select().from(paymentsTable)
    .where(eq(paymentsTable.status, "paid"))
    .orderBy(sql`created_at desc`)
    .limit(5);

  for (const p of recentPayments) {
    const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, p.tenantId));
    activities.push({
      id: p.id,
      type: "payment_received",
      description: `Payment of ₹${Number(p.amountPaid ?? p.amount).toLocaleString("en-IN")} received from ${tenant?.name ?? "Unknown"}`,
      amount: Number(p.amountPaid ?? p.amount),
      timestamp: p.createdAt,
      entityId: p.id,
    });
  }

  const recentMaintenance = await db.select().from(maintenanceTable)
    .orderBy(sql`created_at desc`)
    .limit(3);

  for (const m of recentMaintenance) {
    activities.push({
      id: m.id + 10000,
      type: "maintenance_opened",
      description: `Maintenance request: ${m.title} (${m.priority} priority)`,
      amount: null,
      timestamp: m.createdAt,
      entityId: m.id,
    });
  }

  const recentInquiries = await db.select().from(inquiriesTable)
    .orderBy(sql`created_at desc`)
    .limit(3);

  for (const i of recentInquiries) {
    activities.push({
      id: i.id + 20000,
      type: "inquiry_received",
      description: `New inquiry from ${i.name} for property`,
      amount: null,
      timestamp: i.createdAt,
      entityId: i.id,
    });
  }

  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  res.json(activities.slice(0, 10));
});

export default router;
