create table if not exists users (
  id text primary key,
  auth_provider text not null,
  provider_subject text not null unique,
  email text,
  display_name text,
  avatar_url text,
  role text not null default 'visitor' check (role in ('visitor', 'admin', 'moderator')),
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create table if not exists visitor_profiles (
  id text primary key,
  visitor_key text not null unique,
  user_id text references users(id) on delete set null,
  nickname text not null,
  email text,
  website text,
  status text not null default 'active' check (status in ('active', 'muted', 'blocked')),
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create table if not exists comments (
  id text primary key,
  page_path text not null,
  parent_id text references comments(id) on delete cascade,
  user_id text references users(id) on delete set null,
  visitor_key text,
  author_name text not null,
  author_website text,
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden', 'spam')),
  moderation_reason text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create table if not exists reactions (
  id text primary key,
  target_type text not null check (target_type in ('comment', 'page', 'reward')),
  target_id text not null,
  reaction_type text not null,
  user_id text references users(id) on delete set null,
  visitor_key text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  unique(target_type, target_id, reaction_type, user_id, visitor_key)
);

create table if not exists rewards (
  id text primary key,
  user_id text references users(id) on delete set null,
  visitor_key text,
  display_name text not null,
  message text,
  amount numeric,
  currency text not null default 'CNY',
  provider text not null default 'manual_qr',
  provider_order_id text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'verified', 'hidden', 'failed')),
  verified_at text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create table if not exists page_views (
  id text primary key,
  page_path text not null,
  session_id text not null,
  user_id text references users(id) on delete set null,
  visitor_key text,
  referrer text,
  user_agent text,
  ip_hash text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create table if not exists daily_stats (
  stat_date text not null,
  page_path text not null,
  pv integer not null default 0,
  uv integer not null default 0,
  comments_count integer not null default 0,
  rewards_count integer not null default 0,
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  primary key (stat_date, page_path)
);

create table if not exists page_stats (
  page_path text primary key,
  pv integer not null default 0,
  uv integer not null default 0,
  comments_count integer not null default 0,
  rewards_count integer not null default 0,
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create table if not exists admin_events (
  id text primary key,
  actor_user_id text,
  actor_email text,
  target_type text not null,
  target_id text not null,
  action text not null,
  reason text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create index if not exists idx_comments_page_status on comments(page_path, status, created_at desc);
create index if not exists idx_comments_parent on comments(parent_id);
create index if not exists idx_rewards_status on rewards(status, created_at desc);
create index if not exists idx_page_views_page_created on page_views(page_path, created_at desc);
create index if not exists idx_daily_stats_date on daily_stats(stat_date desc);
