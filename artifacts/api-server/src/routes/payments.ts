import { Router, type IRouter } from "express";
import { eq, and, gte, lte, SQL } from "drizzle-orm";
import { db, paymentsTable, propertiesTable, tenantsTable } from "@workspace/db";
import {
  CreatePaymentBody,
  GetPaymentParams,
  ProcessPaymentParams,
  ProcessPaymentBody,
  ListPaymentsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/payments", async (req, res): Promise<void> => {
  const qp = ListPaymentsQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  const { leaseId, tenantId, status, startDate, endDate } = qp.data;
  const conditions: SQL[] = [];
  if (leaseId) conditions.push(eq(paymentsTable.leaseId, leaseId));
  if (tenantId) conditions.push(eq(paymentsTable.tenantId, tenantId));
  if (status) conditions.push(eq(paymentsTable.status, status));

  const payments = await db.select().from(paymentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(paymentsTable.dueDate);

  let filtered = payments;
  if (startDate) filtered = filtered.filter(p => p.dueDate >= String(startDate));
  if (endDate) filtered = filtered.filter(p => p.dueDate <= String(endDate));

  const enriched = await Promise.all(filtered.map(async (payment) => {
    const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, payment.propertyId));
    const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, payment.tenantId));
    return toPaymentResponse(payment, property, tenant);
  }));

  res.json(enriched);
});

router.post("/payments", async (req, res): Promise<void> => {
  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { db: dbClient, leasesTable: lt } = await import("@workspace/db");
  const [lease] = await dbClient.select().from(lt).where(eq(lt.id, parsed.data.leaseId));
  if (!lease) {
    res.status(404).json({ error: "Lease not found" });
    return;
  }

  const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const [payment] = await db.insert(paymentsTable).values({
    leaseId: parsed.data.leaseId,
    tenantId: lease.tenantId,
    propertyId: lease.propertyId,
    amount: String(parsed.data.amount),
    dueDate: parsed.data.dueDate,
    invoiceNumber,
    notes: parsed.data.notes ?? null,
    status: "pending",
  }).returning();

  res.status(201).json(toPaymentResponse(payment));
});

router.get("/payments/:paymentId", async (req, res): Promise<void> => {
  const params = GetPaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [payment] = await db.select().from(paymentsTable)
    .where(eq(paymentsTable.id, params.data.paymentId));

  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, payment.propertyId));
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, payment.tenantId));

  res.json(toPaymentResponse(payment, property, tenant));
});

router.post("/payments/:paymentId/pay", async (req, res): Promise<void> => {
  const params = ProcessPaymentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ProcessPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(paymentsTable)
    .where(eq(paymentsTable.id, params.data.paymentId));

  if (!existing) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  const totalAmount = Number(existing.amount) + Number(existing.lateFee ?? 0);
  const amountPaid = parsed.data.amountPaid;
  const newStatus = amountPaid >= totalAmount ? "paid" : amountPaid > 0 ? "partial" : "pending";

  const [payment] = await db.update(paymentsTable)
    .set({
      amountPaid: String(amountPaid),
      paymentMethod: parsed.data.paymentMethod,
      transactionId: parsed.data.transactionId ?? null,
      paidDate: new Date().toISOString().split("T")[0],
      status: newStatus,
      notes: parsed.data.notes ?? existing.notes,
    })
    .where(eq(paymentsTable.id, params.data.paymentId))
    .returning();

  res.json(toPaymentResponse(payment));
});

function toPaymentResponse(
  p: typeof paymentsTable.$inferSelect,
  property?: typeof propertiesTable.$inferSelect,
  tenant?: typeof tenantsTable.$inferSelect
) {
  return {
    id: p.id,
    leaseId: p.leaseId,
    tenantId: p.tenantId,
    propertyId: p.propertyId,
    property: property ? {
      id: property.id,
      name: property.name,
      type: property.type,
      bhk: property.bhk ?? null,
      sizeSqft: Number(property.sizeSqft),
      floor: property.floor ?? null,
      blockOrSector: property.blockOrSector ?? null,
      address: property.address,
      locality: property.locality,
      landmark: property.landmark ?? null,
      rentPrice: property.rentPrice != null ? Number(property.rentPrice) : null,
      salePriceINR: property.salePriceINR != null ? Number(property.salePriceINR) : null,
      rentPeriod: property.rentPeriod ?? null,
      purpose: property.purpose,
      status: property.status,
      description: property.description ?? null,
      photos: property.photos ?? [],
      businessType: property.businessType ?? null,
      amenities: property.amenities ?? [],
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    } : null,
    tenant: tenant ? {
      id: tenant.id,
      userId: tenant.userId ?? null,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      aadharNumber: tenant.aadharNumber ?? null,
      emergencyContact: tenant.emergencyContact ?? null,
      status: tenant.status,
      joinedAt: tenant.joinedAt,
      notes: tenant.notes ?? null,
    } : null,
    amount: Number(p.amount),
    amountPaid: p.amountPaid != null ? Number(p.amountPaid) : null,
    lateFee: p.lateFee != null ? Number(p.lateFee) : null,
    dueDate: p.dueDate,
    paidDate: p.paidDate ?? null,
    status: p.status,
    paymentMethod: p.paymentMethod ?? null,
    transactionId: p.transactionId ?? null,
    invoiceNumber: p.invoiceNumber,
    notes: p.notes ?? null,
    createdAt: p.createdAt,
  };
}

export default router;
