import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  findBillById,
  findBillsByCustomer,
  findBillsByBook,
  searchBills,
  listBills,
  getBillsPendingBalance,
  createBill,
  updateBill,
  softDeleteBill,
  getDueDeliveries,
  addBillImage,
  deleteBillImage,
  listBillImages,
} from "./queries/bills";

export const billRouter = createRouter({
  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }: { input: { id: number } }) => findBillById(input.id)),

  byCustomer: authedQuery
    .input(z.object({ customerId: z.number() }))
    .query(({ input }: { input: { customerId: number } }) =>
      findBillsByCustomer(input.customerId),
    ),

  byBook: authedQuery
    .input(z.object({ bookId: z.number() }))
    .query(({ input }: { input: { bookId: number } }) =>
      findBillsByBook(input.bookId),
    ),

  search: authedQuery
    .input(z.object({ query: z.string().min(1) }))
    .query(({ input }: { input: { query: string } }) =>
      searchBills(input.query),
    ),

  create: authedQuery
    .input(
      z.object({
        bookId: z.number(),
        customerId: z.number(),
        folioNumber: z.number(),
        imageUrl: z.string().url().max(500).optional(),
        thumbnailUrl: z.string().url().max(500).optional(),
        billDate: z.string(),
        deliveryDate: z.string().optional(),
        totalAmount: z.number().nonnegative().optional(),
        advancePaid: z.number().nonnegative().optional(),
        remarks: z.string().optional(),
        status: z.enum(["pending", "cutting", "stitching", "ready", "delivered", "cancelled"]).optional(),
      }),
    )
    .mutation(({ ctx, input }: { ctx: { shopUser?: { id: number }; user?: { id: number } }; input: Parameters<typeof createBill>[0] }) =>
      createBill({
        ...input,
        createdBy: ctx.shopUser?.id ?? ctx.user?.id,
      }),
    ),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "cutting", "stitching", "ready", "delivered", "cancelled"]).optional(),
        totalAmount: z.number().nonnegative().optional(),
        advancePaid: z.number().nonnegative().optional(),
        deliveryDate: z.string().optional(),
        actualDeliveryDate: z.string().optional(),
        remarks: z.string().optional(),
        bookId: z.number().int().positive().optional(),
        folioNumber: z.number().int().positive().optional(),
        customerId: z.number().int().positive().optional(),
      }),
    )
    .mutation(({ input }: { input: { id: number; status?: string; totalAmount?: number; advancePaid?: number; deliveryDate?: string; actualDeliveryDate?: string; remarks?: string; bookId?: number; folioNumber?: number; customerId?: number } }) =>
      updateBill(input.id, {
        status: input.status,
        totalAmount: input.totalAmount,
        advancePaid: input.advancePaid,
        deliveryDate: input.deliveryDate,
        actualDeliveryDate: input.actualDeliveryDate,
        remarks: input.remarks,
        bookId: input.bookId,
        folioNumber: input.folioNumber,
        customerId: input.customerId,
      }),
    ),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }: { input: { id: number } }) => softDeleteBill(input.id)),

  dueDeliveries: authedQuery.query(() => getDueDeliveries()),

  list: authedQuery
    .input(z.object({ status: z.enum(["pending", "cutting", "stitching", "ready", "delivered", "cancelled"]).optional(), limit: z.number().min(1).max(100).optional().default(10), offset: z.number().optional() }))
    .query(({ input }) => listBills(
      input.status ? { status: input.status } : undefined,
      input.limit ?? 10,
      input.offset ?? 0,
    )),

  pendingBalance: authedQuery.query(() => getBillsPendingBalance()),

  listImages: authedQuery
    .input(z.object({ billId: z.number() }))
    .query(({ input }) => listBillImages(input.billId)),

  addImage: authedQuery
    .input(z.object({
      billId: z.number(),
      imageUrl: z.string(),
      thumbnailUrl: z.string().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(({ input }) => addBillImage(input)),

  deleteImage: authedQuery
    .input(z.object({ imageId: z.number() }))
    .mutation(({ input }) => deleteBillImage(input.imageId)),
});
