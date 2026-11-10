-- Academy RPG · Ateliê Arcano
-- Avatares em camadas, itens compráveis e recompensas por conquistas.
-- Aplicado no projeto Supabase AcademyRPG (bvsxvcvuiorvwxxlqrmy).

begin;

alter table public.player_profiles
  add column if not exists appearance jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.player_profiles'::regclass
      and conname = 'player_profiles_appearance_object_check'
  ) then
    alter table public.player_profiles
      add constraint player_profiles_appearance_object_check
      check (jsonb_typeof(appearance) = 'object');
  end if;
end $$;

create table if not exists public.avatar_items (
  id text primary key check (id ~ '^[a-z0-9_-]{3,60}$'),
  name text not null,
  slot text not null check (slot in ('hair','hat','outfit','shoulders','cloak','mask','accessory','aura')),
  rarity text not null check (rarity in ('Comum','Incomum','Raro','Épico','Lendário')),
  icon text not null,
  description text not null,
  asset_key text not null,
  unlock_type text not null check (unlock_type in ('shop','achievement')),
  price integer not null default 0 check (price >= 0),
  achievement_id text references public.achievements(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint avatar_items_unlock_rule_check check (
    (unlock_type = 'shop' and price > 0 and achievement_id is null)
    or (unlock_type = 'achievement' and price = 0 and achievement_id is not null)
  )
);

create index if not exists avatar_items_active_slot_idx
  on public.avatar_items(active,slot,price);
create index if not exists avatar_items_achievement_idx
  on public.avatar_items(achievement_id) where achievement_id is not null;

insert into public.avatar_items
  (id,name,slot,rarity,icon,description,asset_key,unlock_type,price,achievement_id)
values
  ('hair-cocoa','Cabelos Castanhos','hair','Comum','🟤','Um corte clássico para qualquer aventureiro.','hair_cocoa','shop',80,null),
  ('hair-silver','Cabelos Prateados','hair','Raro','🌙','Fios claros com brilho discreto.','hair_silver','shop',280,null),
  ('hair-ember','Cabelos de Brasa','hair','Épico','🔥','Um visual marcante em tons de cobre.','hair_ember','shop',420,null),
  ('hair-stargazer','Cabelos do Observador','hair','Épico','✨','Desbloqueado por quem mantém uma rotina de estudos.','hair_star','achievement',0,'dedicado'),
  ('hat-apprentice','Capuz do Aprendiz','hat','Comum','🧢','O primeiro capuz de uma longa jornada.','hat_apprentice','shop',100,null),
  ('hat-wizard','Chapéu do Feiticeiro','hat','Raro','🧙','Um chapéu pontudo com detalhes dourados.','hat_wizard','shop',260,null),
  ('hat-ranger','Capuz do Guardião','hat','Raro','🏹','Leve, discreto e pronto para explorar.','hat_ranger','shop',320,null),
  ('hat-royal','Coroa Real','hat','Lendário','👑','Uma coroa digna do salão dos campeões.','hat_royal','shop',780,null),
  ('hat-firstspark','Capuz do Primeiro Passo','hat','Incomum','🌱','Concedido ao concluir o primeiro quiz.','hat_firstspark','achievement',0,'primeiro'),
  ('outfit-scholar','Túnica do Estudioso','outfit','Comum','📘','Uma túnica confortável para longas sessões de estudo.','outfit_scholar','shop',160,null),
  ('outfit-ranger','Traje do Explorador','outfit','Raro','🌿','Couro leve e tecido verde para quem percorre novos caminhos.','outfit_ranger','shop',340,null),
  ('outfit-royal','Veste da Realeza','outfit','Lendário','💠','Tecido azul profundo com acabamento dourado.','outfit_royal','shop',720,null),
  ('outfit-arcane','Manto do Arcanista','outfit','Épico','🔮','Uma veste marcada por símbolos mágicos.','outfit_arcane','shop',520,null),
  ('outfit-perfect','Veste do Gabarito','outfit','Lendário','💎','Recompensa para quem fecha um quiz com 100% de acerto.','outfit_perfect','achievement',0,'gabarito'),
  ('cloak-forest','Capa da Floresta','cloak','Incomum','🍃','Uma capa verde com fecho de bronze.','cloak_forest','shop',240,null),
  ('cloak-night','Capa da Meia-Noite','cloak','Épico','🌌','Tecido violeta que parece absorver a luz.','cloak_night','shop',480,null),
  ('cloak-stars','Capa das Constelações','cloak','Lendário','⭐','Pequenos pontos de luz acompanham seus passos.','cloak_stars','shop',920,null),
  ('cloak-veteran','Capa do Veterano','cloak','Épico','🏆','Concedida após concluir um simulado.','cloak_veteran','achievement',0,'simulado'),
  ('mask-fox','Máscara de Raposa','mask','Incomum','🦊','Uma máscara leve inspirada nos guardiões da floresta.','mask_fox','shop',220,null),
  ('mask-raven','Máscara de Corvo','mask','Raro','🐦‍⬛','Um visual misterioso de olhos atentos.','mask_raven','shop',390,null),
  ('mask-flame','Máscara da Chama','mask','Épico','🔥','Desbloqueada ao dominar uma sequência de acertos.','mask_flame','achievement',0,'sequencia'),
  ('accessory-staff','Cajado do Aprendiz','accessory','Comum','🪄','Um cajado simples para canalizar conhecimento.','accessory_staff','shop',180,null),
  ('accessory-orb','Orbe Arcano','accessory','Raro','🔮','Uma esfera luminosa que flutua ao lado do personagem.','accessory_orb','shop',360,null),
  ('accessory-wings','Asas de Cristal','accessory','Lendário','🪽','Asas translúcidas para uma aparência lendária.','accessory_wings','shop',850,null),
  ('accessory-scholar','Medalha do Colecionador','accessory','Épico','🏅','Concedida a quem acumula 500 XP.','accessory_scholar','achievement',0,'colecionador'),
  ('aura-ember','Aura das Brasas','aura','Épico','🔥','Um brilho quente envolve o aventureiro.','aura_ember','shop',560,null),
  ('aura-celestial','Aura Celestial','aura','Lendário','🌠','Um halo raro reservado aos grandes exploradores.','aura_celestial','shop',1050,null),
  ('aura-dedication','Aura da Dedicação','aura','Lendário','✨','Recompensa especial por alcançar o nível 5.','aura_dedication','achievement',0,'nivel5'),
  ('armor-logic','Armadura da Lógica','outfit','Épico','⚙️','Concedida a quem explora todas as categorias de estudo.','outfit_logic','achievement',0,'explorador')
  ('horns-infernal','Chifres do Inferno','hat','Lendário','😈','Chifres enormes com pontas rubras para uma presença intimidadora.','horns_infernal','shop',980,null),
  ('horns-ancient','Chifres Ancestrais','hat','Lendário','🐏','Chifres dourados conquistados ao alcançar o nível 5.','horns_ancient','achievement',0,'nivel5'),
  ('helm-berserker','Elmo do Berserker','hat','Épico','⚔️','Capacete pesado com grandes proteções laterais.','helm_berserker','shop',760,null),
  ('helm-dragon','Elmo do Dragão','hat','Lendário','🐉','Elmo escarlate com crista e detalhes de dragão.','helm_dragon','shop',1180,null),
  ('helm-paladin','Elmo do Paladino','hat','Lendário','🛡️','Elmo prateado concedido aos mestres do gabarito.','helm_paladin','achievement',0,'gabarito'),
  ('helm-shadow','Elmo das Sombras','hat','Épico','🌑','Elmo negro com detalhes arcanos violeta.','helm_shadow','shop',890,null),
  ('armor-colossus','Armadura do Colosso','outfit','Lendário','🦾','Armadura de placas largas, reforços e núcleo luminoso.','armor_colossus','shop',1450,null),
  ('armor-dragon','Armadura do Dragão','outfit','Lendário','🐲','Armadura escamada recebida após concluir um simulado.','armor_dragon','achievement',0,'simulado'),
  ('armor-paladin','Armadura do Paladino','outfit','Épico','⚜️','Armadura clara com detalhes dourados e peitoral reforçado.','armor_paladin','shop',1120,null),
  ('armor-shadow','Armadura do Eclipse','outfit','Épico','🌘','Placas escuras com inscrições violetas.','armor_shadow','shop',1050,null),
  ('shoulders-titan','Ombreiras Titânicas','shoulders','Épico','🛡️','Ombreiras largas de aço para ampliar a silhueta do guerreiro.','shoulders_titan','shop',620,null),
  ('shoulders-dragon','Ombreiras do Dragão','shoulders','Lendário','🐉','Placas escarlates com pontas inspiradas em dragões.','shoulders_dragon','shop',880,null),
  ('shoulders-paladin','Ombreiras do Campeão','shoulders','Lendário','🏅','Recompensa para quem explora todas as categorias.','shoulders_paladin','achievement',0,'explorador')
on conflict (id) do update set
  name=excluded.name,slot=excluded.slot,rarity=excluded.rarity,icon=excluded.icon,
  description=excluded.description,asset_key=excluded.asset_key,
  unlock_type=excluded.unlock_type,price=excluded.price,
  achievement_id=excluded.achievement_id,active=true;

create table if not exists public.user_avatar_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references public.avatar_items(id) on delete cascade,
  unlock_source text not null check (unlock_source in ('purchase','achievement')),
  unlocked_at timestamptz not null default now(),
  primary key(user_id,item_id)
);
create index if not exists user_avatar_items_user_idx
  on public.user_avatar_items(user_id,unlocked_at desc);
create index if not exists user_avatar_items_item_idx
  on public.user_avatar_items(item_id);

alter table public.avatar_items enable row level security;
alter table public.user_avatar_items enable row level security;

drop policy if exists avatar_items_read_active on public.avatar_items;
create policy avatar_items_read_active on public.avatar_items
  for select to authenticated using (active=true);
drop policy if exists user_avatar_items_read_own on public.user_avatar_items;
create policy user_avatar_items_read_own on public.user_avatar_items
  for select to authenticated using (user_id=(select auth.uid()));

revoke all on public.avatar_items,public.user_avatar_items from anon,authenticated;
grant select on public.avatar_items,public.user_avatar_items to authenticated;

create or replace function public.avatar_grant_achievement_items()
returns trigger language plpgsql security definer set search_path=public,pg_temp
as $$
begin
  insert into public.user_avatar_items(user_id,item_id,unlock_source)
  select new.user_id,i.id,'achievement'
  from public.avatar_items i
  where i.unlock_type='achievement' and i.achievement_id=new.achievement_id and i.active=true
  on conflict(user_id,item_id) do nothing;
  return new;
end $$;

drop trigger if exists avatar_achievement_unlock on public.user_achievements;
create trigger avatar_achievement_unlock after insert on public.user_achievements
for each row execute function public.avatar_grant_achievement_items();

create or replace function public.avatar_sync_achievement_rewards()
returns integer language plpgsql security definer set search_path=public,pg_temp
as $$
declare v_uid uuid:=auth.uid(); v_count integer;
begin
  if v_uid is null then raise exception 'Não autenticado'; end if;
  insert into public.user_avatar_items(user_id,item_id,unlock_source)
  select ua.user_id,i.id,'achievement'
  from public.user_achievements ua
  join public.avatar_items i on i.achievement_id=ua.achievement_id
  where ua.user_id=v_uid and i.unlock_type='achievement' and i.active=true
  on conflict(user_id,item_id) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

create or replace function public.avatar_buy_item(p_item_id text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp
as $$
declare v_uid uuid:=auth.uid(); v_item public.avatar_items%rowtype; v_balance integer;
begin
  if v_uid is null then raise exception 'Não autenticado'; end if;
  if coalesce(length(p_item_id),0) not between 1 and 60 then raise exception 'Item inválido'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text,1));
  select * into v_item from public.avatar_items where id=p_item_id and active=true and unlock_type='shop';
  if not found then raise exception 'Este item não está disponível para compra.'; end if;
  if exists(select 1 from public.user_avatar_items where user_id=v_uid and item_id=p_item_id) then
    return jsonb_build_object('ok',false,'reason','owned');
  end if;
  insert into public.coin_wallets(user_id) values(v_uid) on conflict(user_id) do nothing;
  select balance into v_balance from public.coin_wallets where user_id=v_uid for update;
  if v_balance<v_item.price then return jsonb_build_object('ok',false,'reason','insufficient','balance',v_balance,'price',v_item.price); end if;
  insert into public.user_avatar_items(user_id,item_id,unlock_source) values(v_uid,p_item_id,'purchase');
  update public.coin_wallets set balance=balance-v_item.price,updated_at=now() where user_id=v_uid;
  insert into public.coin_transactions(user_id,amount,event_key,description)
    values(v_uid,-v_item.price,'avatar-purchase:'||p_item_id,'Visual: '||v_item.name);
  return jsonb_build_object('ok',true,'balance',v_balance-v_item.price,'item_id',p_item_id);
end $$;

create or replace function public.avatar_equip_item(p_item_id text,p_equipped boolean default true)
returns jsonb language plpgsql security definer set search_path=public,pg_temp
as $$
declare v_uid uuid:=auth.uid(); v_item public.avatar_items%rowtype; v_appearance jsonb;
begin
  if v_uid is null then raise exception 'Não autenticado'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text,1));
  select * into v_item from public.avatar_items where id=p_item_id and active=true;
  if not found then raise exception 'Visual indisponível'; end if;
  if not exists(select 1 from public.user_avatar_items where user_id=v_uid and item_id=p_item_id) then
    raise exception 'Este visual ainda não está no seu inventário.';
  end if;
  update public.player_profiles
    set appearance=case
      when p_equipped then jsonb_set(coalesce(appearance,'{}'::jsonb),array[v_item.slot],to_jsonb(v_item.id),true)
      when appearance->>v_item.slot=v_item.id then appearance-v_item.slot
      else appearance
    end
    where user_id=v_uid
    returning appearance into v_appearance;
  if not found then raise exception 'Perfil do aventureiro não encontrado.'; end if;
  return jsonb_build_object('ok',true,'appearance',coalesce(v_appearance,'{}'::jsonb));
end $$;

create or replace function public.get_leaderboard(p_period text default 'all')
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp
as $$
declare v_uid uuid:=auth.uid(); v_start timestamptz; v_entries jsonb; v_rank bigint;
begin
  if v_uid is null then raise exception 'Não autenticado'; end if;
  if p_period not in ('all','week','month') then raise exception 'Período inválido'; end if;
  v_start:=case
    when p_period='week' then public._adventure_week_start()::timestamp at time zone 'America/Sao_Paulo'
    when p_period='month' then date_trunc('month',now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'
    else null end;
  with scores as (
    select p.user_id,coalesce(nullif(p.adventurer_name,''),'Aventureiro') as name,
      p.avatar,p.appearance,p.class,p.total_xp,
      case when p_period='all' then p.total_xp else coalesce(sum(e.xp),0)::integer end as score
    from public.player_profiles p
    left join public.xp_events e on e.user_id=p.user_id and (v_start is null or e.created_at>=v_start)
    group by p.user_id,p.adventurer_name,p.avatar,p.appearance,p.class,p.total_xp
  ), ranked as (
    select s.*,row_number() over(order by s.score desc,s.total_xp desc,s.name asc,s.user_id) as position
    from scores s
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'rank',r.position,'name',r.name,'avatar',r.avatar,'appearance',r.appearance,
    'class',r.class,'xp',r.score,
    'level',greatest(1,floor((1+sqrt(1+r.total_xp/12.5))/2)::integer),'is_me',r.user_id=v_uid
  ) order by r.position),'[]'::jsonb) into v_entries
  from ranked r where r.position<=50;

  with scores as (
    select p.user_id,case when p_period='all' then p.total_xp else coalesce(sum(e.xp),0)::integer end as score,p.total_xp
    from public.player_profiles p
    left join public.xp_events e on e.user_id=p.user_id and (v_start is null or e.created_at>=v_start)
    group by p.user_id,p.total_xp
  ), ranked as (
    select user_id,row_number() over(order by score desc,total_xp desc,user_id) as position from scores
  )
  select position into v_rank from ranked where user_id=v_uid;
  return jsonb_build_object('period',p_period,'entries',v_entries,'my_rank',v_rank);
end $$;

revoke all on function public.avatar_grant_achievement_items() from public,anon,authenticated;
revoke all on function public.avatar_sync_achievement_rewards() from public,anon;
revoke all on function public.avatar_buy_item(text) from public,anon;
revoke all on function public.avatar_equip_item(text,boolean) from public,anon;
grant execute on function public.avatar_sync_achievement_rewards() to authenticated;
grant execute on function public.avatar_buy_item(text) to authenticated;
grant execute on function public.avatar_equip_item(text,boolean) to authenticated;
revoke all on function public.get_leaderboard(text) from public,anon;
grant execute on function public.get_leaderboard(text) to authenticated;

commit;
