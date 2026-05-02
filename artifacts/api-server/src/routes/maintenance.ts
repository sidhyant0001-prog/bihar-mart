import { Router, type IRouter } from "express";
import { eq, and, SQL } from "drizzle-orm";
import { db, maintenanceTable, propertiesTable, tenantsTable } from "@workspace/db";
import {
  CreateMaintenanceRequestBody,
  GetMaintenanceRequestParams,
  UpdateMaintenanceRequestParams,
  UpdateMaintenanceRequestBody,
  ListMaintenanceRequestsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/maintenance", async (req, res): Promise<void> => {
  const qp = ListMaintenanceRequestsQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  const { propertyId, tenantId, status } = qp.data;
  const conditions: SQL[] = [];
  if (propertyId) conditions.push(eq(maintenanceTable.propertyId, propertyId));
  if (tenantId) conditions.push(eq(maintenanceTable.tenantId, tenantId));
  if (status) conditions.push(eq(maintenanceTable.status, status));

  const requests = await db.select().from(maintenanceTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(maintenanceTable.createdAt);

  const enriched = await Promise.all(requests.map(async (r) => {
    const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, r.propertyId));
    const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, r.tenantId));
    return toMaintenanceResponse(r, property, tenant);
  }));

  res.json(enriched);
});

router.post("/maintenance", async (req, res): Promise<void> => {
  const parsed = CreateMaintenanceRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [request] = await db.insert(maintenanceTable).values(parsed.data).returning();
  res.status(201).json(toMaintenanceResponse(request));
});

router.get("/maintenance/:requestId", async (req, res): Promise<void> => {
  const params = GetMaintenanceRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [request] = await db.select().from(maintenanceTable)
    .where(eq(maintenanceTable.id, params.data.requestId));

  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, request.propertyId));
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, request.tenantId));

  res.json(toMaintenanceResponse(request, property, tenant));
});

router.put("/maintenance/:requestId", async (req, res): Promise<void> => {
  const params = UpdateMaintenanceRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateMaintenanceRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const resolvedAt = parsed.data.status === "resolved" ? new Date() : undefined;

  const [request] = await db.update(maintenanceTable)
    .set({
      status: parsed.data.status,
      adminNotes: parsed.data.adminNotes ?? undefined,
      ...(resolvedAt ? { resolvedAt } : {}),
    })
    .where(eq(maintenanceTable.id, params.data.requestId))
    .returning();

  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  res.json(toMaintenanceResponse(request));
});

function toMaintenanceResponse(
  r: typeof maintenanceTable.$inferSelect,
  property?: typeof propertiesTable.$inferSelect,
  tenant?: typeof tenantsTable.$inferSelect
) {
  return {
    id: r.id,
    propertyId: r.propertyId,
    tenantId: r.tenantId,
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
    title: r.title,
    description: r.description,
    category: r.category,
    priority: r.priority,
    status: r.status,
    resolvedAt: r.resolvedAt ?? null,
    adminNotes: r.adminNotes ?? null,
    createdAt: r.createdAt,
  };
}

export default router;
