import { getDb } from "./connection";
import { shopUsers } from "@db/schema";
import { eq } from "drizzle-orm";

export async function findShopUserById(id: number) {
  return getDb().query.shopUsers.findFirst({
    where: eq(shopUsers.id, id),
  });
}

export async function findActiveShopUsers() {
  return getDb()
    .select({
      id: shopUsers.id,
      name: shopUsers.name,
      role: shopUsers.role,
      isActive: shopUsers.isActive,
    })
    .from(shopUsers)
    .where(eq(shopUsers.isActive, true));
}
