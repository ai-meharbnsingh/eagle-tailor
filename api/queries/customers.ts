import { getDb } from "./connection";
import { customers, customerPhones, bills } from "@db/schema";
import {
  eq,
  like,
  and,
  desc,
  sql,
  count,
  sum,
} from "drizzle-orm";

export async function listAllCustomers() {
  return getDb().query.customers.findMany({
    where: eq(customers.isDeleted, false),
    with: { phones: true },
    orderBy: desc(customers.updatedAt),
  });
}

export async function searchCustomers(query: string) {
  const db = getDb();
  const searchTerm = `%${query}%`;

  // Search by phone
  const phoneMatches = await db
    .select({ customerId: customerPhones.customerId })
    .from(customerPhones)
    .where(like(customerPhones.phone, searchTerm));

  const customerIds = phoneMatches.map((p) => p.customerId);

  // Search by name
  const nameMatches = await db
    .select({ id: customers.id })
    .from(customers)
    .where(
      and(
        like(customers.name, searchTerm),
        eq(customers.isDeleted, false),
      ),
    );

  nameMatches.forEach((m) => {
    if (!customerIds.includes(m.id)) customerIds.push(m.id);
  });

  if (customerIds.length === 0) return [];

  return db.query.customers.findMany({
    where: and(
      sql`${customers.id} IN (${sql.join(customerIds.map((id) => sql`${id}`), sql`, `)})`,
      eq(customers.isDeleted, false),
    ),
    with: {
      phones: true,
    },
    limit: 20,
  });
}

export async function findCustomerById(id: number) {
  return getDb().query.customers.findFirst({
    where: and(eq(customers.id, id), eq(customers.isDeleted, false)),
    with: {
      phones: true,
      bills: {
        with: {
          book: true,
        },
        orderBy: desc(bills.createdAt),
      },
    },
  });
}

export async function createCustomer(data: {
  name: string;
  address?: string;
  notes?: string;
  phones: { phone: string; isPrimary?: boolean }[];
}) {
  const db = getDb();
  const [{ id }] = await db
    .insert(customers)
    .values({
      name: data.name,
      address: data.address ?? null,
      notes: data.notes ?? null,
    })
    .$returningId();

  if (data.phones.length > 0) {
    await db.insert(customerPhones).values(
      data.phones.map((p) => ({
        customerId: id,
        phone: p.phone,
        isPrimary: p.isPrimary ?? false,
      })),
    );
  }

  return db.query.customers.findFirst({
    where: eq(customers.id, id),
    with: { phones: true },
  });
}

export async function updateCustomer(
  id: number,
  data: {
    name?: string;
    address?: string;
    notes?: string;
    phones?: { phone: string; isPrimary?: boolean }[];
  },
) {
  const db = getDb();
  await db
    .update(customers)
    .set({
      name: data.name,
      address: data.address ?? null,
      notes: data.notes ?? null,
    })
    .where(eq(customers.id, id));

  if (data.phones) {
    await db.delete(customerPhones).where(eq(customerPhones.customerId, id));
    await db.insert(customerPhones).values(
      data.phones.map((p) => ({
        customerId: id,
        phone: p.phone,
        isPrimary: p.isPrimary ?? false,
      })),
    );
  }

  return db.query.customers.findFirst({
    where: eq(customers.id, id),
    with: { phones: true },
  });
}

export async function softDeleteCustomer(id: number) {
  const db = getDb();
  await db
    .update(customers)
    .set({ isDeleted: true })
    .where(eq(customers.id, id));
  return { success: true };
}

export async function getCustomerStats(id: number) {
  const db = getDb();
  const result = await db
    .select({
      totalBills: count(),
      totalAmount: sum(bills.totalAmount),
      totalBalance: sum(bills.balanceDue),
    })
    .from(bills)
    .where(
      and(eq(bills.customerId, id), eq(bills.isDeleted, false)),
    );
  return result[0];
}
