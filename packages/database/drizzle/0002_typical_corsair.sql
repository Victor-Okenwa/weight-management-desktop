PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__materials_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP'
);--> statement-breakpoint
INSERT INTO `__materials_new` (`id`, `name`, `created_at`)
SELECT `id`, `name`, `created_at` FROM `materials`;--> statement-breakpoint
DROP TABLE `materials`;--> statement-breakpoint
ALTER TABLE `__materials_new` RENAME TO `materials`;--> statement-breakpoint
CREATE UNIQUE INDEX `materials_name_unique` ON `materials` (`name`);--> statement-breakpoint
CREATE TABLE `__vehicles_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`tare_weight` real,
	`tare_unit` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP'
);--> statement-breakpoint
INSERT INTO `__vehicles_new` (`id`, `name`, `tare_weight`, `tare_unit`, `created_at`)
SELECT `id`, `name`, `tare_weight`, `tare_unit`, `created_at` FROM `vehicles`;--> statement-breakpoint
DROP TABLE `vehicles`;--> statement-breakpoint
ALTER TABLE `__vehicles_new` RENAME TO `vehicles`;--> statement-breakpoint
CREATE UNIQUE INDEX `vehicles_name_unique` ON `vehicles` (`name`);--> statement-breakpoint
CREATE TABLE `__records_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ticket_id` text NOT NULL,
	`operator` text,
	`operation_type` text DEFAULT 'single' NOT NULL,
	`gross_weight` real,
	`tare_weight` real,
	`net_weight` real,
	`status` text DEFAULT 'pending' NOT NULL,
	`vehicle_id` integer,
	`material_id` integer,
	`remark` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
INSERT INTO `__records_new` (
	`id`,
	`ticket_id`,
	`operator`,
	`operation_type`,
	`gross_weight`,
	`tare_weight`,
	`net_weight`,
	`status`,
	`vehicle_id`,
	`material_id`,
	`remark`,
	`created_at`,
	`updated_at`
)
SELECT
	`id`,
	`ticket_id`,
	`operator`,
	`operation_type`,
	`gross_weight`,
	`tare_weight`,
	`net_weight`,
	`status`,
	`vehicle_id`,
	`material_id`,
	`remark`,
	`created_at`,
	`updated_at`
FROM `records`;--> statement-breakpoint
DROP TABLE `records`;--> statement-breakpoint
ALTER TABLE `__records_new` RENAME TO `records`;--> statement-breakpoint
CREATE UNIQUE INDEX `records_ticket_id_unique` ON `records` (`ticket_id`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
