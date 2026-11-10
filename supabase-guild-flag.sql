-- Supabase migration for the Academia RPG guild flag studio.
-- The same migration is applied to the connected project.
alter table public.guilds
  add column if not exists flag_config jsonb not null
  default '{"primary":"#34465d","secondary":"#d0b36b","pattern":"diagonal","symbol":"⚔️","motto":""}'::jsonb;

create or replace function public.save_guild_flag(
  p_primary text,p_secondary text,p_pattern text,p_symbol text,p_motto text default ''
)
returns jsonb language plpgsql security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_guild_id uuid;
  v_flag jsonb;
  v_motto text:=btrim(coalesce(p_motto,''));
begin
  if v_uid is null then raise exception 'Não autenticado'; end if;
  if p_primary is null or p_primary not in ('#9f3e40','#3b638a','#34465d','#426c56','#936533','#71538c','#d0b36b','#303b4d','#d9d6cd')
    or p_secondary not in ('#9f3e40','#3b638a','#34465d','#426c56','#936533','#71538c','#d0b36b','#303b4d','#d9d6cd') then
    raise exception 'Cor de bandeira inválida.';
  end if;
  if p_pattern is null or p_pattern not in ('solid','horizontal','vertical','diagonal','cross','chevron','quartered') then raise exception 'Padrão inválido.'; end if;
  if p_symbol is null or p_symbol not in ('⚔️','🐉','🦉','🦅','🐺','🛡️','✦','♛','🌙','🔥') then raise exception 'Símbolo inválido.'; end if;
  if char_length(v_motto)>48 then raise exception 'O lema deve ter no máximo 48 caracteres.'; end if;
  select id into v_guild_id from public.guilds where owner_id=v_uid for update;
  if not found then raise exception 'Somente o líder atual da guilda pode editar a bandeira.'; end if;
  v_flag:=jsonb_build_object('primary',p_primary,'secondary',p_secondary,'pattern',p_pattern,'symbol',p_symbol,'motto',v_motto);
  update public.guilds set flag_config=v_flag where id=v_guild_id;
  return jsonb_build_object('ok',true,'flag_config',v_flag);
end
$function$;
revoke all on function public.save_guild_flag(text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.save_guild_flag(text,text,text,text,text) to authenticated;

create or replace function public.get_my_guild()
returns jsonb language plpgsql stable security definer
set search_path to 'public', 'pg_temp'
as $function$
declare v_uid uuid:=auth.uid(); v_g public.guilds%rowtype; v_result jsonb;
begin
 if v_uid is null then raise exception 'Não autenticado'; end if;
 select g.* into v_g from public.guild_members m join public.guilds g on g.id=m.guild_id where m.user_id=v_uid;
 if not found then return null; end if;
 select jsonb_build_object(
  'guild',jsonb_build_object('id',v_g.id,'name',v_g.name,'tag',v_g.tag,'description',v_g.description,'active',v_g.active,
   'invite_code',case when v_g.owner_id=v_uid then v_g.invite_code else null end,'owner',v_g.owner_id=v_uid,
   'created_at',v_g.created_at,'flag_config',v_g.flag_config),
  'members',coalesce((select jsonb_agg(jsonb_build_object('name',coalesce(nullif(p.adventurer_name,''),'Aventureiro'),
   'avatar',p.avatar,'xp',p.total_xp,'class',p.class,'role',m.role,'joined_at',m.joined_at,'is_me',m.user_id=v_uid)
   order by case m.role when 'leader' then 1 when 'officer' then 2 else 3 end,m.joined_at
   from public.guild_members m left join public.player_profiles p on p.user_id=m.user_id where m.guild_id=v_g.id),'[]'::jsonb)
 ) into v_result;
 return v_result;
end
$function$;

create or replace function public.list_guilds()
returns jsonb language plpgsql stable security definer
set search_path to 'public', 'pg_temp'
as $function$
declare v_uid uuid:=auth.uid(); v_result jsonb;
begin
 if v_uid is null then raise exception 'Não autenticado'; end if;
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',g.id,'name',g.name,'tag',g.tag,'description',g.description,'flag_config',g.flag_config,
  'members',(select count(*) from public.guild_members m where m.guild_id=g.id),
  'total_xp',(select coalesce(sum(p.total_xp),0) from public.guild_members m join public.player_profiles p on p.user_id=m.user_id where m.guild_id=g.id),
  'joined',exists(select 1 from public.guild_members m where m.guild_id=g.id and m.user_id=v_uid)
 ) order by (select count(*) from public.guild_members m where m.guild_id=g.id) desc,g.created_at),'[]'::jsonb)
 into v_result from public.guilds g where g.active=true;
 return v_result;
end
$function$;
