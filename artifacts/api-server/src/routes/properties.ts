import { Router, type IRouter } from "express";
import { eq, and, gte, lte, ilike, SQL } from "drizzle-orm";
import { db, propertiesTable } from "@workspace/db";
import { CreatePropertyBody, GetPropertyParams, UpdatePropertyParams, DeletePropertyParams, ListPropertiesQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/properties", async (req, res): Promise<void> => {
  const qp = ListPropertiesQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  const { type, status, purpose, bhk, minPrice, maxPrice, search } = qp.data;

  const conditions: SQL[] = [];
  if (type) conditions.push(eq(propertiesTable.type, type));
  if (status) conditions.push(eq(propertiesTable.status, status));
  if (purpose) conditions.push(eq(propertiesTable.purpose, purpose));
  if (bhk) conditions.push(eq(propertiesTable.bhk, bhk));
  if (search) conditions.push(ilike(propertiesTable.name, `%${search}%`));

  const rows = await db.select().from(propertiesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(propertiesTable.createdAt);

  let filtered = rows;
  if (minPrice != null) {
    filtered = filtered.filter(p => p.rentPrice != null && Number(p.rentPrice) >= minPrice);
  }
  if (maxPrice != null) {
    filtered = filtered.filter(p => p.rentPrice != null && Number(p.rentPrice) <= maxPrice);
  }

  res.json(filtered.map(toPropertyResponse));
});

router.post("/properties", async (req, res): Promise<void> => {
  const parsed = CreatePropertyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [property] = await db.insert(propertiesTable).values({
    ...parsed.data,
    photos: parsed.data.photos ?? [],
    amenities: parsed.data.amenities ?? [],
  }).returning();

  res.status(201).json(toPropertyResponse(property));
});

router.get("/properties/:propertyId", async (req, res): Promise<void> => {
  const params = GetPropertyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [property] = await db.select().from(propertiesTable)
    .where(eq(propertiesTable.id, params.data.propertyId));

  if (!property) {
    res.status(404).json({ error: "Property not found" });
    return;
  }

  res.json(toPropertyResponse(property));
});

router.put("/properties/:propertyId", async (req, res): Promise<void> => {
  const params = UpdatePropertyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreatePropertyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [property] = await db.update(propertiesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(propertiesTable.id, params.data.propertyId))
    .returning();

  if (!property) {
    res.status(404).json({ error: "Property not found" });
    return;
  }

  res.json(toPropertyResponse(property));
});

router.delete("/properties/:propertyId", async (req, res): Promise<void> => {
  const params = DeletePropertyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [property] = await db.delete(propertiesTable)
    .where(eq(propertiesTable.id, params.data.propertyId))
    .returning();

  if (!property) {
    res.status(404).json({ error: "Property not found" });
    return;
  }

  res.json({ message: "Property deleted" });
});

function toPropertyResponse(p: typeof propertiesTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    bhk: p.bhk ?? null,
    sizeSqft: Number(p.sizeSqft),
    floor: p.floor ?? null,
    blockOrSector: p.blockOrSector ?? null,
    address: p.address,
    locality: p.locality,
    landmark: p.landmark ?? null,
    rentPrice: p.rentPrice != null ? Number(p.rentPrice) : null,
    salePriceINR: p.salePriceINR != null ? Number(p.salePriceINR) : null,
    rentPeriod: p.rentPeriod ?? null,
    purpose: p.purpose,
    status: p.status,
    description: p.description ?? null,
    photos: p.photos ?? [],
    businessType: p.businessType ?? null,
    amenities: p.amenities ?? [],
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export default router;
