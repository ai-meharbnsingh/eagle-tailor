import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  bigint,
  decimal,
  boolean,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// ─── OAuth Users (for admin/system auth) ───
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Shop Users (PIN-based authentication) ───
export const shopUsers = mysqlTable("shop_users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  pinHash: varchar("pin_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["owner", "helper"]).default("helper").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ShopUser = typeof shopUsers.$inferSelect;
export type InsertShopUser = typeof shopUsers.$inferInsert;

// ─── Books (Physical ledger registers) ───
export const books = mysqlTable("books", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  startSerial: int("start_serial").notNull(),
  endSerial: int("end_serial"),
  isCurrent: boolean("is_current").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Book = typeof books.$inferSelect;
export type InsertBook = typeof books.$inferInsert;

// ─── Customers ───
export const customers = mysqlTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    address: text("address"),
    notes: text("notes"),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    nameIdx: index("name_idx").on(table.name),
  }),
);

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

// ─── Customer Phones ───
export const customerPhones = mysqlTable(
  "customer_phones",
  {
    id: serial("id").primaryKey(),
    customerId: bigint("customer_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    phone: varchar("phone", { length: 20 }).notNull().unique(),
    isPrimary: boolean("is_primary").default(false).notNull(),
  },
  (table) => ({
    phoneIdx: index("phone_idx").on(table.phone),
    customerIdx: index("customer_phone_idx").on(table.customerId),
  }),
);

export type CustomerPhone = typeof customerPhones.$inferSelect;
export type InsertCustomerPhone = typeof customerPhones.$inferInsert;

// ─── Bills ───
export const bills = mysqlTable(
  "bills",
  {
    id: serial("id").primaryKey(),
    bookId: bigint("book_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    customerId: bigint("customer_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    folioNumber: int("folio_number").notNull(),
    imageUrl: varchar("image_url", { length: 500 }),
    thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
    billDate: date("bill_date").notNull(),
    deliveryDate: date("delivery_date"),
    actualDeliveryDate: date("actual_delivery_date"),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    advancePaid: decimal("advance_paid", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    balanceDue: decimal("balance_due", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    status: mysqlEnum("status", [
      "pending",
      "cutting",
      "stitching",
      "ready",
      "delivered",
      "cancelled",
    ])
      .default("pending")
      .notNull(),
    remarks: text("remarks"),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    createdBy: bigint("created_by", { mode: "number", unsigned: true }).references(
      () => shopUsers.id,
      { onDelete: "set null" },
    ),
  },
  (table) => ({
    bookFolioIdx: uniqueIndex("book_folio_idx").on(
      table.bookId,
      table.folioNumber,
    ),
    customerIdx: index("bill_customer_idx").on(table.customerId),
    statusIdx: index("status_idx").on(table.status),
    dateIdx: index("bill_date_idx").on(table.billDate),
  }),
);

export type Bill = typeof bills.$inferSelect;
export type InsertBill = typeof bills.$inferInsert;

// ─── Bill Measurements ───
export const billMeasurements = mysqlTable(
  "bill_measurements",
  {
    id: serial("id").primaryKey(),
    billId: bigint("bill_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => bills.id, { onDelete: "cascade" }),
    garmentType: varchar("garment_type", { length: 100 }),
    measurements: text("measurements"), // JSON string
    isVerified: boolean("is_verified").default(false).notNull(),
  },
  (table) => ({
    billIdx: index("bm_bill_idx").on(table.billId),
  }),
);

export type BillMeasurement = typeof billMeasurements.$inferSelect;

// ─── Bill Payments (payment installments against a bill) ───
export const billPayments = mysqlTable(
  "bill_payments",
  {
    id: serial("id").primaryKey(),
    billId: bigint("bill_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => bills.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    paidAt: date("paid_at").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    billIdx: index("bp_bill_idx").on(table.billId),
  }),
);

export type BillPayment = typeof billPayments.$inferSelect;
export type InsertBillPayment = typeof billPayments.$inferInsert;

// ─── Bill Images (multiple photos per bill) ───
export const billImages = mysqlTable(
  "bill_images",
  {
    id: serial("id").primaryKey(),
    billId: bigint("bill_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => bills.id, { onDelete: "cascade" }),
    imageUrl: varchar("image_url", { length: 500 }).notNull(),
    thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
    sortOrder: int("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    billIdx: index("bi_bill_idx").on(table.billId),
  }),
);

export type BillImage = typeof billImages.$inferSelect;
export type InsertBillImage = typeof billImages.$inferInsert;

// ─── Audit Log ───
export const auditLog = mysqlTable("audit_log", {
  id: serial("id").primaryKey(),
  tableName: varchar("table_name", { length: 50 }).notNull(),
  recordId: bigint("record_id", { mode: "number", unsigned: true }).notNull(),
  action: mysqlEnum("action", ["create", "update", "delete", "restore"])
    .notNull(),
  oldData: text("old_data"),
  newData: text("new_data"),
  changedBy: bigint("changed_by", { mode: "number", unsigned: true }).references(
    () => shopUsers.id,
    { onDelete: "set null" },
  ),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});

// ─── Relations ───
export const customersRelations = relations(customers, ({ many }) => ({
  phones: many(customerPhones),
  bills: many(bills),
}));

export const customerPhonesRelations = relations(
  customerPhones,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerPhones.customerId],
      references: [customers.id],
    }),
  }),
);

export const booksRelations = relations(books, ({ many }) => ({
  bills: many(bills),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  book: one(books, {
    fields: [bills.bookId],
    references: [books.id],
  }),
  customer: one(customers, {
    fields: [bills.customerId],
    references: [customers.id],
  }),
  measurements: many(billMeasurements),
  payments: many(billPayments),
  images: many(billImages),
}));

export const billPaymentsRelations = relations(billPayments, ({ one }) => ({
  bill: one(bills, {
    fields: [billPayments.billId],
    references: [bills.id],
  }),
}));

export const billImagesRelations = relations(billImages, ({ one }) => ({
  bill: one(bills, {
    fields: [billImages.billId],
    references: [bills.id],
  }),
}));

export const billMeasurementsRelations = relations(
  billMeasurements,
  ({ one }) => ({
    bill: one(bills, {
      fields: [billMeasurements.billId],
      references: [bills.id],
    }),
  }),
);
