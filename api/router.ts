import { authRouter } from "./auth-router";
import { pinAuthRouter } from "./pin-auth-router";
import { bookRouter } from "./book-router";
import { customerRouter } from "./customer-router";
import { billRouter } from "./bill-router";
import { dashboardRouter } from "./dashboard-router";
import { paymentRouter } from "./payment-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  pinAuth: pinAuthRouter,
  book: bookRouter,
  customer: customerRouter,
  bill: billRouter,
  dashboard: dashboardRouter,
  payment: paymentRouter,
});

export type AppRouter = typeof appRouter;
