-- ============================================================
-- Ecomxstocks cPanel MySQL Database Schema & Seed Data
-- Import this SQL file directly via cPanel phpMyAdmin
-- ============================================================

-- 1. USERS TABLE
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `code` VARCHAR(20) NOT NULL,
  `referral_code` VARCHAR(20) NOT NULL,
  `invited_by_code` VARCHAR(20) DEFAULT NULL,
  `referred_by_code` VARCHAR(20) DEFAULT NULL,
  `referred_by_name` VARCHAR(120) DEFAULT NULL,
  `referred_by` VARCHAR(64) DEFAULT NULL,
  `avatar` VARCHAR(10) DEFAULT 'U',
  `vip_level` VARCHAR(50) DEFAULT 'eBay',
  `vip_tier_id` VARCHAR(50) DEFAULT 'tier_ebay',
  `balance` DECIMAL(14,2) DEFAULT 0.00,
  `total_earnings` DECIMAL(14,2) DEFAULT 0.00,
  `total_deposit` DECIMAL(14,2) DEFAULT 0.00,
  `total_withdraw` DECIMAL(14,2) DEFAULT 0.00,
  `pending_requests` INT DEFAULT 0,
  `team_members_count` INT DEFAULT 0,
  `referrals` INT DEFAULT 0,
  `pending_tasks` INT DEFAULT 25,
  `completed_tasks` INT DEFAULT 0,
  `daily_quota` INT DEFAULT 25,
  `daily_completed` INT DEFAULT 0,
  `team_bonus` DECIMAL(14,2) DEFAULT 0.00,
  `this_month_earnings` DECIMAL(14,2) DEFAULT 0.00,
  `deposit_success_rate` INT DEFAULT 100,
  `withdraw_rate` INT DEFAULT 100,
  `task_completion_rate` INT DEFAULT 0,
  `kyc_status` VARCHAR(50) DEFAULT 'Verified',
  `wallet_address` VARCHAR(100) DEFAULT 'TNoaH87yqPKmZ7r6Tx98JkL10qV2xR8v1q',
  `network` VARCHAR(20) DEFAULT 'TRC20',
  `status` VARCHAR(20) DEFAULT 'Active',
  `role` VARCHAR(20) DEFAULT 'user',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_code` (`referral_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. FINANCIAL & TASK TRANSACTIONS LEDGER (RECORDS)
DROP TABLE IF EXISTS `records`;
CREATE TABLE `records` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `type` VARCHAR(80) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `currency` VARCHAR(10) DEFAULT 'USDT',
  `date` VARCHAR(50) NOT NULL,
  `status` VARCHAR(30) DEFAULT 'Completed',
  `note` TEXT DEFAULT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `user_name` VARCHAR(120) NOT NULL,
  `network` VARCHAR(30) DEFAULT 'TRC20',
  `tx_hash` VARCHAR(120) DEFAULT NULL,
  `wallet_address` VARCHAR(120) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. ACTIVE MERCHANT & PROMOTIONAL TASKS
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id` VARCHAR(64) NOT NULL,
  `platform` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) DEFAULT 'Electronics',
  `price` DECIMAL(10,2) NOT NULL,
  `yield_rate` VARCHAR(20) DEFAULT '4.0%',
  `yield_amount` DECIMAL(10,2) NOT NULL,
  `required_deposit` DECIMAL(10,2) DEFAULT 0.00,
  `badge` VARCHAR(50) DEFAULT 'VIP Level 1',
  `orders` INT DEFAULT 0,
  `rating` DECIMAL(3,1) DEFAULT 5.0,
  `image_url` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(20) DEFAULT 'Active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_platform` (`platform`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. VIP TIERS CONFIGURATION
DROP TABLE IF EXISTS `vip_tiers`;
CREATE TABLE `vip_tiers` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `platform` VARCHAR(50) NOT NULL,
  `color` VARCHAR(20) NOT NULL,
  `badge_bg` VARCHAR(20) NOT NULL,
  `badge_text` VARCHAR(20) NOT NULL,
  `min_balance` DECIMAL(10,2) NOT NULL,
  `max_balance` DECIMAL(10,2) NOT NULL,
  `commission_rate` INT NOT NULL,
  `daily_tasks` INT NOT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. LIVE ACTIVITY FEED
DROP TABLE IF EXISTS `activity_stream`;
CREATE TABLE `activity_stream` (
  `id` VARCHAR(64) NOT NULL,
  `flag` VARCHAR(10) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `badge` VARCHAR(50) NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `time` VARCHAR(50) NOT NULL,
  `amount` VARCHAR(50) NOT NULL,
  `is_positive` TINYINT(1) DEFAULT 1,
  `type` VARCHAR(50) DEFAULT 'profit',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. SUPPORT CONVERSATIONS
DROP TABLE IF EXISTS `support_chats`;
CREATE TABLE `support_chats` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `user_name` VARCHAR(120) NOT NULL,
  `user_email` VARCHAR(191) NOT NULL,
  `status` VARCHAR(20) DEFAULT 'open',
  `unread_by_admin` INT DEFAULT 0,
  `unread_by_user` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. SUPPORT MESSAGES
DROP TABLE IF EXISTS `support_messages`;
CREATE TABLE `support_messages` (
  `id` VARCHAR(64) NOT NULL,
  `chat_id` VARCHAR(64) NOT NULL,
  `sender` VARCHAR(20) NOT NULL,
  `agent_name` VARCHAR(100) DEFAULT NULL,
  `text` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_id` (`chat_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. SYSTEM GATEWAY & DEPOSIT CONFIGURATION
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- INITIAL SEED DATA
-- ============================================================

-- Seed System Settings
INSERT INTO `system_settings` (`setting_key`, `setting_value`) VALUES
('trc20Address', 'TNoaH87yqPKmZ7r6Tx98JkL10qV2xR8v1q'),
('erc20Address', '0x71C94156b53982e0C63810a972c72b04B46bF022'),
('bep20Address', '0x71C94156b53982e0C63810a972c72b04B46bF022'),
('bankName', 'Standard Chartered Global Clearing'),
('bankAccount', 'GB82WEST12345678901234'),
('bankHolder', 'Ecomxstocks Global Escrow Vault Ltd'),
('bankSwift', 'SCBLGB2L'),
('depositInstructions', 'Please include your Account ID as transaction memo. Funds credited after 1 network confirmation.');

-- Seed VIP Tiers
INSERT INTO `vip_tiers` (`id`, `name`, `platform`, `color`, `badge_bg`, `badge_text`, `min_balance`, `max_balance`, `commission_rate`, `daily_tasks`, `description`) VALUES
('tier_ebay', 'eBay', 'eBay', '#e53238', '#ffebee', '#d32f2f', 0.00, 499.00, 4, 25, 'Review eBay product listings and earn entry-level commissions. Great for getting started.'),
('tier_walmart', 'Walmart', 'Walmart', '#0071dc', '#e3f2fd', '#1565c0', 500.00, 899.00, 8, 40, 'Middle-tier verified promotion tasks with accelerated returns on popular retail products.'),
('tier_temu', 'Temu', 'Temu', '#ff5000', '#fff3e0', '#e65100', 900.00, 99999.00, 12, 50, 'High-volume promotion batches with priority payouts and premium merchant commission yields.');

-- Seed Initial System Administrator
INSERT INTO `users` (`id`, `name`, `email`, `password`, `code`, `referral_code`, `invited_by_code`, `referred_by_code`, `balance`, `vip_level`, `vip_tier_id`, `referrals`, `pending_tasks`, `completed_tasks`, `daily_quota`, `status`, `role`) VALUES
('usr_admin_0001', 'System Administrator', 'admin@devsynx.com', 'admin123', '888888', '888888', 'SYSTEM', 'SYSTEM', 10000.00, 'Temu', 'tier_temu', 28, 0, 50, 50, 'Active', 'admin');

-- Seed Standard Users
INSERT INTO `users` (`id`, `name`, `email`, `password`, `code`, `referral_code`, `invited_by_code`, `referred_by_code`, `referred_by_name`, `balance`, `vip_level`, `vip_tier_id`, `referrals`, `pending_tasks`, `completed_tasks`, `daily_quota`, `status`, `role`) VALUES
('usr_noah_9941', 'Noah', 'targetk474@gmail.com', 'password123', '505282', '505282', '888888', '888888', 'System Administrator', 0.00, 'eBay', 'tier_ebay', 3, 25, 0, 25, 'Active', 'user'),
('usr_alex_8820', 'Alexander Wright', 'a.wright@devsynx.com', 'password123', '891042', '891042', '888888', '888888', 'System Administrator', 1420.50, 'Temu', 'tier_temu', 14, 12, 38, 50, 'Active', 'user'),
('usr_sophia_4412', 'Sophia Martinez', 'sophia.m@gmail.com', 'password123', '334190', '334190', '505282', '505282', 'Noah', 680.00, 'Walmart', 'tier_walmart', 5, 16, 24, 40, 'Active', 'user');

-- Seed Tasks
INSERT INTO `tasks` (`id`, `platform`, `title`, `category`, `price`, `yield_rate`, `yield_amount`, `required_deposit`, `badge`, `orders`, `rating`, `image_url`) VALUES
('tsk-eb-01', 'eBay', 'Smart Voice Activated RGB LED Desk Lamp', 'Smart Lighting', 45.00, '4.0%', 1.80, 0.00, 'VIP Level 1', 124, 4.9, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80'),
('tsk-eb-02', 'eBay', 'Wireless Fast Charging Magnetic Power Bank 10000mAh', 'Mobile Accessories', 38.50, '4.0%', 1.54, 0.00, 'VIP Level 1', 98, 4.8, 'https://images.unsplash.com/photo-1609592424368-24151759b407?w=600&auto=format&fit=crop&q=80'),
('tsk-eb-03', 'eBay', 'Mini Desktop Air Purifier with HEPA Filter', 'Home & Office', 52.00, '4.0%', 2.08, 0.00, 'VIP Level 1', 187, 5.0, 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=80'),
('tsk-wm-01', 'Walmart', 'Ultra-Slim 4K UHD 60Hz Portable Monitor 15.6 Inch', 'Electronics', 189.99, '8.0%', 15.20, 500.00, 'VIP Level 2', 312, 4.9, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80'),
('tsk-wm-02', 'Walmart', 'Ergonomic Mesh High-Back Office Chair with Lumbar Support', 'Furniture', 249.00, '8.0%', 19.92, 500.00, 'VIP Level 2', 205, 4.8, 'https://images.unsplash.com/photo-1580481077195-c3a8a37f714c?w=600&auto=format&fit=crop&q=80'),
('tsk-tm-01', 'Temu', 'High Precision Drone with 4K HDR Camera & Optical Flow', 'Drones & Tech', 380.00, '12.0%', 45.60, 900.00, 'VIP Level 3', 840, 5.0, 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600&auto=format&fit=crop&q=80'),
('tsk-tm-02', 'Temu', 'Professional Mirrorless Gimbal Stabilizer 3-Axis', 'Photography', 420.00, '12.0%', 50.40, 900.00, 'VIP Level 3', 590, 4.9, 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80')
ON DUPLICATE KEY UPDATE `image_url` = VALUES(`image_url`);
