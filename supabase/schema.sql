-- Roommate Finder — initial schema
-- Paste into the Supabase SQL Editor (Project > SQL Editor > New query) and run once.
-- Mirrors docs/PLAN.md §4. All tables use RLS; policies live at the bottom.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create type occupation_t as enum ('student', 'working', 'both', 'other');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  birthdate date not null,
  pronouns text,
  bio text check (char_length(bio) <= 300),
  photos text[] not null default '{}',
  occupation occupation_t not null default 'other',
  school_or_employer text,
  verified_email boolean not null default false,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- lifestyle (1:1 with profiles)
-- ---------------------------------------------------------------------------
create type smoking_t as enum ('none', 'outdoor_ok', 'indoor');
create type cannabis_t as enum ('none', 'outdoor_ok', 'indoor');
create type drinking_t as enum ('none', 'social', 'frequent');
create type pets_owned_t as enum ('none', 'cat', 'dog', 'other');
create type pets_ok_with_t as enum ('any', 'cats_only', 'dogs_only', 'none', 'allergic');
create type kitchen_sharing_t as enum ('share_everything', 'share_space_not_food', 'separate');

create table lifestyle (
  profile_id uuid primary key references profiles(id) on delete cascade,
  sleep_schedule smallint not null check (sleep_schedule between 1 and 5),
  cleanliness smallint not null check (cleanliness between 1 and 5),
  noise_tolerance smallint not null check (noise_tolerance between 1 and 5),
  guest_frequency smallint not null check (guest_frequency between 1 and 5),
  sociability smallint not null check (sociability between 1 and 5),
  wfh_days smallint not null check (wfh_days between 0 and 7),
  smoking smoking_t not null default 'none',
  cannabis cannabis_t not null default 'none',
  drinking drinking_t not null default 'none',
  pets_owned pets_owned_t not null default 'none',
  pets_ok_with pets_ok_with_t not null default 'any',
  kitchen_sharing kitchen_sharing_t not null default 'share_space_not_food',
  dealbreakers text[] not null default '{}'
);

-- ---------------------------------------------------------------------------
-- housing_intent (1:1 with profiles)
-- ---------------------------------------------------------------------------
create type housing_role_t as enum ('has_place', 'needs_place', 'forming_group');

create table housing_intent (
  profile_id uuid primary key references profiles(id) on delete cascade,
  role housing_role_t not null,
  budget_min integer not null,
  budget_max integer not null check (budget_max >= budget_min),
  move_in_earliest date not null,
  move_in_latest date not null check (move_in_latest >= move_in_earliest),
  lease_months smallint,
  city text not null,
  neighbourhoods text[] not null default '{}',
  anchor_lat double precision,
  anchor_lng double precision,
  max_commute_minutes smallint
);

-- ---------------------------------------------------------------------------
-- listings
-- ---------------------------------------------------------------------------
create type room_type_t as enum ('private', 'shared', 'entire_unit');
create type property_type_t as enum ('apartment', 'house', 'condo', 'basement', 'studio');
create type listing_status_t as enum ('active', 'paused', 'filled');

create table listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  rent_monthly integer not null,
  utilities_included boolean not null default false,
  deposit integer,
  room_type room_type_t not null,
  property_type property_type_t not null,
  furnished boolean not null default false,
  sqft integer,
  bedrooms_total smallint,
  bathrooms smallint,
  current_occupants smallint not null default 0,
  available_from date not null,
  lease_months smallint,
  amenities text[] not null default '{}',
  photos text[] not null default '{}',
  lat double precision,
  lng double precision,
  address_exact text, -- private: only revealed to matched users, see policy below
  neighbourhood text,
  status listing_status_t not null default 'active',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- swipes
-- ---------------------------------------------------------------------------
create type target_type_t as enum ('profile', 'listing');
create type swipe_direction_t as enum ('like', 'pass');

create table swipes (
  id uuid primary key default gen_random_uuid(),
  swiper_id uuid not null references profiles(id) on delete cascade,
  target_type target_type_t not null,
  target_id uuid not null,
  direction swipe_direction_t not null,
  created_at timestamptz not null default now(),
  unique (swiper_id, target_type, target_id)
);

-- ---------------------------------------------------------------------------
-- matches
-- ---------------------------------------------------------------------------
create type match_status_t as enum ('active', 'expired', 'unmatched');

create table matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles(id) on delete cascade,
  user_b uuid not null references profiles(id) on delete cascade,
  listing_id uuid references listings(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  status match_status_t not null default 'active',
  constraint user_a_lt_user_b check (user_a < user_b),
  unique (user_a, user_b)
);

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
create table messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- ---------------------------------------------------------------------------
-- reports / blocks
-- ---------------------------------------------------------------------------
create type report_reason_t as enum ('spam', 'harassment', 'fake_profile', 'safety', 'other');
create type report_status_t as enum ('open', 'reviewed', 'dismissed');

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_id uuid not null references profiles(id) on delete cascade,
  reason report_reason_t not null,
  details text,
  created_at timestamptz not null default now(),
  status report_status_t not null default 'open'
);

create table blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table lifestyle enable row level security;
alter table housing_intent enable row level security;
alter table listings enable row level security;
alter table swipes enable row level security;
alter table matches enable row level security;
alter table messages enable row level security;
alter table reports enable row level security;
alter table blocks enable row level security;

-- profiles: anyone signed in can browse the deck; you can only write your own row.
create policy "profiles are readable by any signed-in user" on profiles
  for select using (auth.uid() is not null);
create policy "profiles are writable by their owner" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles are updatable by their owner" on profiles
  for update using (auth.uid() = id);

-- lifestyle / housing_intent: same shape — readable for matching, owner-writable.
create policy "lifestyle is readable by any signed-in user" on lifestyle
  for select using (auth.uid() is not null);
create policy "lifestyle is writable by its owner" on lifestyle
  for insert with check (auth.uid() = profile_id);
create policy "lifestyle is updatable by its owner" on lifestyle
  for update using (auth.uid() = profile_id);

create policy "housing_intent is readable by any signed-in user" on housing_intent
  for select using (auth.uid() is not null);
create policy "housing_intent is writable by its owner" on housing_intent
  for insert with check (auth.uid() = profile_id);
create policy "housing_intent is updatable by its owner" on housing_intent
  for update using (auth.uid() = profile_id);

-- listings: public columns readable by anyone signed in; address_exact is
-- filtered out at the query layer (src/lib/api) for non-matched users rather
-- than here, since column-level RLS needs a security-definer view — cheaper
-- to just not select that column until a match exists.
create policy "listings are readable by any signed-in user" on listings
  for select using (auth.uid() is not null);
create policy "listings are writable by their owner" on listings
  for insert with check (auth.uid() = owner_id);
create policy "listings are updatable by their owner" on listings
  for update using (auth.uid() = owner_id);

-- swipes: you can only see and create your own.
create policy "swipes are readable by their swiper" on swipes
  for select using (auth.uid() = swiper_id);
create policy "swipes are writable by their swiper" on swipes
  for insert with check (auth.uid() = swiper_id);

-- matches: readable/writable only by the two participants.
create policy "matches are readable by participants" on matches
  for select using (auth.uid() = user_a or auth.uid() = user_b);
create policy "matches are updatable by participants" on matches
  for update using (auth.uid() = user_a or auth.uid() = user_b);
-- inserts happen via a security-definer function (mutual-like detection),
-- not directly from the client — no insert policy needed for normal users.

-- messages: readable/writable only by someone in the parent match.
create policy "messages are readable by match participants" on messages
  for select using (
    exists (
      select 1 from matches
      where matches.id = messages.match_id
        and (matches.user_a = auth.uid() or matches.user_b = auth.uid())
    )
  );
create policy "messages are insertable by match participants" on messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from matches
      where matches.id = messages.match_id
        and (matches.user_a = auth.uid() or matches.user_b = auth.uid())
        and matches.status = 'active'
    )
  );

-- reports / blocks: write your own, read your own.
create policy "reports are insertable by the reporter" on reports
  for insert with check (auth.uid() = reporter_id);
create policy "reports are readable by the reporter" on reports
  for select using (auth.uid() = reporter_id);

create policy "blocks are manageable by the blocker" on blocks
  for all using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);
