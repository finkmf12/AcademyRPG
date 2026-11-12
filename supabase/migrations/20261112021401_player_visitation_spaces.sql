-- Academia RPG · Espaços pessoais e visitação entre aventureiros
create table if not exists public.player_space_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  visibility text not null default 'friends' check (visibility in ('friends','everyone','private')),
  allow_guestbook boolean not null default true,
  updated_at timestamptz not null default now()
);
create table if not exists public.player_space_visits (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  visitor_id uuid not null references auth.users(id) on delete cascade,
  visited_at timestamptz not null default now(),
  constraint player_space_visits_no_self check (owner_id <> visitor_id)
);
create index if not exists player_space_visits_owner_date_idx on public.player_space_visits (owner_id, visited_at desc);
create index if not exists player_space_visits_visitor_idx on public.player_space_visits (visitor_id, visited_at desc);
create table if not exists public.player_space_likes (
  owner_id uuid not null references auth.users(id) on delete cascade,
  visitor_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, visitor_id),
  constraint player_space_likes_no_self check (owner_id <> visitor_id)
);
create table if not exists public.player_space_messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 240),
  created_at timestamptz not null default now()
);
create index if not exists player_space_messages_owner_date_idx on public.player_space_messages (owner_id, created_at desc);
alter table public.player_space_settings enable row level security;
alter table public.player_space_visits enable row level security;
alter table public.player_space_likes enable row level security;
alter table public.player_space_messages enable row level security;
revoke all on public.player_space_settings, public.player_space_visits, public.player_space_likes, public.player_space_messages from anon, public, authenticated;
revoke all on sequence public.player_space_visits_id_seq from anon, public, authenticated;

create or replace function public.get_player_space(p_target uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
  v_profile public.player_profiles%rowtype;
  v_settings public.player_space_settings%rowtype;
  v_is_owner boolean;
  v_is_friend boolean;
  v_guild jsonb;
  v_equipped jsonb;
  v_achievements jsonb;
  v_messages jsonb;
  v_visitors jsonb;
  v_visits bigint;
  v_likes bigint;
  v_message_count bigint;
  v_has_liked boolean := false;
begin
  if v_uid is null then raise exception 'Entre com sua conta para visitar um aventureiro.'; end if;
  if p_target is null then raise exception 'Aventureiro inválido.'; end if;
  v_is_owner := (v_uid = p_target);
  select * into v_profile from public.player_profiles where user_id = p_target;
  if not found then raise exception 'Este aventureiro ainda não possui um personagem.'; end if;
  insert into public.player_space_settings(user_id) values (p_target) on conflict (user_id) do nothing;
  select * into v_settings from public.player_space_settings where user_id = p_target;
  select exists (
    select 1 from public.friend_requests f
    where f.status = 'accepted'
      and ((f.requester_id = v_uid and f.addressee_id = p_target)
        or (f.requester_id = p_target and f.addressee_id = v_uid))
  ) into v_is_friend;
  if not v_is_owner and (
    v_settings.visibility = 'private'
    or (v_settings.visibility = 'friends' and not v_is_friend)
  ) then raise exception 'Este espaço é reservado aos amigos do aventureiro.'; end if;
  if not v_is_owner and not exists (
    select 1 from public.player_space_visits
    where owner_id = p_target and visitor_id = v_uid and visited_at > now() - interval '30 minutes'
  ) then insert into public.player_space_visits(owner_id, visitor_id) values (p_target, v_uid); end if;
  select jsonb_build_object('name',g.name,'tag',g.tag) into v_guild
  from public.guild_members gm join public.guilds g on g.id = gm.guild_id
  where gm.user_id = p_target and g.active = true order by gm.joined_at asc limit 1;
  select coalesce(jsonb_agg(jsonb_build_object('id',mi.id,'name',mi.name,'category',mi.category,'rarity',mi.rarity,'icon',mi.icon) order by mi.category,mi.name),'[]'::jsonb)
  into v_equipped from public.user_cosmetics uc join public.market_items mi on mi.id = uc.item_id
  where uc.user_id = p_target and uc.equipped = true;
  select coalesce(jsonb_agg(jsonb_build_object('id',ua.achievement_id,'unlocked_at',ua.unlocked_at) order by ua.unlocked_at desc),'[]'::jsonb)
  into v_achievements from public.user_achievements ua where ua.user_id = p_target;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',m.id,'body',m.body,'created_at',m.created_at,'author_id',m.author_id,
    'author_name',coalesce(nullif(ap.adventurer_name,''),nullif(ap.display_name,''),'Aventureiro'),
    'author_avatar',coalesce(ap.avatar,'🧙')
  ) order by m.created_at desc),'[]'::jsonb) into v_messages
  from (select * from public.player_space_messages where owner_id=p_target order by created_at desc limit 15) m
  join public.player_profiles ap on ap.user_id=m.author_id;
  select count(*) into v_visits from public.player_space_visits where owner_id=p_target;
  select count(*) into v_likes from public.player_space_likes where owner_id=p_target;
  select count(*) into v_message_count from public.player_space_messages where owner_id=p_target;
  select exists(select 1 from public.player_space_likes where owner_id=p_target and visitor_id=v_uid) into v_has_liked;
  if v_is_owner then
    select coalesce(jsonb_agg(jsonb_build_object(
      'visitor_id',recent.visitor_id,
      'visitor_name',coalesce(nullif(pp.adventurer_name,''),nullif(pp.display_name,''),'Aventureiro'),
      'visitor_avatar',coalesce(pp.avatar,'🧙'),'visited_at',recent.visited_at
    ) order by recent.visited_at desc),'[]'::jsonb) into v_visitors
    from (select distinct on (visitor_id) visitor_id,visited_at from public.player_space_visits
      where owner_id=p_target order by visitor_id,visited_at desc limit 8) recent
    join public.player_profiles pp on pp.user_id=recent.visitor_id;
  else v_visitors := '[]'::jsonb; end if;
  return jsonb_build_object(
    'is_owner',v_is_owner,'is_friend',v_is_friend,
    'profile',jsonb_build_object('user_id',v_profile.user_id,
      'player_name',coalesce(nullif(v_profile.adventurer_name,''),nullif(v_profile.display_name,''),'Aventureiro'),
      'avatar',coalesce(v_profile.avatar,'🧙'),'total_xp',v_profile.total_xp,'class',v_profile.class,
      'appearance',coalesce(v_profile.appearance,'{}'::jsonb)),
    'guild',coalesce(v_guild,'null'::jsonb),'equipped',v_equipped,'achievements',v_achievements,
    'guestbook',v_messages,'recent_visitors',v_visitors,
    'stats',jsonb_build_object('visits',v_visits,'likes',v_likes,'messages',v_message_count,'visitor_has_liked',v_has_liked),
    'settings',jsonb_build_object('visibility',v_settings.visibility,'allow_guestbook',v_settings.allow_guestbook)
  );
end;
$function$;

create or replace function public.toggle_player_space_like(p_owner_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare v_uid uuid := auth.uid(); v_liked boolean; v_count bigint;
begin
  if v_uid is null or p_owner_id is null or p_owner_id=v_uid then raise exception 'Não é possível curtir este espaço.'; end if;
  perform public.get_player_space(p_owner_id);
  delete from public.player_space_likes where owner_id=p_owner_id and visitor_id=v_uid;
  if found then v_liked:=false; else
    insert into public.player_space_likes(owner_id,visitor_id) values(p_owner_id,v_uid);
    v_liked:=true;
  end if;
  select count(*) into v_count from public.player_space_likes where owner_id=p_owner_id;
  return jsonb_build_object('liked',v_liked,'likes',v_count);
end;
$function$;

create or replace function public.post_player_space_message(p_owner_id uuid,p_body text)
returns uuid language plpgsql security definer set search_path = ''
as $function$
declare v_uid uuid:=auth.uid(); v_body text:=btrim(coalesce(p_body,'')); v_allow boolean; v_id uuid;
begin
  if v_uid is null or p_owner_id is null or p_owner_id=v_uid then raise exception 'Não é possível publicar neste mural.'; end if;
  if char_length(v_body)<2 or char_length(v_body)>240 then raise exception 'O recado deve ter entre 2 e 240 caracteres.'; end if;
  perform public.get_player_space(p_owner_id);
  select allow_guestbook into v_allow from public.player_space_settings where user_id=p_owner_id;
  if not coalesce(v_allow,false) then raise exception 'O mural deste aventureiro está fechado.'; end if;
  if exists(select 1 from public.player_space_messages where author_id=v_uid and created_at>now()-interval '45 seconds')
  then raise exception 'Aguarde um pouco antes de deixar outro recado.'; end if;
  insert into public.player_space_messages(owner_id,author_id,body) values(p_owner_id,v_uid,v_body) returning id into v_id;
  return v_id;
end;
$function$;

create or replace function public.delete_player_space_message(p_message_id uuid)
returns boolean language plpgsql security definer set search_path = ''
as $function$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'Entre com sua conta.'; end if;
  delete from public.player_space_messages m where m.id=p_message_id and (m.author_id=v_uid or m.owner_id=v_uid);
  return found;
end;
$function$;

create or replace function public.save_player_space_settings(p_visibility text,p_allow_guestbook boolean)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'Entre com sua conta.'; end if;
  if p_visibility not in ('friends','everyone','private') then raise exception 'Privacidade inválida.'; end if;
  insert into public.player_space_settings(user_id,visibility,allow_guestbook,updated_at)
  values(v_uid,p_visibility,coalesce(p_allow_guestbook,true),now())
  on conflict(user_id) do update set visibility=excluded.visibility,allow_guestbook=excluded.allow_guestbook,updated_at=now();
  return jsonb_build_object('visibility',p_visibility,'allow_guestbook',coalesce(p_allow_guestbook,true));
end;
$function$;

revoke all on function public.get_player_space(uuid) from public,anon,authenticated;
revoke all on function public.toggle_player_space_like(uuid) from public,anon,authenticated;
revoke all on function public.post_player_space_message(uuid,text) from public,anon,authenticated;
revoke all on function public.delete_player_space_message(uuid) from public,anon,authenticated;
revoke all on function public.save_player_space_settings(text,boolean) from public,anon,authenticated;
grant execute on function public.get_player_space(uuid) to authenticated;
grant execute on function public.toggle_player_space_like(uuid) to authenticated;
grant execute on function public.post_player_space_message(uuid,text) to authenticated;
grant execute on function public.delete_player_space_message(uuid) to authenticated;
grant execute on function public.save_player_space_settings(text,boolean) to authenticated;
