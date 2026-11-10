-- Academia RPG: expansão da heráldica de guildas e relíquias na loja.
alter table public.market_items drop constraint if exists market_items_category_check;
alter table public.market_items
  add constraint market_items_category_check
  check (category in ('titles','nick','frames','backgrounds','badges','guild'));

insert into public.market_items (id,name,category,price,rarity,icon,description) values
('guild-crest-dragon','Brasão do Dragão','guild',650,'Épico','🐉','Um dragão ancestral emoldurado por aço e fogo.'),
('guild-crest-phoenix','Brasão da Fênix','guild',850,'Lendário','🔥','Uma fênix renascida em chamas douradas.'),
('guild-shield-royal','Escudo da Realeza','guild',700,'Épico','🛡️','Escudo ornamentado com acabamento dourado e brilho real.'),
('guild-shield-obsidian','Escudo de Obsidiana','guild',950,'Lendário','⚔️','Metal negro com reflexos arcanos violetas.'),
('guild-effect-aurora','Aura Boreal','guild',500,'Épico','✨','Uma aura azul-violeta pulsa ao redor do brasão.'),
('guild-effect-flame','Chamas Arcanas','guild',600,'Épico','🔥','Um brilho incandescente envolve o símbolo da guilda.'),
('guild-effect-runes','Runas Luminosas','guild',750,'Lendário','ᚱ','Runas azuis e violetas iluminam o escudo.')
on conflict (id) do update set
  name=excluded.name,category=excluded.category,price=excluded.price,
  rarity=excluded.rarity,icon=excluded.icon,description=excluded.description,active=true;

drop function if exists public.save_guild_flag(text,text,text,text,text);
create function public.save_guild_flag(
  p_primary text,p_secondary text,p_pattern text,p_symbol text,p_motto text default '',
  p_crest text default 'heater',p_shield text default 'steel',
  p_crest_item text default null,p_shield_item text default null,p_effect_item text default null
)
returns jsonb language plpgsql security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_guild_id uuid;
  v_flag jsonb;
  v_motto text:=btrim(coalesce(p_motto,''));
  v_crest text:=coalesce(p_crest,'heater');
  v_shield text:=coalesce(p_shield,'steel');
begin
  if v_uid is null then raise exception 'Não autenticado'; end if;
  if p_primary is null or p_primary not in
    ('#9f3e40','#3b638a','#34465d','#426c56','#936533','#71538c','#d0b36b','#303b4d','#d9d6cd','#263d32','#5b315f','#8b542e','#a7b6c9','#20202d','#b84e35','#477b83','#d6a84f','#6d789e')
    or p_secondary is null or p_secondary not in
    ('#9f3e40','#3b638a','#34465d','#426c56','#936533','#71538c','#d0b36b','#303b4d','#d9d6cd','#263d32','#5b315f','#8b542e','#a7b6c9','#20202d','#b84e35','#477b83','#d6a84f','#6d789e') then
    raise exception 'Cor de bandeira inválida.';
  end if;
  if p_pattern is null or p_pattern not in ('solid','horizontal','vertical','diagonal','cross','chevron','quartered','waves','diamond','stripes','sunburst') then
    raise exception 'Padrão inválido.';
  end if;
  if p_symbol is null or p_symbol not in ('⚔️','🐉','🦉','🦅','🐺','🛡️','✦','♛','🌙','🔥','🦁','🦌','🦊','🗡️','🏰','⚜️','☀️','❖','🪽','💎','🌿','👑') then
    raise exception 'Símbolo inválido.';
  end if;
  if v_crest not in ('classic','heater','kite','round','tower','pointed') then raise exception 'Formato de brasão inválido.'; end if;
  if v_shield not in ('steel','royal','obsidian','winged') then raise exception 'Acabamento do escudo inválido.'; end if;
  if char_length(v_motto)>48 then raise exception 'O lema deve ter no máximo 48 caracteres.'; end if;

  select id into v_guild_id from public.guilds where owner_id=v_uid for update;
  if not found then raise exception 'Somente o líder atual da guilda pode editar a heráldica.'; end if;

  if p_crest_item is not null and not exists (
    select 1 from public.user_cosmetics c join public.market_items i on i.id=c.item_id
    where c.user_id=v_uid and c.item_id=p_crest_item and i.category='guild' and p_crest_item in ('guild-crest-dragon','guild-crest-phoenix')
  ) then raise exception 'Você não possui este brasão especial.'; end if;
  if p_shield_item is not null and not exists (
    select 1 from public.user_cosmetics c join public.market_items i on i.id=c.item_id
    where c.user_id=v_uid and c.item_id=p_shield_item and i.category='guild' and p_shield_item in ('guild-shield-royal','guild-shield-obsidian')
  ) then raise exception 'Você não possui este escudo especial.'; end if;
  if p_effect_item is not null and not exists (
    select 1 from public.user_cosmetics c join public.market_items i on i.id=c.item_id
    where c.user_id=v_uid and c.item_id=p_effect_item and i.category='guild' and p_effect_item in ('guild-effect-aurora','guild-effect-flame','guild-effect-runes')
  ) then raise exception 'Você não possui este efeito especial.'; end if;

  v_flag:=jsonb_build_object(
    'primary',p_primary,'secondary',p_secondary,'pattern',p_pattern,'symbol',p_symbol,'motto',v_motto,
    'crest',v_crest,'shield',v_shield,
    'crestItem',coalesce(p_crest_item,''),'shieldItem',coalesce(p_shield_item,''),'effectItem',coalesce(p_effect_item,'')
  );
  update public.guilds set flag_config=v_flag where id=v_guild_id;
  return jsonb_build_object('ok',true,'flag_config',v_flag);
end
$function$;

revoke all on function public.save_guild_flag(text,text,text,text,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.save_guild_flag(text,text,text,text,text,text,text,text,text,text) to authenticated;
