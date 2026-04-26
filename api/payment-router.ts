import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { addPayment, listPaymentsByBill } from "./queries/payments";

export const paymentRouter = createRouter({
  add: authedQuery
    .input(
      z.object({
        billId: z.number().int().positive(),
        amount: z.number().positive(),
        paidAt: z.string(),
        note: z.string().optional(),
      }),
    )
    .mutation(({ input }) => addPayment(input)),

  listByBill: authedQuery
    .input(z.object({ billId: z.number().int().positive() }))
    .query(({ input }) => listPaymentsByBill(input.billId)),
});
