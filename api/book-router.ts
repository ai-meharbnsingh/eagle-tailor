import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  findAllBooks,
  findCurrentBook,
  findBookById,
  updateBook,
  findBillsInBook,
  createBook,
  setCurrentBook,
  deleteBook,
  getNextFolioNumber,
  isFolioTaken,
  getBookStats,
} from "./queries/books";

export const bookRouter = createRouter({
  list: authedQuery.query(() => findAllBooks()),

  current: authedQuery.query(() => findCurrentBook()),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }) => findBookById(input.id)),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        startSerial: z.number().int().positive().optional(),
        endSerial: z.number().int().positive().nullable().optional(),
      }),
    )
    .mutation(({ input }) => updateBook(input.id, {
      name: input.name,
      startSerial: input.startSerial,
      endSerial: input.endSerial,
    })),

  bills: authedQuery
    .input(z.object({ bookId: z.number(), search: z.string().optional() }))
    .query(({ input }) => findBillsInBook(input.bookId, input.search)),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1),
        startSerial: z.number().int().positive(),
        endSerial: z.number().int().positive().optional(),
        isCurrent: z.boolean().optional(),
      }).refine((data) => !data.endSerial || data.endSerial >= data.startSerial, {
        message: "endSerial must be >= startSerial",
      }),
    )
    .mutation(({ input }) =>
      createBook({
        name: input.name,
        startSerial: input.startSerial,
        endSerial: input.endSerial,
        isCurrent: input.isCurrent,
      }),
    ),

  setCurrent: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => setCurrentBook(input.id)),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteBook(input.id)),

  nextFolio: authedQuery
    .input(z.object({ bookId: z.number() }))
    .query(({ input }) => getNextFolioNumber(input.bookId)),

  checkFolio: authedQuery
    .input(z.object({ bookId: z.number(), folioNumber: z.number().int().positive() }))
    .query(({ input }) => isFolioTaken(input.bookId, input.folioNumber)),

  stats: authedQuery
    .input(z.object({ bookId: z.number() }))
    .query(({ input }) => getBookStats(input.bookId)),
});
