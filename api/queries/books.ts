import { getDb } from "./connection";
import { books, bills, billPayments, billImages, billMeasurements } from "@db/schema";
import { eq, desc, and, count, sum, asc, inArray, max } from "drizzle-orm";

export async function findBookById(id: number) {
  return getDb().query.books.findFirst({
    where: eq(books.id, id),
  });
}

export async function updateBook(id: number, data: { name?: string; startSerial?: number; endSerial?: number | null }) {
  const db = getDb();
  await db.update(books).set({ ...data }).where(eq(books.id, id));
  return db.query.books.findFirst({ where: eq(books.id, id) });
}

export async function findBillsInBook(bookId: number, search?: string) {
  const db = getDb();
  const billList = await db.query.bills.findMany({
    where: and(eq(bills.bookId, bookId), eq(bills.isDeleted, false)),
    with: {
      customer: { with: { phones: true } },
    },
    orderBy: asc(bills.folioNumber),
  });

  if (!search) return billList;

  const q = search.toLowerCase();
  return billList.filter((b) => {
    const folioMatch = String(b.folioNumber).includes(q);
    const nameMatch = b.customer?.name?.toLowerCase().includes(q) ?? false;
    const phoneMatch = b.customer?.phones?.some((p) => p.phone.includes(q)) ?? false;
    return folioMatch || nameMatch || phoneMatch;
  });
}

export async function findAllBooks() {
  return getDb().query.books.findMany({
    orderBy: desc(books.createdAt),
  });
}

export async function findCurrentBook() {
  return getDb().query.books.findFirst({
    where: eq(books.isCurrent, true),
  });
}

export async function createBook(data: {
  name: string;
  startSerial: number;
  endSerial?: number;
  isCurrent?: boolean;
}) {
  const db = getDb();
  if (data.isCurrent) {
    await db
      .update(books)
      .set({ isCurrent: false })
      .where(eq(books.isCurrent, true));
  }
  const [{ id }] = await db
    .insert(books)
    .values({
      name: data.name,
      startSerial: data.startSerial,
      endSerial: data.endSerial ?? null,
      isCurrent: data.isCurrent ?? false,
    })
    .$returningId();
  return db.query.books.findFirst({ where: eq(books.id, id) });
}

export async function setCurrentBook(id: number) {
  const db = getDb();
  await db
    .update(books)
    .set({ isCurrent: false })
    .where(eq(books.isCurrent, true));
  await db.update(books).set({ isCurrent: true }).where(eq(books.id, id));
  return db.query.books.findFirst({ where: eq(books.id, id) });
}

export async function deleteBook(id: number) {
  const db = getDb();

  return db.transaction(async (tx) => {
    // Collect all bill IDs in this book
    const billRows = await tx
      .select({ id: bills.id })
      .from(bills)
      .where(eq(bills.bookId, id));

    if (billRows.length > 0) {
      const billIds = billRows.map((b) => b.id);
      // Cascade: delete payments, images, measurements for all bills
      await tx.delete(billPayments).where(inArray(billPayments.billId, billIds));
      await tx.delete(billImages).where(inArray(billImages.billId, billIds));
      await tx.delete(billMeasurements).where(inArray(billMeasurements.billId, billIds));
      await tx.delete(bills).where(inArray(bills.id, billIds));
    }

    await tx.delete(books).where(eq(books.id, id));
    return { success: true };
  });
}

export async function getNextFolioNumber(bookId: number) {
  const db = getDb();
  const book = await db.query.books.findFirst({ where: eq(books.id, bookId) });
  const start = book?.startSerial ?? 1;

  // Fetch ALL folio numbers in this book (including soft-deleted — physical books don't reuse folios)
  const rows = await db
    .select({ folioNumber: bills.folioNumber })
    .from(bills)
    .where(eq(bills.bookId, bookId));

  const taken = new Set(rows.map((r) => r.folioNumber));

  // Find the lowest gap starting from startSerial
  let next = start;
  while (taken.has(next)) next++;
  return next;
}

export async function isFolioTaken(bookId: number, folioNumber: number) {
  const existing = await getDb().query.bills.findFirst({
    where: and(eq(bills.bookId, bookId), eq(bills.folioNumber, folioNumber)),
  });
  return !!existing;
}

export async function getBookStats(bookId: number) {
  const db = getDb();
  const result = await db
    .select({
      billCount: count(),
      lastFolio: max(bills.folioNumber),
      totalRevenue: sum(bills.totalAmount),
    })
    .from(bills)
    .where(and(eq(bills.bookId, bookId), eq(bills.isDeleted, false)));
  return result[0];
}
