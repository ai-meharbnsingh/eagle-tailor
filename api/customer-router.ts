import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import {
  listAllCustomers,
  searchCustomers,
  findCustomerById,
  createCustomer,
  updateCustomer,
  softDeleteCustomer,
  getCustomerStats,
} from "./queries/customers";

export const customerRouter = createRouter({
  list: authedQuery.query(() => listAllCustomers()),

  search: authedQuery
    .input(z.object({ query: z.string().min(1) }))
    .query(({ input }: { input: { query: string } }) => searchCustomers(input.query)),

  byId: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }: { input: { id: number } }) => findCustomerById(input.id)),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1),
        address: z.string().optional(),
        notes: z.string().optional(),
        phones: z
          .array(
            z.object({
              phone: z.string().min(5),
              isPrimary: z.boolean().optional(),
            }),
          )
          .min(1),
      }),
    )
    .mutation(({ input }: { input: { name: string; address?: string; notes?: string; phones: { phone: string; isPrimary?: boolean }[] } }) => createCustomer(input)),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
        phones: z
          .array(
            z.object({
              phone: z.string().min(5),
              isPrimary: z.boolean().optional(),
            }),
          )
          .min(1)
          .optional(),
      }),
    )
    .mutation(({ input }: { input: { id: number; name?: string; address?: string; notes?: string; phones?: { phone: string; isPrimary?: boolean }[] } }) =>
      updateCustomer(input.id, {
        name: input.name,
        address: input.address,
        notes: input.notes,
        phones: input.phones,
      }),
    ),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(({ input }: { input: { id: number } }) => softDeleteCustomer(input.id)),

  stats: authedQuery
    .input(z.object({ id: z.number() }))
    .query(({ input }: { input: { id: number } }) => getCustomerStats(input.id)),
});
