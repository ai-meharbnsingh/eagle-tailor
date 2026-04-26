import { getDb } from "./connection";
import { billPayments, bills } from "@db/schema";
import { eq, and, asc } from "drizzle-orm";

export async function addPayment(data: {
  billId: number;
  amount: number;
  paidAt: string;
  note?: string;
}) {
  const db = getDb();

  // Verify bill exists
  const bill = await db.query.bills.findFirst({
    where: and(eq(bills.id, data.billId), eq(bills.isDeleted, false)),
  });
  if (!bill) throw new Error("Bill not found");

  // Insert payment record
  const [{ id }] = await db
    .insert(billPayments)
    .values({
      billId: data.billId,
      amount: String(data.amount),
      paidAt: new Date(data.paidAt),
      note: data.note ?? null,
    })
    .$returningId();

  // Subtract from balanceDue and add to advancePaid
  const newBalance = Math.max(0, Number(bill.balanceDue) - data.amount);
  await db.update(bills).set({
    balanceDue: String(newBalance),
    advancePaid: String(Number(bill.advancePaid) + data.amount),
  }).where(eq(bills.id, data.billId));

  return db.query.billPayments.findFirst({ where: eq(billPayments.id, id) });
}

export async function listPaymentsByBill(billId: number) {
  return getDb().query.billPayments.findMany({
    where: eq(billPayments.billId, billId),
    orderBy: asc(billPayments.paidAt),
  });
}
