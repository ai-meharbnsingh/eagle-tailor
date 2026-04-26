CREATE TABLE `audit_log` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`table_name` varchar(50) NOT NULL,
	`record_id` bigint unsigned NOT NULL,
	`action` enum('create','update','delete','restore') NOT NULL,
	`old_data` text,
	`new_data` text,
	`changed_by` bigint unsigned,
	`changed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bill_measurements` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`bill_id` bigint unsigned NOT NULL,
	`garment_type` varchar(100),
	`measurements` text,
	`is_verified` boolean NOT NULL DEFAULT false,
	CONSTRAINT `bill_measurements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bills` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`book_id` bigint unsigned NOT NULL,
	`customer_id` bigint unsigned NOT NULL,
	`folio_number` int NOT NULL,
	`image_url` varchar(500),
	`thumbnail_url` varchar(500),
	`bill_date` date NOT NULL,
	`delivery_date` date,
	`actual_delivery_date` date,
	`total_amount` decimal(12,2) DEFAULT '0',
	`advance_paid` decimal(12,2) DEFAULT '0',
	`balance_due` decimal(12,2) DEFAULT '0',
	`status` enum('pending','cutting','stitching','ready','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`remarks` text,
	`is_deleted` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`created_by` bigint unsigned,
	CONSTRAINT `bills_id` PRIMARY KEY(`id`),
	CONSTRAINT `book_folio_idx` UNIQUE(`book_id`,`folio_number`)
);
--> statement-breakpoint
CREATE TABLE `books` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`start_serial` int NOT NULL,
	`end_serial` int,
	`is_current` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `books_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_phones` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`customer_id` bigint unsigned NOT NULL,
	`phone` varchar(20) NOT NULL,
	`is_primary` boolean NOT NULL DEFAULT false,
	CONSTRAINT `customer_phones_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_phones_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text,
	`notes` text,
	`is_deleted` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`pin_hash` varchar(255) NOT NULL,
	`role` enum('owner','helper') NOT NULL DEFAULT 'helper',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`unionId` varchar(255) NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`avatar` text,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`lastSignInAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_unionId_unique` UNIQUE(`unionId`)
);
--> statement-breakpoint
CREATE INDEX `bill_customer_idx` ON `bills` (`customer_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `bills` (`status`);--> statement-breakpoint
CREATE INDEX `bill_date_idx` ON `bills` (`bill_date`);--> statement-breakpoint
CREATE INDEX `phone_idx` ON `customer_phones` (`phone`);--> statement-breakpoint
CREATE INDEX `customer_phone_idx` ON `customer_phones` (`customer_id`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `customers` (`name`);