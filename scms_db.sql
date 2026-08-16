CREATE TABLE `Tbl_User` (
  `user_id` integer PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `mobile_no` varchar(50) UNIQUE,
  `email` varchar(100) UNIQUE,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` timestamp,
  `delete_flag` boolean
);

CREATE TABLE `Tbl_User_Token` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `user_id` integer NOT NULL,
  `token_hash` varchar(500) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `revoked` boolean NOT NULL DEFAULT false,
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `Tbl_User_Role` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `user_id` integer NOT NULL,
  `role` varchar(50) NOT NULL COMMENT 'admin / user'
);

CREATE TABLE `Tbl_Patient` (
  `patient_id` integer PRIMARY KEY AUTO_INCREMENT,
  `user_id` integer NOT NULL COMMENT 'User can create family member patient profile',
  `name` varchar(255) NOT NULL,
  `mobile_no` varchar(50),
  `email` varchar(100),
  `date_of_birth` date,
  `gender` varchar(20),
  `blood_type` varchar(5),
  `address` text,
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` timestamp,
  `delete_flag` boolean
);

CREATE TABLE `Tbl_Appointment` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `appointment_code` varchar(50) UNIQUE NOT NULL,
  `patient_id` integer NOT NULL,
  `datetime` timestamp NOT NULL,
  `status` varchar(50) NOT NULL COMMENT 'pending / confirmed / cancelled / completed',
  `notes` text,
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` timestamp
);

CREATE TABLE `Tbl_Disease` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) UNIQUE NOT NULL,
  `description` varchar(255),
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` timestamp,
  `delete_flag` boolean
);

CREATE TABLE `Tbl_Prescription` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `appointment_id` integer NOT NULL,
  `patient_id` integer NOT NULL,
  `disease_id` integer,
  `weight_kg` double_precision,
  `blood_pressure_systolic` integer,
  `blood_pressure_diastolic` integer,
  `notes` text,
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` timestamp,
  `delete_flag` boolean
);

CREATE TABLE `Tbl_Medicine_Category` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) UNIQUE NOT NULL
);

CREATE TABLE `Tbl_Medicine` (
  `medicine_id` integer PRIMARY KEY AUTO_INCREMENT,
  `category_id` integer,
  `name` varchar(255) NOT NULL,
  `description` text,
  `image_url` varchar(500),
  `image_id` varchar(255),
  `unit_price` decimal(10,2) NOT NULL DEFAULT 0,
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` timestamp,
  `delete_flag` boolean
);

CREATE TABLE `Tbl_Medicine_Batch` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `med_id` integer NOT NULL,
  `batch_no` varchar(100) NOT NULL,
  `quantity` integer NOT NULL DEFAULT 0,
  `expiry_date` date NOT NULL,
  `received_date` date,
  `supplier_name` varchar(255),
  `status` varchar(50) NOT NULL COMMENT 'active / expired / disposed',
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` timestamp,
  `delete_flag` boolean
);

CREATE TABLE `Tbl_Prescription_Item` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `prescription_id` integer NOT NULL,
  `medicine_id` integer NOT NULL,
  `medicine_batch_id` integer,
  `dosage` varchar(100),
  `days` integer NOT NULL,
  `quantity` integer NOT NULL,
  `instruction` text,
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` timestamp,
  `delete_flag` boolean
);

CREATE TABLE `Tbl_Prescription_Item_Schedule` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `prescription_item_id` integer NOT NULL,
  `start_date` date,
  `end_date` date,
  `dose_time` varchar(50) COMMENT 'morning / afternoon / evening / night / bedtime / custom',
  `dose_quantity` decimal(10,2) NOT NULL,
  `dose_unit` varchar(50) COMMENT 'tablet / capsule / ml / drop / puff / injection',
  `meal_timing` varchar(50) COMMENT 'before_meal / after_meal / with_meal / anytime',
  `route` varchar(50) COMMENT 'oral / topical / injection / eye_drop / ear_drop / inhalation',
  `interval_hours` integer COMMENT 'Every X hours',
  `interval_days` integer COMMENT 'Every X days',
  `day_of_week` varchar(20),
  `is_as_needed` boolean DEFAULT false COMMENT 'Take when needed',
  `body_site` varchar(100) COMMENT 'left eye / right ear / skin area',
  `note` text,
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` timestamp,
  `delete_flag` boolean
);

CREATE TABLE `Tbl_Payment` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `appointment_id` integer NOT NULL,
  `prescription_id` integer,
  `amount` decimal(10,2) NOT NULL DEFAULT 0,
  `tax` decimal(10,2) NOT NULL DEFAULT 0,
  `charges` decimal(10,2) NOT NULL DEFAULT 0,
  `payment_method` varchar(50) NOT NULL COMMENT 'cash / online',
  `payment_status` varchar(50) NOT NULL COMMENT 'pending / paid / partial / failed / refunded',
  `payment_screenshot` varchar(500),
  `paid_at` timestamp,
  `updated_at` timestamp
);

CREATE TABLE `Tbl_Permission` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `menu` varchar(100) NOT NULL,
  `action` varchar(100) NOT NULL
);

CREATE TABLE `Tbl_Role_Permission` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `role_id` integer NOT NULL,
  `permission_id` integer NOT NULL
);

CREATE TABLE `Tbl_Notification` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `user_id` integer,
  `title` varchar(255) NOT NULL,
  `description` text,
  `action_route` varchar(255),
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` timestamp,
  `delete_flag` boolean
);

CREATE TABLE `Tbl_Prescription_Template` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `disease_id` integer NOT NULL,
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` timestamp,
  `delete_flag` boolean
);

CREATE TABLE `Tbl_Prescription_Template_Item` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `template_id` integer NOT NULL,
  `medicine_id` integer NOT NULL,
  `dosage` varchar(100),
  `days` integer NOT NULL,
  `quantity` integer NOT NULL,
  `instruction` text,
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
  `delete_flag` boolean
);

CREATE TABLE `Tbl_Follow_Up` (
  `id` integer PRIMARY KEY AUTO_INCREMENT,
  `patient_id` integer NOT NULL,
  `appointment_id` integer,
  `prescription_id` integer,
  `due_at` timestamp NOT NULL,
  `recommendation` text NOT NULL,
  `status` varchar(50) NOT NULL COMMENT 'pending / completed',
  `completed_at` timestamp,
  `created_at` timestamp DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` timestamp,
  `delete_flag` boolean
);

CREATE UNIQUE INDEX `uq_user_role` ON `Tbl_User_Role` (`user_id`, `role`);

CREATE UNIQUE INDEX `uq_med_batch` ON `Tbl_Medicine_Batch` (`med_id`, `batch_no`);

CREATE UNIQUE INDEX `uq_menu_action` ON `Tbl_Permission` (`menu`, `action`);

CREATE UNIQUE INDEX `uq_role_permission` ON `Tbl_Role_Permission` (`role_id`, `permission_id`);

ALTER TABLE `Tbl_User_Token` ADD CONSTRAINT `fk_token_user` FOREIGN KEY (`user_id`) REFERENCES `Tbl_User` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `Tbl_User_Role` ADD CONSTRAINT `fk_role_user` FOREIGN KEY (`user_id`) REFERENCES `Tbl_User` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `Tbl_Patient` ADD CONSTRAINT `fk_patient_user` FOREIGN KEY (`user_id`) REFERENCES `Tbl_User` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `Tbl_Notification` ADD CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `Tbl_User` (`user_id`) ON DELETE CASCADE;

ALTER TABLE `Tbl_Appointment` ADD CONSTRAINT `fk_appointment_patient` FOREIGN KEY (`patient_id`) REFERENCES `Tbl_Patient` (`patient_id`);

ALTER TABLE `Tbl_Prescription` ADD CONSTRAINT `fk_prescription_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `Tbl_Appointment` (`id`);

ALTER TABLE `Tbl_Prescription` ADD CONSTRAINT `fk_prescription_patient` FOREIGN KEY (`patient_id`) REFERENCES `Tbl_Patient` (`patient_id`);

ALTER TABLE `Tbl_Prescription` ADD CONSTRAINT `fk_prescription_disease` FOREIGN KEY (`disease_id`) REFERENCES `Tbl_Disease` (`id`) ON DELETE SET NULL;

ALTER TABLE `Tbl_Prescription_Item` ADD CONSTRAINT `fk_item_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `Tbl_Prescription` (`id`) ON DELETE CASCADE;

ALTER TABLE `Tbl_Prescription_Item` ADD CONSTRAINT `fk_item_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `Tbl_Medicine` (`medicine_id`);

ALTER TABLE `Tbl_Prescription_Item` ADD CONSTRAINT `fk_item_batch` FOREIGN KEY (`medicine_batch_id`) REFERENCES `Tbl_Medicine_Batch` (`id`) ON DELETE SET NULL;

ALTER TABLE `Tbl_Prescription_Item_Schedule` ADD CONSTRAINT `fk_schedule_item` FOREIGN KEY (`prescription_item_id`) REFERENCES `Tbl_Prescription_Item` (`id`) ON DELETE CASCADE;

ALTER TABLE `Tbl_Medicine` ADD CONSTRAINT `fk_medicine_category` FOREIGN KEY (`category_id`) REFERENCES `Tbl_Medicine_Category` (`id`) ON DELETE SET NULL;

ALTER TABLE `Tbl_Medicine_Batch` ADD CONSTRAINT `fk_batch_medicine` FOREIGN KEY (`med_id`) REFERENCES `Tbl_Medicine` (`medicine_id`) ON DELETE CASCADE;

ALTER TABLE `Tbl_Payment` ADD CONSTRAINT `fk_payment_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `Tbl_Appointment` (`id`);

ALTER TABLE `Tbl_Payment` ADD CONSTRAINT `fk_payment_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `Tbl_Prescription` (`id`) ON DELETE SET NULL;

ALTER TABLE `Tbl_Role_Permission` ADD CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `Tbl_User_Role` (`id`) ON DELETE CASCADE;

ALTER TABLE `Tbl_Role_Permission` ADD CONSTRAINT `fk_rp_permission` FOREIGN KEY (`permission_id`) REFERENCES `Tbl_Permission` (`id`) ON DELETE CASCADE;

ALTER TABLE `Tbl_Prescription_Template` ADD CONSTRAINT `fk_template_disease` FOREIGN KEY (`disease_id`) REFERENCES `Tbl_Disease` (`id`);

ALTER TABLE `Tbl_Prescription_Template_Item` ADD CONSTRAINT `fk_template_item_template` FOREIGN KEY (`template_id`) REFERENCES `Tbl_Prescription_Template` (`id`) ON DELETE CASCADE;

ALTER TABLE `Tbl_Prescription_Template_Item` ADD CONSTRAINT `fk_template_item_medicine` FOREIGN KEY (`medicine_id`) REFERENCES `Tbl_Medicine` (`medicine_id`);

ALTER TABLE `Tbl_Follow_Up` ADD CONSTRAINT `fk_follow_up_patient` FOREIGN KEY (`patient_id`) REFERENCES `Tbl_Patient` (`patient_id`);

ALTER TABLE `Tbl_Follow_Up` ADD CONSTRAINT `fk_follow_up_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `Tbl_Appointment` (`id`) ON DELETE SET NULL;

ALTER TABLE `Tbl_Follow_Up` ADD CONSTRAINT `fk_follow_up_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `Tbl_Prescription` (`id`) ON DELETE SET NULL;
