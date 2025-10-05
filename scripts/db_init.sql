CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS profiles;
CREATE SCHEMA IF NOT EXISTS toggles;
CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS ledger;
CREATE SCHEMA IF NOT EXISTS consent;
CREATE SCHEMA IF NOT EXISTS legal;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS agents;

-- Enums
DO $$ BEGIN
  CREATE TYPE auth_role AS ENUM ('GODMODE','SUPER_ADMIN','ADMIN_AGENT','ADVISOR','MODERATOR','CREATOR_STANDARD','CREATOR_SOVEREIGN','VERIFIED_USER','GUEST');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Users
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role auth_role NOT NULL DEFAULT 'GUEST',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sessions / devices
CREATE TABLE IF NOT EXISTS auth.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  csrf TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Profiles
CREATE TABLE IF NOT EXISTS profiles.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  nsfw_pref BOOLEAN DEFAULT false,
  sovereign BOOLEAN DEFAULT false
);

-- Feature flags / permissions
CREATE TABLE IF NOT EXISTS toggles.permissions (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, key)
);

-- Paid palettes
CREATE TABLE IF NOT EXISTS content.palettes (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('FREE','PAID')),
  colors JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS content.palette_unlocks (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  palette_key TEXT REFERENCES content.palettes(key) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, palette_key)
);

-- Posts & purchases
CREATE TABLE IF NOT EXISTS content.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  nsfw BOOLEAN DEFAULT false,
  price_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content.post_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES content.posts(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  gross_cents INTEGER NOT NULL,
  platform_cut_cents INTEGER NOT NULL,
  creator_cut_cents INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, buyer_id)
);

-- Ledger
CREATE TABLE IF NOT EXISTS ledger.vault_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('platform_cut','payout','refund','adjustment')),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  ref TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Consent artifacts
CREATE TABLE IF NOT EXISTS consent.consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- 'id','release','selfie'
  sha256 TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Legal / DMCA / 4LE
CREATE TABLE IF NOT EXISTS legal.dmca_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter TEXT,
  target_post UUID REFERENCES content.posts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics.events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  props JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_user ON analytics.events(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_creator ON content.posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_purchases_post ON content.post_purchases(post_id);
