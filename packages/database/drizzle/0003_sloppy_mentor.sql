CREATE TABLE `installation` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`setup_completed` integer DEFAULT false NOT NULL,
	`machine_id` text DEFAULT '' NOT NULL,
	`license_machine_id` text,
	`license_issued_at` text,
	`license_expires_at` text,
	`license_signature` text,
	`license_json` text,
	`activated_at` text
);
--> statement-breakpoint
ALTER TABLE `settings` DROP COLUMN `setup_completed`;