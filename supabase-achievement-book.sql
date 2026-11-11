-- Academia RPG · Livro de Conquistas
-- Reexecutável: preserva conquistas já liberadas e não duplica recompensas.
begin;

insert into public.achievements(id) values
  ('quiz-10'),('quiz-50'),('quiz-100'),('streak-10'),('precision-90'),('simulado-5'),
  ('nivel10'),('nivel20'),('xp2500'),('xp10000'),('dedicado-7'),('dedicado-30'),
  ('historia-primeira'),('historia-5'),('historia-completa'),
  ('chefe-primeiro'),('chefe-trinca'),('chefe-10'),('moedas-5000'),
  ('colecao-inicial'),('colecao-10'),('item-lendario'),('guilda')
on conflict(id) do nothing;

create or replace function public._grant_eligible_achievements(p_uid uuid)
returns text[]
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_new text[] := array[]::text[];
  v_id text;
  v_quizzes integer := 0;
  v_best_streak integer := 0;
  v_perfect integer := 0;
  v_precision90 integer := 0;
  v_categories integer := 0;
  v_simulados integer := 0;
  v_xp integer := 0;
  v_level integer := 1;
  v_days integer := 0;
  v_story_wins integer := 0;
  v_story_total integer := 0;
  v_story_stage integer := 1;
  v_story_complete boolean := false;
  v_boss_wins integer := 0;
  v_boss_unique integer := 0;
  v_coins bigint := 0;
  v_cosmetics integer := 0;
  v_legendary integer := 0;
  v_guild boolean := false;
begin
  if p_uid is null then return v_new; end if;
  if auth.uid() is not null and auth.uid() <> p_uid then
    raise exception 'Você não pode verificar conquistas de outra conta.';
  end if;

  select count(*)::integer,
         coalesce(max(best_streak),0)::integer,
         count(*) filter (where total > 0 and correct = total)::integer,
         count(*) filter (where total > 0 and correct::numeric / total >= 0.90)::integer,
         count(distinct category) filter (where category in ('programacao','banco','modelagem','geral'))::integer,
         count(*) filter (where category = 'simulado')::integer
    into v_quizzes,v_best_streak,v_perfect,v_precision90,v_categories,v_simulados
  from public.quiz_attempts where user_id=p_uid;

  select coalesce(total_xp,0) into v_xp
  from public.player_profiles where user_id=p_uid;
  v_xp := coalesce(v_xp,0);
  while v_xp >= 50 * v_level * (v_level + 1) loop
    v_level := v_level + 1;
  end loop;

  select count(distinct (created_at at time zone 'America/Sao_Paulo')::date)::integer
    into v_days
  from public.xp_events where user_id=p_uid and source='daily';

  select count(*) filter (where won)::integer into v_story_wins
  from public.story_battle_attempts where user_id=p_uid;
  select coalesce(max(stage_order),0)::integer into v_story_total
  from public.story_encounters;
  select coalesce(max(current_stage),1)::integer into v_story_stage
  from public.story_progress where user_id=p_uid;
  v_story_complete := v_story_total > 0 and v_story_stage > v_story_total;

  select count(*) filter (where won)::integer,
         count(distinct boss_id) filter (where won)::integer
    into v_boss_wins,v_boss_unique
  from public.boss_battle_attempts where user_id=p_uid;

  select coalesce(sum(amount) filter (where amount > 0),0)
    into v_coins
  from public.coin_transactions where user_id=p_uid;

  select (select count(*) from public.user_avatar_items where user_id=p_uid)
       + (select count(*) from public.user_cosmetics where user_id=p_uid)
    into v_cosmetics;

  select (select count(*) from public.user_avatar_items u
          join public.avatar_items i on i.id=u.item_id
          where u.user_id=p_uid and i.rarity='Lendário')
       + (select count(*) from public.user_cosmetics u
          join public.market_items i on i.id=u.item_id
          where u.user_id=p_uid and i.rarity='Lendário')
    into v_legendary;

  select exists(select 1 from public.guild_members where user_id=p_uid)
      or exists(select 1 from public.guilds where owner_id=p_uid and active=true)
    into v_guild;

  for v_id in
    select x.id from (values
      ('primeiro', v_quizzes >= 1),
      ('sequencia', v_best_streak >= 5),
      ('gabarito', v_perfect >= 1),
      ('explorador', v_categories >= 4),
      ('simulado', v_simulados >= 1),
      ('nivel5', v_xp >= 1000),
      ('dedicado', v_days >= 3),
      ('colecionador', v_xp >= 500),
      ('quiz-10', v_quizzes >= 10),
      ('quiz-50', v_quizzes >= 50),
      ('quiz-100', v_quizzes >= 100),
      ('streak-10', v_best_streak >= 10),
      ('precision-90', v_precision90 >= 1),
      ('simulado-5', v_simulados >= 5),
      ('nivel10', v_xp >= 4500),
      ('nivel20', v_xp >= 19000),
      ('xp2500', v_xp >= 2500),
      ('xp10000', v_xp >= 10000),
      ('dedicado-7', v_days >= 7),
      ('dedicado-30', v_days >= 30),
      ('historia-primeira', v_story_wins >= 1),
      ('historia-5', v_story_wins >= 5),
      ('historia-completa', v_story_complete),
      ('chefe-primeiro', v_boss_wins >= 1),
      ('chefe-trinca', v_boss_unique >= 3),
      ('chefe-10', v_boss_wins >= 10),
      ('moedas-5000', v_coins >= 5000),
      ('colecao-inicial', v_cosmetics >= 1),
      ('colecao-10', v_cosmetics >= 10),
      ('item-lendario', v_legendary >= 1),
      ('guilda', v_guild)
    ) as x(id,eligible)
    where x.eligible
  loop
    insert into public.user_achievements(user_id,achievement_id)
    values(p_uid,v_id) on conflict(user_id,achievement_id) do nothing;
    if found then v_new := array_append(v_new,v_id); end if;
  end loop;
  return v_new;
end
$function$;

create or replace function public.get_achievement_book()
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uid uuid := auth.uid();
  v_new text[] := array[]::text[];
  v_xp integer := 0;
  v_level integer := 1;
  v_stats jsonb;
  v_unlocked jsonb;
begin
  if v_uid is null then raise exception 'Entre com sua conta para consultar o Livro de Conquistas.'; end if;
  v_new := public._grant_eligible_achievements(v_uid);

  select coalesce(total_xp,0) into v_xp
  from public.player_profiles where user_id=v_uid;
  v_xp := coalesce(v_xp,0);
  while v_xp >= 50 * v_level * (v_level + 1) loop
    v_level := v_level + 1;
  end loop;

  with quiz as (
    select count(*)::integer as quizzes,
      coalesce(max(best_streak),0)::integer as best_streak,
      count(*) filter(where total>0 and correct=total)::integer as perfect,
      count(*) filter(where total>0 and correct::numeric/total>=0.90)::integer as precision90,
      count(*) filter(where category='simulado')::integer as simulados,
      count(distinct category) filter(where category in ('programacao','banco','modelagem','geral'))::integer as categories
    from public.quiz_attempts where user_id=v_uid
  ),
  daily as (
    select count(distinct (created_at at time zone 'America/Sao_Paulo')::date)::integer as days
    from public.xp_events where user_id=v_uid and source='daily'
  ),
  story as (
    select count(*) filter(where won)::integer as wins
    from public.story_battle_attempts where user_id=v_uid
  ),
  boss as (
    select count(*) filter(where won)::integer as wins,
      count(distinct boss_id) filter(where won)::integer as unique_wins
    from public.boss_battle_attempts where user_id=v_uid
  ),
  owned as (
    select
      (select count(*) from public.user_avatar_items where user_id=v_uid)
      + (select count(*) from public.user_cosmetics where user_id=v_uid) as cosmetics,
      (select count(*) from public.user_avatar_items u join public.avatar_items i on i.id=u.item_id
       where u.user_id=v_uid and i.rarity='Lendário')
      + (select count(*) from public.user_cosmetics u join public.market_items i on i.id=u.item_id
       where u.user_id=v_uid and i.rarity='Lendário') as legendary
  ),
  money as (
    select coalesce(sum(amount) filter(where amount>0),0)::bigint as earned
    from public.coin_transactions where user_id=v_uid
  ),
  guild as (
    select (exists(select 1 from public.guild_members where user_id=v_uid)
      or exists(select 1 from public.guilds where owner_id=v_uid and active=true)) as joined
  ),
  campaign as (
    select coalesce((select max(stage_order) from public.story_encounters),0)::integer as total,
      coalesce((select max(current_stage) from public.story_progress where user_id=v_uid),1)::integer as current
  )
  select jsonb_build_object(
    'quiz_count',quiz.quizzes,'best_streak',quiz.best_streak,'perfect_count',quiz.perfect,
    'precision90_count',quiz.precision90,'category_count',quiz.categories,'simulado_count',quiz.simulados,
    'xp',v_xp,'level',v_level,'active_days',daily.days,
    'story_wins',story.wins,'story_total',campaign.total,
    'story_progress',least(campaign.total,story.wins),
    'story_complete',(campaign.total>0 and campaign.current>campaign.total),
    'boss_wins',boss.wins,'boss_unique',boss.unique_wins,
    'coins_earned',money.earned,'cosmetic_count',owned.cosmetics,'legendary_count',owned.legendary,
    'in_guild',guild.joined
  ) into v_stats
  from quiz,daily,story,boss,owned,money,guild,campaign;

  select coalesce(jsonb_agg(jsonb_build_object('id',ua.achievement_id,'unlocked_at',ua.unlocked_at)
    order by ua.unlocked_at asc),'[]'::jsonb)
  into v_unlocked
  from public.user_achievements ua
  where ua.user_id=v_uid and ua.achievement_id in (
    'primeiro','sequencia','gabarito','explorador','simulado','nivel5','dedicado','colecionador',
    'quiz-10','quiz-50','quiz-100','streak-10','precision-90','simulado-5',
    'nivel10','nivel20','xp2500','xp10000','dedicado-7','dedicado-30',
    'historia-primeira','historia-5','historia-completa',
    'chefe-primeiro','chefe-trinca','chefe-10','moedas-5000',
    'colecao-inicial','colecao-10','item-lendario','guilda'
  );

  return jsonb_build_object('stats',coalesce(v_stats,'{}'::jsonb),
    'unlocked',v_unlocked,'newly_unlocked',to_jsonb(v_new),'total',31);
end
$function$;

revoke all on function public._grant_eligible_achievements(uuid) from public, anon, authenticated;
revoke all on function public.get_achievement_book() from public, anon;
grant execute on function public.get_achievement_book() to authenticated;

commit;
