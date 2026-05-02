import { Router, type IRouter } from "express";
import { eq, and, SQL } from "drizzle-orm";
import { db, inquiriesTable, propertiesTable } from "@workspace/db";
import {
  CreateInquiryBody,
  UpdateInquiryParams,
  UpdateInquiryBody,
  ListInquiriesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/inquiries", async (req, res): Promise<void> => {
  const qp = ListInquiriesQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }

  const { propertyId, status } = qp.data;
  const conditions: SQL[] = [];
  if (propertyId) conditions.push(eq(inquiriesTable.propertyId, propertyId));
  if (status) conditions.push(eq(inquiriesTable.status, status));

  const inquiries = await db.select().from(inquiriesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(inquiriesTable.createdAt);

  const enriched = await Promise.all(inquiries.map(async (inquiry) => {
    const [property] = await db.select().from(propertiesTable).where(eq(propertiesTable.id, inquiry.propertyId));
    return toInquiryResponse(inquiry, property);
  }));

  res.json(enriched);
});

router.post("/inquiries", async (req, res): Promise<void> => {
  const parsed = CreateInquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [inquiry] = await db.insert(inquiriesTable).values(parsed.data).returning();
  res.status(201).json(toInquiryResponse(inquiry));
});

router.put("/inquiries/:inquiryId", async (req, res): Promise<void> => {
  const params = UpdateInquiryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateInquiryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [inquiry] = await db.update(inquiriesTable)
    .set({ status: parsed.data.status })
    .where(eq(inquiriesTable.id, params.data.inquiryId))
    .returning();

  if (!inquiry) {
    res.status(404).json({ error: "Inquiry not found" });
    return;
  }

  res.json(toInquiryResponse(inquiry));
});

function toInquiryResponse(
  i: typeof inquiriesTable.$inferSelect,
  property?: typeof propertiesTable.$inferSelect
) {
  return {
    id: i.id,
    propertyId: i.propertyId,
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
    name: i.name,
    email: i.email,
    phone: i.phone,
    message: i.message,
    status: i.status,
    createdAt: i.createdAt,
  };
}

export default router;
