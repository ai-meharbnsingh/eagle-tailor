import { getDb } from "./connection";
import { bills, customers, billImages, type Bill } from "@db/schema";
import {
  eq,
  and,
  asc,
  desc,
  like,
  sql,
  count,
  sum,
} from "drizzle-orm";

export async function findBillById(id: number) {
  return getDb().query.bills.findFirst({
    where: and(eq(bills.id, id), eq(bills.isDeleted, false)),
    with: {
      customer: { with: { phones: true } },
      book: true,
      measurements: true,
      images: { orderBy: asc(billImages.sortOrder) },
    },
  });
}

export async function findBillsByCustomer(customerId: number) {
  return getDb().query.bills.findMany({
    where: and(
      eq(bills.customerId, customerId),
      eq(bills.isDeleted, false),
    ),
    with: {
      book: true,
      measurements: true,
    },
    orderBy: desc(bills.createdAt),
  });
}

export async function findBillsByBook(bookId: number) {
  return getDb().query.bills.findMany({
    where: and(eq(bills.bookId, bookId), eq(bills.isDeleted, false)),
    with: {
      customer: {
        with: {
          phones: true,
        },
      },
      book: true,
    },
    orderBy: desc(bills.folioNumber),
  });
}

export async function searchBills(query: string) {
  const db = getDb();
  const searchTerm = `%${query}%`;

  // Search by folio number
  const folioQuery = parseInt(query);
  if (!isNaN(folioQuery)) {
    return db.query.bills.findMany({
      where: and(
        eq(bills.folioNumber, folioQuery),
        eq(bills.isDeleted, false),
      ),
      with: {
        customer: {
          with: { phones: true },
        },
        book: true,
      },
      limit: 20,
    });
  }

  // Search by customer name — find matching customer IDs first, then fetch bills
  const customerMatches = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(like(customers.name, searchTerm), eq(customers.isDeleted, false)));

  if (customerMatches.length === 0) return [];

  const customerIds = customerMatches.map((c) => c.id);
  return db.query.bills.findMany({
    where: and(
      sql`${bills.customerId} IN (${sql.join(customerIds.map((id) => sql`${id}`), sql`, `)})`,
      eq(bills.isDeleted, false),
    ),
    with: {
      customer: {
        with: { phones: true },
      },
      book: true,
    },
    limit: 20,
  });
}

export async function createBill(data: {
  bookId: number;
  customerId: number;
  folioNumber: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  billDate: string;
  deliveryDate?: string;
  totalAmount?: number;
  advancePaid?: number;
  remarks?: string;
  status?: string;
  createdBy?: number;
}) {
  const db = getDb();

  const total = data.totalAmount ?? 0;
  const advance = data.advancePaid ?? 0;
  const balance = total - advance;

  const [{ id }] = await db
    .insert(bills)
    .values({
      bookId: data.bookId,
      customerId: data.customerId,
      folioNumber: data.folioNumber,
      imageUrl: data.imageUrl ?? null,
      thumbnailUrl: data.thumbnailUrl ?? null,
      billDate: new Date(data.billDate),
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
      totalAmount: String(total),
      advancePaid: String(advance),
      balanceDue: String(balance),
      status: (data.status as Bill["status"]) ?? "pending",
      remarks: data.remarks ?? null,
      createdBy: data.createdBy ?? null,
    })
    .$returningId();

  return db.query.bills.findFirst({
    where: eq(bills.id, id),
    with: {
      customer: {
        with: { phones: true },
      },
      book: true,
    },
  });
}

export async function updateBill(
  id: number,
  data: {
    status?: string;
    totalAmount?: number;
    advancePaid?: number;
    deliveryDate?: string;
    actualDeliveryDate?: string;
    remarks?: string;
  },
) {
  const db = getDb();
  const existing = await db.query.bills.findFirst({
    where: eq(bills.id, id),
  });
  if (!existing) throw new Error("Bill not found");

  const updates: Partial<Bill> = {
    status: (data.status as Bill["status"]) ?? existing.status,
    deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : existing.deliveryDate,
    actualDeliveryDate: data.actualDeliveryDate ? new Date(data.actualDeliveryDate) : existing.actualDeliveryDate,
    remarks: data.remarks ?? existing.remarks,
  };

  if (data.totalAmount !== undefined || data.advancePaid !== undefined) {
    const total = data.totalAmount ?? Number(existing.totalAmount);
    const advance = data.advancePaid ?? Number(existing.advancePaid);
    const balance = total - advance;
    updates.totalAmount = String(total);
    updates.advancePaid = String(advance);
    updates.balanceDue = String(balance);
  }

  await db
    .update(bills)
    .set(updates)
    .where(eq(bills.id, id));

  return db.query.bills.findFirst({
    where: eq(bills.id, id),
    with: {
      customer: {
        with: { phones: true },
      },
      book: true,
    },
  });
}

export async function softDeleteBill(id: number) {
  const db = getDb();
  await db
    .update(bills)
    .set({ isDeleted: true })
    .where(eq(bills.id, id));
  // Child records (billPayments, billImages, billMeasurements) remain;
  // they do not have an isDeleted column.
  return { success: true };
}

export async function listBills(filters?: { status?: Bill['status'] }, limit = 10, offset = 0) {
  const db = getDb();
  const whereClause = filters?.status
    ? and(eq(bills.isDeleted, false), eq(bills.status, filters.status))
    : eq(bills.isDeleted, false);

  return db.query.bills.findMany({
    where: whereClause,
    with: {
      customer: { with: { phones: true } },
      book: true,
    },
    orderBy: desc(bills.createdAt),
    limit,
    offset,
  });
}

export async function getBillsPendingBalance() {
  const db = getDb();
  return db.query.bills.findMany({
    where: and(
      eq(bills.isDeleted, false),
      sql`${bills.balanceDue} > 0`,
    ),
    with: {
      customer: { with: { phones: true } },
      book: true,
    },
    orderBy: desc(bills.balanceDue),
    limit: 200,
  });
}

export async function getDueDeliveries() {
  const db = getDb();
  return db.query.bills.findMany({
    where: and(
      eq(bills.isDeleted, false),
      sql`${bills.status} IN ('pending', 'cutting', 'stitching', 'ready')`,
    ),
    with: {
      customer: {
        with: { phones: true },
      },
      book: true,
    },
    orderBy: asc(bills.deliveryDate),
    limit: 50,
  });
}

export async function getDashboardStats() {
  const db = getDb();

  const customerCount = await db
    .select({ count: count() })
    .from(customers)
    .where(eq(customers.isDeleted, false));

  const billStats = await db
    .select({
      totalBills: count(),
      totalRevenue: sum(bills.totalAmount),
      pendingBalance: sum(bills.balanceDue),
      deliveredCount: count(),
    })
    .from(bills)
    .where(eq(bills.isDeleted, false));

  const deliveredCount = await db
    .select({ count: count() })
    .from(bills)
    .where(
      and(eq(bills.isDeleted, false), eq(bills.status, "delivered")),
    );

  const pendingDelivery = await db
    .select({ count: count() })
    .from(bills)
    .where(
      and(
        eq(bills.isDeleted, false),
        sql`${bills.status} IN ('pending', 'cutting', 'stitching', 'ready')`,
      ),
    );

  return {
    customers: customerCount[0]?.count ?? 0,
    totalBills: billStats[0]?.totalBills ?? 0,
    totalRevenue: Number(billStats[0]?.totalRevenue ?? 0),
    pendingBalance: Number(billStats[0]?.pendingBalance ?? 0),
    delivered: deliveredCount[0]?.count ?? 0,
    pendingDelivery: pendingDelivery[0]?.count ?? 0,
  };
}

export async function listBillImages(billId: number) {
  return getDb().query.billImages.findMany({
    where: eq(billImages.billId, billId),
    orderBy: asc(billImages.sortOrder),
  });
}

export async function addBillImage(data: {
  billId: number;
  imageUrl: string;
  thumbnailUrl?: string;
  sortOrder?: number;
}) {
  const db = getDb();
  const bill = await db.query.bills.findFirst({ where: eq(bills.id, data.billId) });
  if (!bill) throw new Error("Bill not found");
  const existing = await db.query.billImages.findMany({ where: eq(billImages.billId, data.billId) });
  const [{ id }] = await db.insert(billImages).values({
    billId: data.billId,
    imageUrl: data.imageUrl,
    thumbnailUrl: data.thumbnailUrl ?? null,
    sortOrder: data.sortOrder ?? existing.length,
  }).$returningId();
  return db.query.billImages.findFirst({ where: eq(billImages.id, id) });
}

export async function deleteBillImage(imageId: number) {
  const db = getDb();
  await db.delete(billImages).where(eq(billImages.id, imageId));
  return { success: true };
}
