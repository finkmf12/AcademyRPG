-- Registra uma notificação persistente quando um novo visitante chega ao espaço.
-- A função limita visitas repetidas do mesmo usuário a uma notificação a cada 30 minutos.
create or replace function public.get_player_space(p_target uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
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
  ) then
    insert into public.player_space_visits(owner_id, visitor_id) values (p_target, v_uid);
    insert into public.user_notifications(user_id,type,title,message,icon)
    values (
      p_target,'info','Nova visita ao seu espaço',
      coalesce(nullif(v_profile.adventurer_name,''),nullif(v_profile.display_name,''),'Um aventureiro') || ' visitou seu espaço pessoal.',
      '♟'
    );
  end if;
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
  ) order by m.created_at desc),'[]'::jsonb)
  into v_messages from (select * from public.player_space_messages where owner_id=p_target order by created_at desc limit 15) m
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
      'avatar',coalesce(v_profile.avatar,'🧙'),'total_xp',v_profile.total_xp,
      'class',v_profile.class,'appearance',coalesce(v_profile.appearance,'{}'::jsonb)),
    'guild',coalesce(v_guild,'null'::jsonb),'equipped',v_equipped,'achievements',v_achievements,
    'guestbook',v_messages,'recent_visitors',v_visitors,
    'stats',jsonb_build_object('visits',v_visits,'likes',v_likes,'messages',v_message_count,'visitor_has_liked',v_has_liked),
    'settings',jsonb_build_object('visibility',v_settings.visibility,'allow_guestbook',v_settings.allow_guestbook)
  );
end;
$function$;
revoke all on function public.get_player_space(uuid) from public,anon,authenticated;
grant execute on function public.get_player_space(uuid) to authenticated;
