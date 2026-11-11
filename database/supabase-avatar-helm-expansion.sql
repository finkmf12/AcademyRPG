-- Academia RPG · Expansão de Elmos Animados
-- Script aditivo e seguro para ampliar o catálogo do Ateliê Arcano.
-- Não remove, sobrescreve inventários de jogadores nem altera itens existentes.

insert into public.avatar_items
  (id,name,slot,rarity,icon,description,asset_key,unlock_type,price,achievement_id,active)
values
  ('helm-titan-aegis','Elmo Titânico Aegis','hat','Lendário','🛡️','Uma fortaleza de aço com crista monumental e núcleo de energia pulsante.','helm_titan_aegis','shop',18000,null,true),
  ('helm-void-reaper','Elmo Ceifador do Vazio','hat','Lendário','☠️','Chifres curvos e um anel de energia sombria que orbita a coroa.','helm_void_reaper','shop',16000,null,true),
  ('helm-phoenix-crown','Coroa da Fênix Ascendente','hat','Lendário','🔥','Plumas flamejantes se erguem da coroa e pequenas brasas dançam ao redor.','helm_phoenix_crown','shop',14500,null,true),
  ('helm-storm-dragon','Elmo do Dragão Tempestuoso','hat','Lendário','⚡','Chifres serrilhados de dragão conduzem descargas elétricas azuladas.','helm_storm_dragon','shop',15500,null,true),
  ('helm-frost-wyrm','Elmo do Wyrm Glacial','hat','Épico','❄️','Cristais de gelo formam chifres altos e uma gema congelada no centro.','helm_frost_wyrm','shop',9500,null,true),
  ('helm-shogun','Kabuto do Grande Shogun','hat','Lendário','⛩️','Um elmo samurai robusto com placas laterais e uma crista dourada crescente.','helm_shogun','shop',12500,null,true),
  ('helm-necromancer','Elmo do Necromante','hat','Épico','💀','Ossos antigos, chamas espectrais verdes e runas que brilham no escuro.','helm_necromancer','shop',8600,null,true),
  ('helm-astral-oracle','Diadema do Oráculo Astral','hat','Lendário','🔮','Cristais arcanos cercados por um anel celestial em constante órbita.','helm_astral_oracle','shop',14000,null,true),
  ('helm-deep-sea','Elmo do Abismo Profundo','hat','Épico','🌊','Armadura abissal com lentes luminosas, antena e bolhas mágicas ascendentes.','helm_deep_sea','shop',8200,null,true),
  ('helm-solar-emperor','Coroa do Imperador Solar','hat','Lendário','☀️','Uma coroa de raios dourados com um halo solar giratório.','helm_solar_emperor','shop',17000,null,true),
  ('helm-wild-hunt','Elmo da Caçada Selvagem','hat','Épico','🦌','Galhos enormes crescem como uma galhada ancestral coberta de energia verde.','helm_wild_hunt','shop',10200,null,true),
  ('helm-crimson-vanguard','Elmo da Vanguarda Carmesim','hat','Raro','🩸','Placas vermelhas, visor escuro e olhos incandescentes de guerreiro.','helm_crimson_vanguard','shop',4200,null,true),
  ('helm-prism-archon','Elmo do Arconte Prismático','hat','Épico','💎','Um prisma de cristal refrata luz azul e violeta em facetas brilhantes.','helm_prism_archon','shop',11000,null,true),
  ('helm-clockwork','Elmo do Engenheiro Real','hat','Raro','⚙️','Ligas de bronze, lentes arcanas e engrenagens laterais em movimento.','helm_clockwork','shop',5200,null,true),
  ('helm-moon-sentinel','Elmo da Sentinela Lunar','hat','Épico','🌙','Uma lua crescente prateada domina o elmo e pulsa com luz fria.','helm_moon_sentinel','shop',9900,null,true),
  ('helm-thorn-king','Coroa do Rei Espinheiro','hat','Épico','🌿','Espinhos vivos, vinhas animadas e uma gema verde no centro da testa.','helm_thorn_king','shop',11500,null,true),
  ('helm-starfire-sovereign','Coroa Soberana Estelar','hat','Lendário','✨','Uma coroa astral alada com estrelas que giram em torno do elmo.','helm_starfire_sovereign','shop',17500,null,true)
on conflict (id) do update set
  name=excluded.name,slot=excluded.slot,rarity=excluded.rarity,icon=excluded.icon,
  description=excluded.description,asset_key=excluded.asset_key,
  unlock_type=excluded.unlock_type,price=excluded.price,
  achievement_id=excluded.achievement_id,active=true;
