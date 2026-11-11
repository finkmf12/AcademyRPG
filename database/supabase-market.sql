-- Academia RPG · Mercado Arcano
-- Carteira, histórico, catálogo e inventário com gravações exclusivamente por RPCs seguras.

create table if not exists public.market_items (
  id text primary key,
  name text not null,
  category text not null check (category in ('titles','nick','frames','backgrounds','badges')),
  price integer not null check (price > 0),
  rarity text not null check (rarity in ('Comum','Incomum','Raro','Épico','Lendário')),
  icon text not null,
  description text not null,
  active boolean not null default true
);

insert into public.market_items (id,name,category,price,rarity,icon,description) values
('title-apprentice','Aprendiz Arcano','titles',50,'Comum','📜','O primeiro passo de uma grande jornada.'),
('title-coder','Mestre do Código','titles',200,'Raro','⌘','Para quem domina os enigmas da lógica.'),
('title-dragon','Caçador de Dragões','titles',400,'Épico','🐉','Uma honra conquistada em grandes batalhas.'),
('nick-arcane','Aura Arcana','nick',100,'Incomum','✨','Um brilho sutil envolve seu nome.'),
('nick-flame','Chama Dourada','nick',400,'Épico','🔥','Seu nome arde com energia lendária.'),
('frame-silver','Moldura Prateada','frames',100,'Incomum','🛡️','Um acabamento elegante para seu avatar.'),
('frame-royal','Brasão Real','frames',800,'Lendário','👑','Uma moldura digna de uma lenda.'),
('bg-forest','Floresta Encantada','backgrounds',200,'Raro','🌲','Uma paisagem envolta em mistério.'),
('bg-celestial','Observatório Celeste','backgrounds',550,'Épico','🌌','Um céu profundo, constelações e a luz de um astro distante.'),
('bg-library','Biblioteca Arcana','backgrounds',350,'Raro','📚','Arcos antigos, estantes encantadas e relíquias de conhecimento.'),
('bg-frost','Cidadela Glacial','backgrounds',600,'Épico','❄️','Montanhas de cristal sob o brilho da aurora boreal.'),
('bg-volcano','Forja Vulcânica','backgrounds',500,'Épico','🌋','Rios de lava iluminam uma terra forjada pelo fogo.'),
('bg-emerald','Ruínas Esmeralda','backgrounds',400,'Raro','🌿','Um templo esquecido tomado pela floresta e pela magia.'),
('bg-royal','Castelo Imperial','backgrounds',850,'Lendário','🏰','Uma fortaleza majestosa iluminada por ouro e tradição.'),
('bg-abyss','Abismo Oceânico','backgrounds',750,'Lendário','🌊','Ruínas submersas em águas profundas e misteriosas.'),
('bg-cherry','Jardim das Cerejeiras','backgrounds',450,'Épico','🌸','Um refúgio sereno entre pétalas e luz rosada.'),
('bg-desert','Templo do Deserto','backgrounds',350,'Raro','🏜️','Dunas ancestrais guardam os segredos de um reino perdido.'),
('badge-scholar','Selo do Conhecimento','badges',50,'Comum','🏅','Celebre sua dedicação aos estudos.')
on conflict (id) do update set
  name=excluded.name, category=excluded.category, price=excluded.price,
  rarity=excluded.rarity, icon=excluded.icon, description=excluded.description, active=true;

create table if not exists public.coin_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);
create table if not exists public.coin_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount <> 0),
  event_key text not null,
  description text not null,
  created_at timestamptz not null default now(),
  unique (user_id,event_key)
);
create index if not exists coin_transactions_user_idx on public.coin_transactions(user_id,created_at desc);
create table if not exists public.user_cosmetics (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references public.market_items(id),
  equipped boolean not null default false,
  purchased_at timestamptz not null default now(),
  primary key(user_id,item_id)
);
create index if not exists user_cosmetics_equipped_idx on public.user_cosmetics(user_id,equipped);

alter table public.market_items enable row level security;
alter table public.coin_wallets enable row level security;
alter table public.coin_transactions enable row level security;
alter table public.user_cosmetics enable row level security;

drop policy if exists market_items_read on public.market_items;
create policy market_items_read on public.market_items for select to authenticated using (active=true);
drop policy if exists coin_wallets_read_own on public.coin_wallets;
create policy coin_wallets_read_own on public.coin_wallets for select to authenticated using (user_id=auth.uid());
drop policy if exists coin_transactions_read_own on public.coin_transactions;
create policy coin_transactions_read_own on public.coin_transactions for select to authenticated using (user_id=auth.uid());
drop policy if exists user_cosmetics_read_own on public.user_cosmetics;
create policy user_cosmetics_read_own on public.user_cosmetics for select to authenticated using (user_id=auth.uid());
revoke all on public.market_items,public.coin_wallets,public.coin_transactions,public.user_cosmetics from anon,authenticated;
grant select on public.market_items to authenticated;
grant select on public.coin_wallets,public.coin_transactions,public.user_cosmetics to authenticated;

create or replace function public._market_grant_coins(p_uid uuid,p_amount integer,p_event_key text,p_description text)
returns integer language plpgsql security definer set search_path=public as $$
begin
  if p_uid is null or p_amount not between 1 and 100 or coalesce(length(p_event_key),0) not between 1 and 140 then return 0; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_uid::text,1));
  insert into public.coin_wallets(user_id) values(p_uid) on conflict(user_id) do nothing;
  insert into public.coin_transactions(user_id,amount,event_key,description)
  values(p_uid,p_amount,p_event_key,left(p_description,160)) on conflict(user_id,event_key) do nothing;
  if not found then return 0; end if;
  update public.coin_wallets set balance=balance+p_amount,updated_at=now() where user_id=p_uid;
  return p_amount;
end $$;

create or replace function public.market_daily_status()
returns boolean language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid(); v_key text;
begin
  if v_uid is null then raise exception 'Não autenticado'; end if;
  insert into public.coin_wallets(user_id) values(v_uid) on conflict(user_id) do nothing;
  v_key:='daily-mission:'||to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM-DD');
  return not exists(select 1 from public.coin_transactions where user_id=v_uid and event_key=v_key);
end $$;

create or replace function public.market_claim_daily()
returns integer language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'Não autenticado'; end if;
  return public._market_grant_coins(v_uid,30,
    'daily-mission:'||to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM-DD'),
    'Missão diária do Mercado Arcano');
end $$;

create or replace function public.market_buy_item(p_item_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid(); v_item public.market_items%rowtype; v_balance integer;
begin
  if v_uid is null then raise exception 'Não autenticado'; end if;
  if coalesce(length(p_item_id),0) not between 1 and 80 then raise exception 'Item inválido'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text,1));
  select * into v_item from public.market_items where id=p_item_id and active=true;
  if not found then raise exception 'Item indisponível'; end if;
  if exists(select 1 from public.user_cosmetics where user_id=v_uid and item_id=p_item_id) then return jsonb_build_object('ok',false,'reason','owned'); end if;
  insert into public.coin_wallets(user_id) values(v_uid) on conflict(user_id) do nothing;
  select balance into v_balance from public.coin_wallets where user_id=v_uid for update;
  if v_balance<v_item.price then return jsonb_build_object('ok',false,'reason','insufficient'); end if;
  insert into public.user_cosmetics(user_id,item_id) values(v_uid,p_item_id);
  update public.coin_wallets set balance=balance-v_item.price,updated_at=now() where user_id=v_uid;
  insert into public.coin_transactions(user_id,amount,event_key,description)
  values(v_uid,-v_item.price,'purchase:'||p_item_id,'Compra: '||v_item.name);
  return jsonb_build_object('ok',true,'balance',v_balance-v_item.price,'item_id',p_item_id);
end $$;

create or replace function public.market_equip_item(p_item_id text,p_equipped boolean default true)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid(); v_category text;
begin
  if v_uid is null then raise exception 'Não autenticado'; end if;
  select i.category into v_category from public.user_cosmetics c join public.market_items i on i.id=c.item_id
  where c.user_id=v_uid and c.item_id=p_item_id;
  if not found then raise exception 'Este item não está no seu inventário'; end if;
  if p_equipped then
    update public.user_cosmetics c set equipped=false from public.market_items i
    where c.user_id=v_uid and c.item_id=i.id and i.category=v_category;
  end if;
  update public.user_cosmetics set equipped=p_equipped where user_id=v_uid and item_id=p_item_id;
  return true;
end $$;

create or replace function public._market_quiz_rewards()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old.status='active' and new.status='completed' and new.user_id is not null then
    perform public._market_grant_coins(new.user_id,10,'quiz:'||new.id::text,'Quiz concluído');
    if new.best_streak>=5 then perform public._market_grant_coins(new.user_id,20,'quiz-streak:'||new.id::text,'Sequência de 5 acertos'); end if;
  end if;
  return new;
end $$;
drop trigger if exists market_quiz_rewards on public.quiz_sessions;
create trigger market_quiz_rewards after update of status on public.quiz_sessions
for each row execute function public._market_quiz_rewards();

create or replace function public._market_achievement_reward()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  perform public._market_grant_coins(new.user_id,40,'achievement:'||new.achievement_id,'Conquista desbloqueada: '||new.achievement_id);
  return new;
end $$;
drop trigger if exists market_achievement_reward on public.user_achievements;
create trigger market_achievement_reward after insert on public.user_achievements
for each row execute function public._market_achievement_reward();

revoke all on function public._market_grant_coins(uuid,integer,text,text) from public,anon,authenticated;
revoke all on function public._market_quiz_rewards() from public,anon,authenticated;
revoke all on function public._market_achievement_reward() from public,anon,authenticated;
revoke all on function public.market_daily_status() from public,anon;
revoke all on function public.market_claim_daily() from public,anon;
revoke all on function public.market_buy_item(text) from public,anon;
revoke all on function public.market_equip_item(text,boolean) from public,anon;
grant execute on function public.market_daily_status() to authenticated;
grant execute on function public.market_claim_daily() to authenticated;
grant execute on function public.market_buy_item(text) to authenticated;
grant execute on function public.market_equip_item(text,boolean) to authenticated;
