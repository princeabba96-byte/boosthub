-- BoostHub Real Supabase Schema & Views Counter

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique,
  display_name text,
  avatar_url text,
  xp int default 0,
  bp text default 'Unlimited BP',
  followers_count int default 0,
  following_count int default 0,
  friends_count int default 0,
  likes_count int default 0,
  shares_count int default 0,
  views_count int default 0,
  is_admin bool default false,
  verified bool default false,
  created_at timestamp default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  content text,
  hashtags text[],
  video_url text,
  likes int default 0,
  comments_count int default 0,
  shares int default 0,
  views int default 0,
  created_at timestamp default now()
);

create table if not exists post_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references users(id),
  created_at timestamp default now(),
  unique(post_id, user_id)
);

create or replace function increment_view(post_id_input uuid) returns void as $$
  update posts set views = views + 1 where id = post_id_input;
$$ language sql;

create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  media_url text,
  caption text,
  expires_at timestamp default now() + interval '24 hours',
  views int default 0,
  created_at timestamp default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references users(id),
  content text,
  created_at timestamp default now()
);

create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references users(id),
  created_at timestamp default now(),
  unique(post_id, user_id)
);

create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references users(id),
  following_id uuid references users(id),
  created_at timestamp default now()
);

alter publication supabase_realtime add table posts, post_views, users, stories, comments, likes;
