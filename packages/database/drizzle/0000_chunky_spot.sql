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
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`company_name` text DEFAULT '' NOT NULL,
	`company_address` text DEFAULT '' NOT NULL,
	`company_phone` text DEFAULT '' NOT NULL,
	`company_logo_path` text DEFAULT '' NOT NULL,
	`ticket_prefix` text DEFAULT 'SRW' NOT NULL,
	`ticket_footer` text DEFAULT 'Thank you for your custom' NOT NULL,
	`next_ticket_number` integer DEFAULT 1 NOT NULL,
	`serial_port` text DEFAULT 'COM1' NOT NULL,
	`baud_rate` integer DEFAULT 2400 NOT NULL,
	`data_bits` integer DEFAULT 8 NOT NULL,
	`parity` text DEFAULT 'none' NOT NULL,
	`stop_bits` integer DEFAULT 1 NOT NULL,
	`indicator_type` text DEFAULT 'd300' NOT NULL,
	`weight_unit` text DEFAULT 'kg' NOT NULL,
	`stable_tolerance` real DEFAULT 0.5 NOT NULL,
	`stable_duration_ms` integer DEFAULT 3000 NOT NULL,
	`theme` text DEFAULT 'system' NOT NULL,
	`auto_print` integer DEFAULT false NOT NULL,
	`printer_name` text DEFAULT '' NOT NULL,
	`print_copies` integer DEFAULT 1 NOT NULL,
	`setup_completed` integer DEFAULT false NOT NULL
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