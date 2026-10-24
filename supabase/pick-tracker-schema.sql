-- Pick Tracker — personal per-user pick tracking table
-- Run in Supabase SQL Editor

create table if not exists pick_tracker (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade not null,
  player_name text        not null,
  match       text        not null,
  stat_line   text        not null,
  direction   text        not null check (direction in ('MORE', 'LESS')),
  odds        numeric(6, 2) default null,
  match_date  date        not null,
  result      text        not null default 'pending' check (result in ('pending', 'win', 'loss', 'push')),
  created_at  timestamptz default now() not null
);

create index if not exists pick_tracker_user_id_idx   on pick_tracker(user_id);
create index if not exists pick_tracker_match_date_idx on pick_tracker(match_date desc);

alter table pick_tracker enable row level security;

create policy "users_select_own" on pick_tracker
  for select using (auth.uid() = user_id);

create policy "users_insert_own" on pick_tracker
  for insert with check (auth.uid() = user_id);

create policy "users_update_own" on pick_tracker
  for update using (auth.uid() = user_id);

create policy "users_delete_own" on pick_tracker
  for delete using (auth.uid() = user_id);
