import { Router, type IRouter } from "express";
import { eq, and, SQL } from "drizzle-orm";
import { db, leasesTable, propertiesTable, tenantsTable } from "@workspace/db";
import { CreateLeaseBody, GetLeaseParams, UpdateLeaseParams, ListLeasesQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/leases", async (req, res): Promise<void> => {
  const qp = ListLeasesQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  const { tenantId, propertyId, status } = qp.data;
  const conditions: SQL[] = [];
  if (tenantId) conditions.push(eq(leasesTable.tenantId, tenantId));
  if (propertyId) conditions.push(eq(leasesTable.propertyId, propertyId));
  if (status) conditions.push(eq(leasesTable.status, status));

  const leases = await db.select().from(leasesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(leasesTable.createdAt);

  const enriched = await Promise.all(leases.map(async (lease) => {
    const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, lease.propertyId));
    const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, lease.tenantId));
    return toLeaseResponse(lease, property, tenant);
  }));

  res.json(enriched);
});

router.post("/leases", async (req, res): Promise<void> => {
  const parsed = CreateLeaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [lease] = await db.insert(leasesTable).values({
    ...parsed.data,
    rentAmount: String(parsed.data.rentAmount),
    securityDeposit: parsed.data.securityDeposit != null ? String(parsed.data.securityDeposit) : null,
    lateFeePercentage: parsed.data.lateFeePercentage != null ? String(parsed.data.lateFeePercentage) : null,
  }).returning();

  res.status(201).json(toLeaseResponse(lease));
});

router.get("/leases/:leaseId", async (req, res): Promise<void> => {
  const params = GetLeaseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [lease] = await db.select().from(leasesTable)
    .where(eq(leasesTable.id, params.data.leaseId));

  if (!lease) {
    res.status(404).json({ error: "Lease not found" });
    return;
  }

  const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, lease.propertyId));
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, lease.tenantId));

  res.json(toLeaseResponse(lease, property, tenant));
});

router.put("/leases/:leaseId", async (req, res): Promise<void> => {
  const params = UpdateLeaseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateLeaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [lease] = await db.update(leasesTable)
    .set({
      ...parsed.data,
      rentAmount: String(parsed.data.rentAmount),
      securityDeposit: parsed.data.securityDeposit != null ? String(parsed.data.securityDeposit) : null,
      lateFeePercentage: parsed.data.lateFeePercentage != null ? String(parsed.data.lateFeePercentage) : null,
    })
    .where(eq(leasesTable.id, params.data.leaseId))
    .returning();

  if (!lease) {
    res.status(404).json({ error: "Lease not found" });
    return;
  }

  res.json(toLeaseResponse(lease));
});

function toLeaseResponse(
  l: typeof leasesTable.$inferSelect,
  property?: typeof propertiesTable.$inferSelect,
  tenant?: typeof tenantsTable.$inferSelect
) {
  return {
    id: l.id,
    propertyId: l.propertyId,
    tenantId: l.tenantId,
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
    startDate: l.startDate,
    endDate: l.endDate ?? null,
    rentAmount: Number(l.rentAmount),
    rentPeriod: l.rentPeriod,
    securityDeposit: l.securityDeposit != null ? Number(l.securityDeposit) : null,
    status: l.status,
    autoRenew: l.autoRenew,
    lateFeePercentage: l.lateFeePercentage != null ? Number(l.lateFeePercentage) : null,
    gracePeriodDays: l.gracePeriodDays ?? null,
    notes: l.notes ?? null,
    createdAt: l.createdAt,
  };
}

export default router;
