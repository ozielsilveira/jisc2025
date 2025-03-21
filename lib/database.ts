import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
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
  includes_party BOOLEAN NOT NULL DEFAULT false,
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

-- Temporarily disable RLS for initial setup
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Athletics can view their athletes' data" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM athletes 
      JOIN users u ON u.id = auth.uid() 
      WHERE athletes.user_id = users.id 
      AND u.role = 'athletic'
    )
  );

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
`

