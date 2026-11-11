-- Cores neon compráveis para o nome do aventureiro.
begin;
alter table public.avatar_items drop constraint if exists avatar_items_slot_check;
alter table public.avatar_items add constraint avatar_items_slot_check
  check (slot in ('hair','hat','outfit','shoulders','cloak','mask','accessory','aura','title','nameColor'));
insert into public.avatar_items
(id,name,slot,rarity,icon,description,asset_key,unlock_type,price,achievement_id)
values
('name-neon-cyan','Ciano Plasma','nameColor','Raro','💠','Seu nome ganha um brilho neon ciano em todas as áreas públicas.','name_neon_cyan','shop',450,null),
('name-neon-pink','Rosa Cósmico','nameColor','Épico','💗','Um rosa neon intenso destaca seu nome no reino.','name_neon_pink','shop',700,null),
('name-neon-purple','Violeta Arcano','nameColor','Épico','🔮','Um brilho violeta mágico acompanha sua identidade.','name_neon_purple','shop',750,null),
('name-neon-green','Verde Tóxico','nameColor','Épico','☢️','Um verde elétrico ilumina seu nome.','name_neon_green','shop',800,null),
('name-neon-gold','Ouro Celestial','nameColor','Lendário','🌟','Um dourado radiante reservado a aventureiros lendários.','name_neon_gold','shop',1100,null),
('name-neon-red','Rubi Incandescente','nameColor','Lendário','🔥','Um vermelho incandescente com brilho de fogo.','name_neon_red','shop',1000,null)
on conflict(id) do update set name=excluded.name,slot=excluded.slot,rarity=excluded.rarity,
icon=excluded.icon,description=excluded.description,asset_key=excluded.asset_key,
unlock_type=excluded.unlock_type,price=excluded.price,achievement_id=excluded.achievement_id,active=true;
commit;

-- Atualiza o payload público da guilda para incluir a aparência de cada membro.
create or replace function public.get_my_guild()
returns jsonb language plpgsql stable security definer
set search_path to 'public','pg_temp'
as $function$
declare v_uid uuid:=auth.uid(); v_g public.guilds%rowtype; v_result jsonb;
begin
  if v_uid is null then raise exception 'Não autenticado'; end if;
  select g.* into v_g from public.guild_members m
  join public.guilds g on g.id=m.guild_id where m.user_id=v_uid;
  if not found then return null; end if;
  select jsonb_build_object(
    'guild',jsonb_build_object('id',v_g.id,'name',v_g.name,'tag',v_g.tag,'description',v_g.description,
      'active',v_g.active,'invite_code',case when v_g.owner_id=v_uid then v_g.invite_code else null end,
      'owner',v_g.owner_id=v_uid,'created_at',v_g.created_at,'flag_config',v_g.flag_config),
    'members',coalesce((select jsonb_agg(jsonb_build_object(
      'name',coalesce(nullif(p.adventurer_name,''),'Aventureiro'),'avatar',p.avatar,
      'appearance',coalesce(p.appearance,'{}'::jsonb),'xp',p.total_xp,'class',p.class,
      'role',m.role,'joined_at',m.joined_at,'is_me',m.user_id=v_uid)
      order by case m.role when 'leader' then 1 when 'officer' then 2 else 3 end,m.joined_at)
      from public.guild_members m left join public.player_profiles p on p.user_id=m.user_id
      where m.guild_id=v_g.id),'[]'::jsonb)
  ) into v_result;
  return v_result;
end
$function$;
revoke all on function public.get_my_guild() from public,anon;
grant execute on function public.get_my_guild() to authenticated;