-- ============================================================
-- Ecomxstocks Supabase PostgreSQL Database Schema & Seed Data
-- Paste into Supabase > SQL Editor > Click RUN
-- ============================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  code TEXT NOT NULL,
  referral_code TEXT NOT NULL,
  invited_by_code TEXT,
  referred_by_code TEXT,
  referred_by_name TEXT,
  referred_by TEXT,
  avatar TEXT DEFAULT 'U',
  vip_level TEXT DEFAULT 'eBay',
  vip_tier_id TEXT DEFAULT 'tier_ebay',
  balance NUMERIC(14,2) DEFAULT 0.00,
  total_earnings NUMERIC(14,2) DEFAULT 0.00,
  total_deposit NUMERIC(14,2) DEFAULT 0.00,
  total_withdraw NUMERIC(14,2) DEFAULT 0.00,
  pending_requests INT DEFAULT 0,
  team_members_count INT DEFAULT 0,
  referrals INT DEFAULT 0,
  pending_tasks INT DEFAULT 25,
  completed_tasks INT DEFAULT 0,
  daily_quota INT DEFAULT 25,
  daily_completed INT DEFAULT 0,
  team_bonus NUMERIC(14,2) DEFAULT 0.00,
  this_month_earnings NUMERIC(14,2) DEFAULT 0.00,
  deposit_success_rate INT DEFAULT 100,
  withdraw_rate INT DEFAULT 100,
  task_completion_rate INT DEFAULT 0,
  kyc_status TEXT DEFAULT 'Verified',
  wallet_address TEXT DEFAULT 'TNoaH87yqPKmZ7r6Tx98JkL10qV2xR8v1q',
  network TEXT DEFAULT 'TRC20',
  status TEXT DEFAULT 'Active',
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RECORDS TABLE (Financial & Task Ledger)
CREATE TABLE IF NOT EXISTS public.records (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT DEFAULT 'USDT',
  date TEXT NOT NULL,
  status TEXT DEFAULT 'Completed',
  note TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  network TEXT DEFAULT 'TRC20',
  tx_hash TEXT,
  wallet_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Electronics',
  price NUMERIC(10,2) NOT NULL,
  yield_rate TEXT DEFAULT '4.0%',
  yield_amount NUMERIC(10,2) NOT NULL,
  required_deposit NUMERIC(10,2) DEFAULT 0.00,
  badge TEXT DEFAULT 'VIP Level 1',
  orders INT DEFAULT 0,
  rating NUMERIC(3,1) DEFAULT 5.0,
  image_url TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. VIP TIERS TABLE
CREATE TABLE IF NOT EXISTS public.vip_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  color TEXT NOT NULL,
  badge_bg TEXT NOT NULL,
  badge_text TEXT NOT NULL,
  min_balance NUMERIC(10,2) NOT NULL,
  max_balance NUMERIC(10,2) NOT NULL,
  commission_rate INT NOT NULL,
  daily_tasks INT NOT NULL,
  description TEXT
);

-- 5. ACTIVITY STREAM TABLE
CREATE TABLE IF NOT EXISTS public.activity_stream (
  id TEXT PRIMARY KEY,
  flag TEXT NOT NULL,
  name TEXT NOT NULL,
  badge TEXT NOT NULL,
  action TEXT NOT NULL,
  time TEXT NOT NULL,
  amount TEXT NOT NULL,
  is_positive BOOLEAN DEFAULT TRUE,
  type TEXT DEFAULT 'profit',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SUPPORT CHATS TABLE
CREATE TABLE IF NOT EXISTS public.support_chats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  unread_by_admin INT DEFAULT 0,
  unread_by_user INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SUPPORT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.support_messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  sender TEXT NOT NULL,
  agent_name TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.system_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (RLS) POLICIES FOR PUBLIC ACCESS
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_stream ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow full access to anon/authenticated client
DROP POLICY IF EXISTS "Allow public users full access" ON public.users;
CREATE POLICY "Allow public users full access" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public records full access" ON public.records;
CREATE POLICY "Allow public records full access" ON public.records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public tasks full access" ON public.tasks;
CREATE POLICY "Allow public tasks full access" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public vip_tiers full access" ON public.vip_tiers;
CREATE POLICY "Allow public vip_tiers full access" ON public.vip_tiers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public activity_stream full access" ON public.activity_stream;
CREATE POLICY "Allow public activity_stream full access" ON public.activity_stream FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public support_chats full access" ON public.support_chats;
CREATE POLICY "Allow public support_chats full access" ON public.support_chats FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public support_messages full access" ON public.support_messages;
CREATE POLICY "Allow public support_messages full access" ON public.support_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public system_settings full access" ON public.system_settings;
CREATE POLICY "Allow public system_settings full access" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;

-- ============================================================
-- SEED INITIAL DATA
-- ============================================================

-- System Settings
INSERT INTO public.system_settings (setting_key, setting_value) VALUES
('trc20Address', 'TNoaH87yqPKmZ7r6Tx98JkL10qV2xR8v1q'),
('erc20Address', '0x71C94156b53982e0C63810a972c72b04B46bF022'),
('bep20Address', '0x71C94156b53982e0C63810a972c72b04B46bF022'),
('bankName', 'Standard Chartered Global Clearing'),
('bankAccount', 'GB82WEST12345678901234'),
('bankHolder', 'Ecomxstocks Global Escrow Vault Ltd'),
('bankSwift', 'SCBLGB2L'),
('depositInstructions', 'Please include your Account ID as transaction memo. Funds credited after 1 network confirmation.')
ON CONFLICT (setting_key) DO NOTHING;

-- VIP Tiers
INSERT INTO public.vip_tiers (id, name, platform, color, badge_bg, badge_text, min_balance, max_balance, commission_rate, daily_tasks, description) VALUES
('tier_ebay', 'eBay', 'eBay', '#e53238', '#ffebee', '#d32f2f', 0.00, 499.00, 4, 25, 'Review eBay product listings and earn entry-level commissions. Great for getting started.'),
('tier_walmart', 'Walmart', 'Walmart', '#0071dc', '#e3f2fd', '#1565c0', 500.00, 899.00, 8, 40, 'Middle-tier verified promotion tasks with accelerated returns on popular retail products.'),
('tier_temu', 'Temu', 'Temu', '#ff5000', '#fff3e0', '#e65100', 900.00, 99999.00, 12, 50, 'High-volume promotion batches with priority payouts and premium merchant commission yields.')
ON CONFLICT (id) DO NOTHING;

-- Initial Users
INSERT INTO public.users (id, name, email, password, code, referral_code, invited_by_code, referred_by_code, balance, vip_level, vip_tier_id, referrals, pending_tasks, completed_tasks, daily_quota, status, role) VALUES
('usr_admin_0001', 'System Administrator', 'admin@devsynx.com', 'admin123', '888888', '888888', 'SYSTEM', 'SYSTEM', 10000.00, 'Temu', 'tier_temu', 28, 0, 50, 50, 'Active', 'admin'),
('usr_noah_9941', 'Noah', 'targetk474@gmail.com', 'password123', '505282', '505282', '888888', '888888', 0.00, 'eBay', 'tier_ebay', 3, 25, 0, 25, 'Active', 'user'),
('usr_alex_8820', 'Alexander Wright', 'a.wright@devsynx.com', 'password123', '891042', '891042', '888888', '888888', 1420.50, 'Temu', 'tier_temu', 14, 12, 38, 50, 'Active', 'user'),
('usr_sophia_4412', 'Sophia Martinez', 'sophia.m@gmail.com', 'password123', '334190', '334190', '505282', '505282', 680.00, 'Walmart', 'tier_walmart', 5, 16, 24, 40, 'Active', 'user')
ON CONFLICT (id) DO NOTHING;

-- Initial Tasks
INSERT INTO public.tasks (id, platform, title, category, price, yield_rate, yield_amount, required_deposit, badge, orders, rating, image_url) VALUES
('tsk-eb-01', 'eBay', 'Smart Voice Activated RGB LED Desk Lamp', 'Smart Lighting', 45.00, '4.0%', 1.80, 0.00, 'VIP Level 1', 124, 4.9, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80'),
('tsk-eb-02', 'eBay', 'Wireless Fast Charging Magnetic Power Bank 10000mAh', 'Mobile Accessories', 38.50, '4.0%', 1.54, 0.00, 'VIP Level 1', 98, 4.8, 'https://images.unsplash.com/photo-1609592424368-24151759b407?w=600&auto=format&fit=crop&q=80'),
('tsk-eb-03', 'eBay', 'Mini Desktop Air Purifier with HEPA Filter', 'Home & Office', 52.00, '4.0%', 2.08, 0.00, 'VIP Level 1', 187, 5.0, 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=80'),
('tsk-wm-01', 'Walmart', 'Ultra-Slim 4K UHD 60Hz Portable Monitor 15.6 Inch', 'Electronics', 189.99, '8.0%', 15.20, 500.00, 'VIP Level 2', 312, 4.9, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80'),
('tsk-wm-02', 'Walmart', 'Ergonomic Mesh High-Back Office Chair with Lumbar Support', 'Furniture', 249.00, '8.0%', 19.92, 500.00, 'VIP Level 2', 205, 4.8, 'https://images.unsplash.com/photo-1580481077195-c3a8a37f714c?w=600&auto=format&fit=crop&q=80'),
('tsk-tm-01', 'Temu', 'High Precision Drone with 4K HDR Camera & Optical Flow', 'Drones & Tech', 380.00, '12.0%', 45.60, 900.00, 'VIP Level 3', 840, 5.0, 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600&auto=format&fit=crop&q=80'),
('tsk-tm-02', 'Temu', 'Professional Mirrorless Gimbal Stabilizer 3-Axis', 'Photography', 420.00, '12.0%', 50.40, 900.00, 'VIP Level 3', 590, 4.9, 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url;
