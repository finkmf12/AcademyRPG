-- Central de notificações da Academia RPG
-- Cada aventureiro só pode consultar e administrar os próprios avisos.
create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('achievement','level','reward','victory','success','info')),
  title text not null check (char_length(title) between 1 and 140),
  message text not null default '' check (char_length(message) <= 500),
  icon text not null default '📜' check (char_length(icon) <= 16),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists user_notifications_user_created_idx
  on public.user_notifications (user_id, created_at desc);

alter table public.user_notifications enable row level security;

revoke all on table public.user_notifications from anon, authenticated;
grant select, insert, update, delete on table public.user_notifications to authenticated;

drop policy if exists "Users can read their own notifications" on public.user_notifications;
create policy "Users can read their own notifications"
  on public.user_notifications for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own notifications" on public.user_notifications;
create policy "Users can create their own notifications"
  on public.user_notifications for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own notifications" on public.user_notifications;
create policy "Users can update their own notifications"
  on public.user_notifications for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own notifications" on public.user_notifications;
create policy "Users can delete their own notifications"
  on public.user_notifications for delete to authenticated
  using ((select auth.uid()) = user_id);
