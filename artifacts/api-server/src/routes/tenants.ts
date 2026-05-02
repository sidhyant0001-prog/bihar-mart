import { Router, type IRouter } from "express";
import { eq, and, ilike, SQL } from "drizzle-orm";
import { db, tenantsTable } from "@workspace/db";
import { CreateTenantBody, GetTenantParams, UpdateTenantParams, ListTenantsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tenants", async (req, res): Promise<void> => {
  const qp = ListTenantsQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  const { status, search } = qp.data;
  const conditions: SQL[] = [];
  if (status) conditions.push(eq(tenantsTable.status, status));
  if (search) conditions.push(ilike(tenantsTable.name, `%${search}%`));

  const tenants = await db.select().from(tenantsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(tenantsTable.joinedAt);

  res.json(tenants.map(toTenantResponse));
});

router.post("/tenants", async (req, res): Promise<void> => {
  const parsed = CreateTenantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [tenant] = await db.insert(tenantsTable).values(parsed.data).returning();
  res.status(201).json(toTenantResponse(tenant));
});

router.get("/tenants/:tenantId", async (req, res): Promise<void> => {
  const params = GetTenantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [tenant] = await db.select().from(tenantsTable)
    .where(eq(tenantsTable.id, params.data.tenantId));

  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }

  res.json(toTenantResponse(tenant));
});

router.put("/tenants/:tenantId", async (req, res): Promise<void> => {
  const params = UpdateTenantParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateTenantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [tenant] = await db.update(tenantsTable)
    .set(parsed.data)
    .where(eq(tenantsTable.id, params.data.tenantId))
    .returning();

  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }

  res.json(toTenantResponse(tenant));
});

function toTenantResponse(t: typeof tenantsTable.$inferSelect) {
  return {
    id: t.id,
    userId: t.userId ?? null,
    name: t.name,
    email: t.email,
    phone: t.phone,
    aadharNumber: t.aadharNumber ?? null,
    emergencyContact: t.emergencyContact ?? null,
    status: t.status,
    joinedAt: t.joinedAt,
    notes: t.notes ?? null,
  };
}

export default router;
