-- Academia RPG · XP, níveis, conquistas e histórico
-- Como usar: Supabase > SQL Editor > New query > cole tudo > Run. Pode ser executado mais de uma vez.
-- Não mexe na tabela study_files nem no bucket study-files.

-- 1) Tabelas ---------------------------------------------------------------
create table if not exists public.player_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar text not null default '🧙',
  total_xp integer not null default 0 check (total_xp >= 0),
  created_at timestamptz not null default now()
);

-- Valores de XP definidos no servidor: o navegador nunca escolhe quanto XP ganha.
create table if not exists public.xp_rules (
  source text primary key,
  xp integer not null check (xp > 0),
  label text not null
);
insert into public.xp_rules (source, xp, label) values
  ('quiz', 50, 'Completar um quiz'),
  ('streak5', 30, 'Acertar 5 questões seguidas'),
  ('mission', 100, 'Finalizar uma missão'),
  ('simulado', 150, 'Completar um simulado'),
  ('daily', 10, 'Primeiro acesso do dia')
on conflict (source) do update set xp = excluded.xp, label = excluded.label;

-- unique (user_id, event_key) impede ganhar XP duas vezes pela mesma conclusão.
create table if not exists public.xp_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null references public.xp_rules(source),
  event_key text not null,
  xp integer not null,
  description text,
  created_at timestamptz not null default now(),
  unique (user_id, event_key)
);
create index if not exists xp_events_user_idx on public.xp_events (user_id, created_at desc);

create table if not exists public.quiz_attempts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  correct integer not null,
  total integer not null,
  best_streak integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.achievements (id text primary key);
insert into public.achievements (id) values
  ('primeiro'), ('sequencia'), ('gabarito'), ('explorador'),
  ('simulado'), ('nivel5'), ('dedicado'), ('colecionador')
on conflict do nothing;

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.achievements(id),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- 2) Segurança (RLS): o aluno só LÊ os próprios dados; ninguém escreve direto nas tabelas.
do $$
declare t text;
begin
  foreach t in array array['player_profiles', 'xp_events', 'quiz_attempts', 'user_achievements'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "somente_dono_le" on public.%I', t);
    execute format('create policy "somente_dono_le" on public.%I for select to authenticated using (user_id = auth.uid())', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
  end loop;
  foreach t in array array['xp_rules', 'achievements'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "leitura_autenticada" on public.%I', t);
    execute format('create policy "leitura_autenticada" on public.%I for select to authenticated using (true)', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
  end loop;
end $$;

-- 3) Funções (todas as gravações passam por aqui) ----------------------------
-- Interna: concede XP uma única vez por event_key, com limite de 1000 XP por dia.
create or replace function public._grant(p_uid uuid, p_source text, p_key text, p_extra text default null)
returns integer language plpgsql security definer set search_path = public as $$
declare v_xp integer; v_label text; v_today integer;
begin
  select xp, label into v_xp, v_label from xp_rules where source = p_source;
  if v_xp is null then return 0; end if;
  insert into player_profiles (user_id) values (p_uid) on conflict do nothing;
  select coalesce(sum(xp), 0) into v_today from xp_events
   where user_id = p_uid
     and created_at >= (date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo');
  if v_today + v_xp > 1000 then return 0; end if;
  insert into xp_events (user_id, source, event_key, xp, description)
  values (p_uid, p_source, p_key, v_xp, v_label || coalesce(' · ' || p_extra, ''))
  on conflict (user_id, event_key) do nothing;
  if not found then return 0; end if;
  update player_profiles set total_xp = total_xp + v_xp where user_id = p_uid;
  return v_xp;
end $$;

create or replace function public.ensure_profile(p_name text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  insert into player_profiles (user_id, display_name) values (auth.uid(), left(p_name, 80))
  on conflict (user_id) do nothing;
end $$;

create or replace function public.claim_daily()
returns integer language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  return _grant(auth.uid(), 'daily', 'daily:' || to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD'));
end $$;

-- p_attempt é um UUID gerado quando o quiz começa: reenviar o mesmo resultado não gera XP de novo.
create or replace function public.record_quiz(p_attempt uuid, p_category text, p_correct integer, p_total integer, p_streak integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_src text; v_name text; a integer := 0; b integer := 0;
begin
  if uid is null then raise exception 'Não autenticado'; end if;
  if p_attempt is null or p_category not in ('programacao', 'banco', 'modelagem', 'geral', 'simulado')
     or p_total < 1 or p_total > 30 or p_correct < 0 or p_correct > p_total or p_streak < 0 or p_streak > p_correct
  then raise exception 'Dados inválidos'; end if;
  insert into quiz_attempts (id, user_id, category, correct, total, best_streak)
  values (p_attempt, uid, p_category, p_correct, p_total, p_streak) on conflict (id) do nothing;
  if not found then return jsonb_build_object('xp', 0, 'streak_xp', 0, 'duplicate', true); end if;
  v_src := case when p_category = 'simulado' then 'simulado' else 'quiz' end;
  v_name := case p_category when 'programacao' then 'Programação' when 'banco' then 'Banco de Dados'
            when 'modelagem' then 'Modelagem' when 'geral' then 'Conhecimentos gerais' else 'Simulado' end;
  a := _grant(uid, v_src, v_src || ':' || p_attempt, v_name);
  if p_streak >= 5 then b := _grant(uid, 'streak5', 'streak5:' || p_attempt, v_name); end if;
  return jsonb_build_object('xp', a, 'streak_xp', b, 'duplicate', false);
end $$;

-- Para as futuras missões: cada missão (id único) rende XP uma única vez por aluno.
create or replace function public.award_mission(p_mission text)
returns integer language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or coalesce(length(p_mission), 0) not between 1 and 60 then raise exception 'Dados inválidos'; end if;
  return _grant(auth.uid(), 'mission', 'mission:' || p_mission, p_mission);
end $$;

create or replace function public.set_avatar(p_avatar text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or p_avatar is null or char_length(p_avatar) not between 1 and 8 then raise exception 'Dados inválidos'; end if;
  update player_profiles set avatar = p_avatar where user_id = auth.uid();
end $$;

create or replace function public.unlock_achievement(p_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  insert into user_achievements (user_id, achievement_id) values (auth.uid(), p_id) on conflict do nothing;
end $$;

-- 4) Permissões das funções
revoke all on function public._grant(uuid, text, text, text) from public, anon, authenticated;
do $$
declare f text;
begin
  foreach f in array array['ensure_profile(text)', 'claim_daily()', 'record_quiz(uuid,text,integer,integer,integer)',
                           'award_mission(text)', 'set_avatar(text)', 'unlock_achievement(text)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
