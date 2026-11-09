-- Academia RPG · Personagem: nome de aventureiro e classe
-- Como usar: Supabase > SQL Editor > New query > cole tudo > Run. Pode ser executado mais de uma vez.
-- Rode DEPOIS do supabase-xp.sql. Não mexe em XP, quizzes, study_files nem no bucket.

-- 1) Duas colunas novas na tabela de perfis.
--    adventurer_name = nome público do personagem (separado do nome real da conta Google, que continua privado).
--    class = classe escolhida (só visual, não dá vantagem de XP).
alter table public.player_profiles
  add column if not exists adventurer_name text,
  add column if not exists class text;

alter table public.player_profiles drop constraint if exists player_profiles_class_check;
alter table public.player_profiles
  add constraint player_profiles_class_check
  check (class is null or class in ('guerreiro', 'mago', 'arqueiro', 'assassino'));

-- 2) Função que salva o personagem. O navegador não escreve direto na tabela: ela valida tudo aqui.
create or replace function public.set_character(p_name text, p_class text)
returns void language plpgsql security definer set search_path = public as $$
declare v_name text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  if v_name !~ '^[[:alnum:] _-]{3,20}$' then raise exception 'Nome inválido'; end if;
  if coalesce(p_class, '') not in ('guerreiro', 'mago', 'arqueiro', 'assassino') then raise exception 'Classe inválida'; end if;
  insert into player_profiles (user_id) values (auth.uid()) on conflict do nothing;
  update player_profiles set adventurer_name = v_name, class = p_class where user_id = auth.uid();
end $$;

revoke all on function public.set_character(text, text) from public, anon;
grant execute on function public.set_character(text, text) to authenticated;
