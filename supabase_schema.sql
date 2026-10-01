-- BoostHub Supabase Schema: post_views, increment_view RPC, and Realtime Publication
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

alter publication supabase_realtime add table posts, post_views;
