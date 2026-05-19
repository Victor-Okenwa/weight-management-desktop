CREATE TABLE `materials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `records` (
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
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `materials_name_unique` ON `materials` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `records_ticket_id_unique` ON `records` (`ticket_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `vehicles_name_unique` ON `vehicles` (`name`);