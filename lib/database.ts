import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

// This client has admin privileges and should only be used in server contexts
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey)

// SQL script to create database tables
export const createDatabaseTables = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  gender TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'athlete', 'athletic', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Athletics table
CREATE TABLE IF NOT EXISTS athletics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  university TEXT NOT NULL,
  representative_id UUID REFERENCES users(id) ON DELETE SET NULL,
  pix_code TEXT,
  pix_approved BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Athletes table
CREATE TABLE IF NOT EXISTS athletes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  athletic_id UUID NOT NULL REFERENCES athletics(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  enrollment_document_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Sports table
CREATE TABLE IF NOT EXISTS sports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sport', 'bar_game')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Athlete Sports table (many-to-many)
CREATE TABLE IF NOT EXISTS athlete_sports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(athlete_id, sport_id)
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Game Participants table (many-to-many)
CREATE TABLE IF NOT EXISTS game_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  athletic_id UUID NOT NULL REFERENCES athletics(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(game_id, athletic_id)
);

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'combined' CHECK (category IN ('games', 'party', 'combined')),
  includes_party BOOLEAN NOT NULL DEFAULT false,
  includes_games BOOLEAN NOT NULL DEFAULT false,
  discount_percentage DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Athlete Packages table (many-to-many)
CREATE TABLE IF NOT EXISTS athlete_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'refunded')),
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(athlete_id, package_id)
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  total_quantity INTEGER NOT NULL,
  remaining_quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ticket Purchases table
CREATE TABLE IF NOT EXISTS ticket_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'refunded')),
  payment_date TIMESTAMP WITH TIME ZONE,
  qr_code TEXT NOT NULL,
  athletic_referral_id UUID REFERENCES athletics(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme_preference TEXT NOT NULL DEFAULT 'system',
  notification_email BOOLEAN NOT NULL DEFAULT true,
  notification_push BOOLEAN NOT NULL DEFAULT true,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Create RLS policies
-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for each table
-- Users policies
CREATE POLICY IF NOT EXISTS "Users can view their own data" ON users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own data" ON users
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Allow inserts for authenticated users" ON users
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Admins can view all users" ON users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Athletics policies
CREATE POLICY IF NOT EXISTS "Users can view all athletics" ON athletics
FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Admins can insert athletics" ON athletics
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY IF NOT EXISTS "Admins or representatives can update athletics" ON athletics
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR id = representative_id)
  )
);

-- Athletes policies
CREATE POLICY IF NOT EXISTS "Users can view their own athlete data" ON athletes
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own athlete data" ON athletes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins or representatives can view all athletes in their athletic" ON athletes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u JOIN athletics a ON u.id = a.representative_id
    WHERE u.id = auth.uid() AND a.id = athletic_id
  ) OR
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Sports policies
CREATE POLICY IF NOT EXISTS "Users can view all sports" ON sports
FOR SELECT USING (true);

-- Games policies
CREATE POLICY IF NOT EXISTS "Users can view all games" ON games
FOR SELECT USING (true);

-- Packages policies
CREATE POLICY IF NOT EXISTS "Users can view all packages" ON packages
FOR SELECT USING (true);

-- Tickets policies
CREATE POLICY IF NOT EXISTS "Users can view all tickets" ON tickets
FOR SELECT USING (true);

-- Ticket Purchases policies
CREATE POLICY IF NOT EXISTS "Users can view their own ticket purchases" ON ticket_purchases
FOR SELECT USING (auth.uid() = user_id);

-- User Settings policies
CREATE POLICY IF NOT EXISTS "Users can view their own settings" ON user_settings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own settings" ON user_settings
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own settings" ON user_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);


-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_athletes_modtime
BEFORE UPDATE ON athletes
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_athletics_modtime
BEFORE UPDATE ON athletics
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_sports_modtime
BEFORE UPDATE ON sports
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_games_modtime
BEFORE UPDATE ON games
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_packages_modtime
BEFORE UPDATE ON packages
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_athlete_packages_modtime
BEFORE UPDATE ON athlete_packages
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_tickets_modtime
BEFORE UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_ticket_purchases_modtime
BEFORE UPDATE ON ticket_purchases
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_user_settings_modtime
BEFORE UPDATE ON user_settings
FOR EACH ROW EXECUTE FUNCTION update_modified_column();
`
