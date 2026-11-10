-- Academy RPG · Expansão premium do Ateliê Arcano
-- Aumenta o catálogo e libera títulos cosméticos equipáveis.
alter table public.avatar_items drop constraint if exists avatar_items_slot_check;
alter table public.avatar_items add constraint avatar_items_slot_check
  check (slot in ('hair','hat','outfit','shoulders','cloak','mask','accessory','aura','title'));

insert into public.avatar_items
  (id,name,slot,rarity,icon,description,asset_key,unlock_type,price,achievement_id)
values
  ('helm-eclipse-crown','Coroa do Eclipse','hat','Lendário','♛','Ouro negro, gemas violeta e um brilho que parece engolir a luz.','helm_eclipse_crown','shop',2800,null),
  ('helm-astral-dragon','Elmo do Dragão Astral','hat','Lendário','🐉','Um elmo cerimonial com crista celestial e reflexos azulados.','helm_astral_dragon','shop',3900,null),
  ('armor-solar-sovereign','Armadura Solar do Soberano','outfit','Lendário','☀️','Placas douradas gravadas com runas e um núcleo de luz no peito.','armor_solar_sovereign','shop',5200,null),
  ('shoulders-celestial-titan','Ombreiras do Titã Celeste','shoulders','Lendário','🛡️','Ombreiras monumentais com cristais que irradiam energia.','shoulders_celestial_titan','shop',2600,null),
  ('cloak-phoenix','Manto da Fênix Eterna','cloak','Lendário','🔥','Manto rubro com bordas incandescentes e partículas de brasas.','cloak_phoenix','shop',3800,null),
  ('cloak-obsidian','Manto de Ónix Rúnico','cloak','Lendário','🌑','Tecido negro com veios metálicos e inscrições arcanas.','cloak_obsidian','shop',2450,null),
  ('accessory-astral-core','Núcleo Astral','accessory','Lendário','💠','Um cristal flutuante que ilumina todo o equipamento ao redor.','accessory_astral_core','shop',3100,null),
  ('aura-solar-ascendant','Aura do Sol Ascendente','aura','Lendário','☀️','Um halo dourado pulsante envolve o personagem com luz intensa.','aura_solar_ascendant','shop',5000,null),
  ('aura-void-emperor','Aura do Imperador do Vazio','aura','Lendário','🌌','Energia violeta profunda, anéis orbitais e brilho escuro ao redor do corpo.','aura_void_emperor','shop',6500,null),
  ('aura-phoenix','Aura da Fênix Eterna','aura','Lendário','🔥','Chamas douradas e rubras sobem pelo personagem em pulsos de luz.','aura_phoenix','shop',5500,null),
  ('aura-arcane-supreme','Aura Arcana Suprema','aura','Lendário','✨','Uma aura azul-celeste com runas luminosas e pulsação mágica.','aura_arcane_supreme','shop',7200,null),
  ('title-living-legend','Lenda Viva','title','Épico','✦','Título metálico com textura de aço e um brilho dourado contínuo.','title_living_legend','shop',2400,null),
  ('title-celestial-sovereign','Soberano Celestial','title','Lendário','♛','Uma insígnia real com acabamento dourado e luz celestial.','title_celestial_sovereign','shop',4200,null),
  ('title-flame-herald','Arauto das Chamas','title','Lendário','🔥','Letras com textura de metal rubro e reflexos de fogo.','title_flame_herald','shop',3300,null),
  ('title-void-warden','Guardião do Vazio','title','Lendário','☾','Placa violeta escura com brilho espectral nas bordas.','title_void_warden','shop',3800,null),
  ('title-rune-master','Mestre das Runas','title','Épico','ᚱ','Inscrições rúnicas com acabamento prateado e luz azul.','title_rune_master','shop',2600,null),
  ('title-chronicle-keeper','Guardião das Crônicas','title','Lendário','📜','Título antigo com textura de pergaminho, filigrana dourada e brilho.','title_chronicle_keeper','shop',5000,null)
on conflict (id) do update set
  name=excluded.name,slot=excluded.slot,rarity=excluded.rarity,icon=excluded.icon,
  description=excluded.description,asset_key=excluded.asset_key,
  unlock_type=excluded.unlock_type,price=excluded.price,
  achievement_id=excluded.achievement_id,active=true;
