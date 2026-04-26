import { createRouter, authedQuery } from "./middleware";
import { getDashboardStats } from "./queries/bills";

export const dashboardRouter = createRouter({
  stats: authedQuery.query(() => getDashboardStats()),
});
