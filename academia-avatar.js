// Academy RPG · Ateliê Arcano
// Avatares vetoriais em camadas; itens e aparência sincronizados pelo Supabase.
(() => {
  'use strict';
  const C=()=>window.AcademiaCtx, $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const S={catalog:[],owned:[],appearance:{},balance:0,playerClass:'mago',tab:'shop',filter:'all',previewId:null,guest:false,busy:false,error:null};
  const SLOTS=[
    ['all','Todos'],['nameColor','Cores neon'],['hair','Cabelos'],['hat','Chapéus e elmos'],['outfit','Armaduras'],
    ['shoulders','Ombreiras'],['cloak','Capas'],['mask','Máscaras'],['wings','Asas'],['accessory','Acessórios'],['weapon','Armas'],
    ['aura','Auras'],['pet','Pets'],['title','Títulos']
  ];
  const SLOT_NAME={nameColor:'Cor do nome',hair:'Cabelo',hat:'Chapéu / elmo',outfit:'Armadura',shoulders:'Ombreiras',cloak:'Capa',mask:'Máscara',accessory:'Acessório',weapon:'Arma',aura:'Aura',pet:'Pet companheiro',title:'Título'};
  const SLOT_ICON={all:'✦',nameColor:'✧',hair:'✂',hat:'♛',outfit:'⚔',shoulders:'🛡',cloak:'◈',mask:'◉',accessory:'✧',weapon:'⚔',aura:'☼',pet:'🐉',title:'♕'};
  const ACH_NAME={
    primeiro:'Primeiro passo',sequencia:'Sequência de fogo',gabarito:'Gabarito',
    explorador:'Explorador',simulado:'Veterano',nivel5:'Nível 5',
    dedicado:'Dedicado',colecionador:'Colecionador'
  };
  const RARITY={
    'Comum':'common','Incomum':'uncommon','Raro':'rare','Épico':'epic','Lendário':'legendary'
  };
  const PALETTE={
    guerreiro:{coat:'#9c5145',trim:'#e3bd7a',dark:'#59332f'},
    mago:{coat:'#6656a2',trim:'#d5b5f0',dark:'#302b59'},
    arqueiro:{coat:'#527c61',trim:'#d4c58b',dark:'#2a4a3b'},
    assassino:{coat:'#52677d',trim:'#c2a8d5',dark:'#26364d'}
  };
  function item(id){return S.catalog.find(x=>x.id===id);}
  function nameColorClass(id){return ({'name-neon-cyan':'arc-name-neon-cyan','name-neon-pink':'arc-name-neon-pink','name-neon-purple':'arc-name-neon-purple','name-neon-green':'arc-name-neon-green','name-neon-gold':'arc-name-neon-gold','name-neon-red':'arc-name-neon-red','name-neon-orange':'arc-name-neon-orange','name-neon-ice':'arc-name-neon-ice','name-neon-lime':'arc-name-neon-lime','name-neon-rainbow':'arc-name-neon-rainbow','name-neon-white':'arc-name-neon-white','name-neon-magenta':'arc-name-neon-magenta'})[id]||'';}
  function nameMarkup(name,appearance,variant){const id=appearance?.nameColor||'';const cls=nameColorClass(id);return '<span class="'+cls+'">'+esc(name)+'</span>';}
  function owns(id){return S.owned.some(x=>x.item_id===id);}
  function equipped(id){return Object.values(S.appearance||{}).includes(id);}
  function getPreviewAppearance(){
    const out=Object.assign({},S.appearance||{});
    const x=item(S.previewId);
    if(x)out[x.slot]=x.id;
    return out;
  }
  function render(appearance,variant,playerClass){
    const a=appearance||{}, p=PALETTE[playerClass]||PALETTE.mago;
    const svgStyle=variant==='mini'?'width:36px;height:40px;'
      :variant==='rank'?'width:43px;height:47px;'
      :variant==='item'?'width:100%;height:100%;'
      :variant==='profile'?'width:100%;height:100%;'
      :'width:100%;max-width:260px;height:260px;';
    const id=slot=>a[slot]||'';
    const hair=id('hair'),hat=id('hat'),outfit=id('outfit'),shoulders=id('shoulders'),
      cloak=id('cloak'),mask=id('mask'),accessory=id('accessory'),weapon=id('weapon'),aura=id('aura'),pet=id('pet');
    const auraColors={
      'aura-ember':'#ff873d','aura-celestial':'#8bdcff','aura-dedication':'#f5d98b',
      'aura-solar-ascendant':'#ffd04b','aura-void-emperor':'#bd78ff',
      'aura-phoenix':'#ff603e','aura-arcane-supreme':'#64e4ff','aura-frost':'#8feaff','aura-thunder':'#46d9ff','aura-emerald':'#4dffad','aura-bloodmoon':'#ff416c','aura-nebula':'#bd72ff','aura-holyfire':'#ffe27a','aura-voidstorm':'#a64cff','aura-prismatic':'#ff8ee8'
    };
    const auraColor=auraColors[aura]||'';
    let gearGlowColor='';
    if(hat==='helm-eclipse-crown'||outfit==='armor-solar-sovereign'||shoulders==='shoulders-celestial-titan')gearGlowColor='#ffd36b';
    if(hat==='helm-astral-dragon'||accessory==='accessory-astral-core')gearGlowColor='#73e5ff';
    if(weapon==='weapon-red-plasma-saber')gearGlowColor='#ff293d';
    if(shoulders.startsWith('shoulders-')&&['shoulders-celestial-regent','shoulders-void-colossus','shoulders-sunforge'].includes(shoulders))gearGlowColor='#ffd45c';
    if(outfit==='armor-crystal-knight')gearGlowColor='#83eaff';
    if(outfit==='armor-storm-paladin')gearGlowColor='#a9d7ff';
    if(outfit==='armor-emerald-warden')gearGlowColor='#60f0b4';
    if(outfit==='armor-royal-gold')gearGlowColor='#ffd36b';
    if(hat==='helm-celestial-guardian')gearGlowColor='#fff0b0';
    if(hat==='helm-obsidian-crown')gearGlowColor='#c38aff';
    if(hat==='helm-dragon-emperor')gearGlowColor='#ff8c58';
    if(hat==='helm-rune-knight')gearGlowColor='#76eaff';
    if(cloak==='cloak-phoenix')gearGlowColor='#ff754b';
    if(accessory.startsWith('wings-')&&['wings-ember-titan','wings-crystal-seraph','wings-nebula-emperor','wings-abyssal-flame'].includes(accessory))gearGlowColor=accessory==='wings-nebula-emperor'?'#b88cff':accessory==='wings-abyssal-flame'?'#ff5865':accessory==='wings-ember-titan'?'#ff9a44':'#9deaff';
    const glowColor=auraColor||gearGlowColor;
    const auraFilterId='arcAuraGlow-'+(aura||hat||outfit||shoulders||cloak||accessory||'none');
    const glowFilter=glowColor?' filter="url(#'+auraFilterId+')"':'';
    let back='',body='',head='',front='';

    // 1. Auras: halo, pulsação, partículas e luz projetada sobre o personagem.
    if(auraColor){
      back+='<circle cx="100" cy="116" r="86" fill="'+auraColor+'" opacity=".16"><animate attributeName="r" values="76;96;76" dur="3.2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".10;.25;.10" dur="3.2s" repeatCount="indefinite"/></circle>';
      back+='<circle cx="100" cy="116" r="96" fill="none" stroke="'+auraColor+'" stroke-width="5" opacity=".88" stroke-dasharray="7 8"><animate attributeName="stroke-dashoffset" values="0;60" dur="8s" repeatCount="indefinite"/></circle>';
      back+='<circle cx="100" cy="116" r="106" fill="none" stroke="'+auraColor+'" stroke-width="2" opacity=".52" stroke-dasharray="2 11"><animate attributeName="stroke-dashoffset" values="40;0" dur="6s" repeatCount="indefinite"/></circle>';
      back+='<path d="M26 83 Q100 -10 174 83" fill="none" stroke="'+auraColor+'" stroke-width="3" opacity=".9"/>';
      back+='<g fill="'+auraColor+'"><circle cx="25" cy="122" r="3"><animate attributeName="cy" values="130;72;130" dur="3.4s" repeatCount="indefinite"/></circle><circle cx="175" cy="145" r="3"><animate attributeName="cy" values="150;82;150" dur="4s" repeatCount="indefinite"/></circle><circle cx="48" cy="48" r="2.5"><animate attributeName="opacity" values=".25;1;.25" dur="2.2s" repeatCount="indefinite"/></circle><circle cx="152" cy="54" r="2.5"><animate attributeName="opacity" values="1;.2;1" dur="2.8s" repeatCount="indefinite"/></circle></g>';
      if(aura==='aura-phoenix'||aura==='aura-solar-ascendant')
        back+='<path d="M47 183 Q26 151 48 123 Q40 151 64 157 Q51 126 77 99 Q68 143 94 152 M153 183 Q174 151 152 123 Q160 151 136 157 Q149 126 123 99 Q132 143 106 152" fill="none" stroke="'+auraColor+'" stroke-width="6" stroke-linecap="round" opacity=".75"><animate attributeName="opacity" values=".35;.9;.35" dur="2.1s" repeatCount="indefinite"/></path>';
      if(aura==='aura-void-emperor')
        back+='<path d="M100 11 L106 29 L125 31 L110 43 L114 62 L100 51 L86 62 L90 43 L75 31 L94 29Z" fill="'+auraColor+'" opacity=".85"/>';
      if(aura==='aura-arcane-supreme')
        back+='<path d="M38 73 l5 10 11 2-9 7 2 12-9-7-10 7 3-12-10-7 12-2Z M160 73 l5 10 11 2-9 7 2 12-9-7-10 7 3-12-10-7 12-2Z" fill="'+auraColor+'"/>';
      if(aura==='aura-frost')
        back+='<g fill="none" stroke="'+auraColor+'" stroke-width="3"><path d="M100 18 V54 M84 27 L116 45 M116 27 L84 45 M23 111 L53 111 M31 96 L45 126 M45 96 L31 126 M147 111 L177 111 M155 96 L169 126 M169 96 L155 126"/><circle cx="100" cy="116" r="112" stroke-dasharray="2 13"/></g>';
      if(aura==='aura-thunder'||aura==='aura-voidstorm')
        back+='<g fill="none" stroke="'+auraColor+'" stroke-width="4" stroke-linecap="round"><path d="M31 70 L48 86 L39 101 L59 115 M169 70 L152 86 L161 101 L141 115 M72 25 L86 43 L78 57 M128 25 L114 43 L122 57"><animate attributeName="opacity" values=".25;1;.25" dur=".8s" repeatCount="indefinite"/></path></g>';
      if(aura==='aura-emerald')
        back+='<g fill="none" stroke="'+auraColor+'" stroke-width="3"><path d="M42 156 Q22 126 47 105 Q66 127 42 156 M158 156 Q178 126 153 105 Q134 127 158 156 M100 20 Q76 42 100 63 Q124 42 100 20Z"/><circle cx="100" cy="116" r="104" stroke-dasharray="4 10"/></g>';
      if(aura==='aura-bloodmoon'||aura==='aura-nebula')
        back+='<circle cx="100" cy="116" r="76" fill="none" stroke="'+auraColor+'" stroke-width="8" stroke-dasharray="48 13" opacity=".9"><animateTransform attributeName="transform" type="rotate" from="0 100 116" to="360 100 116" dur="12s" repeatCount="indefinite"/></circle><circle cx="100" cy="116" r="58" fill="none" stroke="'+auraColor+'" stroke-width="2" stroke-dasharray="3 8"/>';
      if(aura==='aura-holyfire')
        back+='<path d="M38 178 Q23 145 50 118 Q46 149 71 151 Q61 111 100 72 Q139 111 129 151 Q154 149 150 118 Q177 145 162 178" fill="none" stroke="'+auraColor+'" stroke-width="7" stroke-linecap="round" opacity=".8"><animate attributeName="opacity" values=".35;1;.35" dur="1.7s" repeatCount="indefinite"/></path>';
      if(aura==='aura-prismatic')
        back+='<circle cx="100" cy="116" r="90" fill="none" stroke="'+auraColor+'" stroke-width="7" stroke-dasharray="14 8"><animate attributeName="stroke-dashoffset" values="0;88" dur="5s" repeatCount="indefinite"/></circle><g fill="'+auraColor+'"><path d="M100 12 L108 30 L100 48 L92 30Z M100 184 L108 202 L100 220 L92 202Z"/><circle cx="28" cy="116" r="5"/><circle cx="172" cy="116" r="5"/></g>';
    }
    if(accessory==='wings-seraphic')back+='<g><path d="M91 139 Q43 145 13 86 Q4 45 26 24 Q35 67 68 82 Q39 39 55 7 Q89 43 96 112Z M109 139 Q157 145 187 86 Q196 45 174 24 Q165 67 132 82 Q161 39 145 7 Q111 43 104 112Z" fill="#f5e9bd" stroke="#fff6dc" stroke-width="4"/><path d="M90 126 Q38 87 26 37 M110 126 Q162 87 174 37" fill="none" stroke="#fff" stroke-width="5"/><path d="M88 134 L48 92 M112 134 L152 92" stroke="#d9b66b" stroke-width="3"/><animate attributeName="opacity" values=".88;1;.88" dur="2.4s" repeatCount="indefinite"/></g>';
    if(accessory==='wings-dragon')back+='<g><path d="M94 143 Q55 145 13 101 L25 84 L7 66 L31 62 L18 39 L52 51 L48 20 L75 48 L86 86Z M106 143 Q145 145 187 101 L175 84 L193 66 L169 62 L182 39 L148 51 L152 20 L125 48 L114 86Z" fill="#7b3b43" stroke="#f0a36c" stroke-width="4" stroke-linejoin="round"/><path d="M91 131 L28 76 L52 89 L73 105 M109 131 L172 76 L148 89 L127 105" fill="none" stroke="#ffc27c" stroke-width="3"/><path d="M20 41 L43 54 L50 29 M180 41 L157 54 L150 29" fill="none" stroke="#ffdfaa" stroke-width="3"/><animate attributeName="opacity" values=".9;1;.9" dur="1.8s" repeatCount="indefinite"/></g>';
    if(accessory==='wings-void')back+='<g><path d="M93 145 Q51 155 8 112 Q25 103 8 82 Q33 86 22 57 Q57 66 66 95 Q70 58 91 35 Q102 76 99 116Z M107 145 Q149 155 192 112 Q175 103 192 82 Q167 86 178 57 Q143 66 134 95 Q130 58 109 35 Q98 76 101 116Z" fill="#30264d" stroke="#b58aff" stroke-width="4" stroke-linejoin="round"/><path d="M91 128 Q44 102 24 68 M109 128 Q156 102 176 68" stroke="#e0c5ff" stroke-width="3" fill="none"/><circle cx="32" cy="95" r="4" fill="#cda7ff"/><circle cx="168" cy="95" r="4" fill="#cda7ff"/><animate attributeName="opacity" values=".82;1;.82" dur="2.6s" repeatCount="indefinite"/></g>';
    if(accessory==='wings-phoenix')back+='<g><path d="M94 145 Q48 145 13 103 Q24 89 12 69 Q43 73 50 43 Q73 61 85 94 Q77 51 96 13 Q112 54 104 111Z M106 145 Q152 145 187 103 Q176 89 188 69 Q157 73 150 43 Q127 61 115 94 Q123 51 104 13 Q88 54 96 111Z" fill="#e85c32" stroke="#ffd477" stroke-width="4" stroke-linejoin="round"/><path d="M90 130 Q51 94 27 77 M110 130 Q149 94 173 77" stroke="#ffe7a3" stroke-width="4" fill="none"/><path d="M91 140 Q72 118 81 96 M109 140 Q128 118 119 96" stroke="#ffb34f" stroke-width="5" fill="none"/><animate attributeName="opacity" values=".9;1;.9" dur="1.6s" repeatCount="indefinite"/></g>';
    if(accessory==='accessory-wings')
      back+='<path d="M75 144 Q28 143 17 91 Q46 93 72 124 Q44 83 53 48 Q88 69 94 126 M125 144 Q172 143 183 91 Q154 93 128 124 Q156 83 147 48 Q112 69 106 126" fill="#a5dced" fill-opacity=".65" stroke="#e2f6ff" stroke-width="4" stroke-linejoin="round"/><path d="M69 125 Q45 100 47 72 M131 125 Q155 100 153 72" fill="none" stroke="#eafaff" stroke-width="3" opacity=".85"/>';
    if(accessory==='wings-celestial-titan')back+='<g class="arc-legendary-wings"><path d="M94 148 Q48 164 5 104 Q16 94 2 66 Q35 73 37 39 Q66 54 83 91 Q68 40 91 4 Q111 44 105 113Z M106 148 Q152 164 195 104 Q184 94 198 66 Q165 73 163 39 Q134 54 117 91 Q132 40 109 4Z" fill="#f5e9c8" stroke="#fff9e8" stroke-width="4"/><path d="M91 135 Q49 95 22 66 M109 135 Q151 95 178 66" stroke="#d8b96f" stroke-width="4" fill="none"/><animateTransform attributeName="transform" type="scale" values="1 1;1.08 1.04;1 1" dur="2.8s" repeatCount="indefinite" additive="sum"/><animate attributeName="opacity" values=".82;1;.82" dur="2.1s" repeatCount="indefinite"/></g>';
    if(accessory==='wings-abyssal-king')back+='<g class="arc-legendary-wings"><path d="M94 151 Q47 163 4 112 Q23 103 8 79 Q37 80 31 45 Q67 59 82 103 Q75 55 94 13 Q111 57 105 118Z M106 151 Q153 163 196 112 Q177 103 192 79 Q163 80 169 45 Q133 59 118 103 Q125 55 106 13Z" fill="#302747" stroke="#b98cff" stroke-width="4"/><path d="M90 139 L18 80 L50 95 L76 119 M110 139 L182 80 L150 95 L124 119" fill="none" stroke="#e0c4ff" stroke-width="3"/><animateTransform attributeName="transform" type="scale" values="1 1;1.1 1.05;1 1" dur="3.1s" repeatCount="indefinite" additive="sum"/><animate attributeName="opacity" values=".78;1;.78" dur="1.8s" repeatCount="indefinite"/></g>';
    if(accessory==='wings-thunder-emperor')back+='<g class="arc-legendary-wings"><path d="M94 150 Q48 161 5 109 L22 91 L8 69 L40 74 L37 37 L72 64 L91 105Z M106 150 Q152 161 195 109 L178 91 L192 69 L160 74 L163 37 L128 64 L109 105Z" fill="#527da9" stroke="#d9f4ff" stroke-width="4"/><path d="M87 136 L24 78 L57 93 L77 113 M113 136 L176 78 L143 93 L123 113" stroke="#e9fbff" stroke-width="4" fill="none"/><path d="M58 82 L75 92 L64 109 L87 118 M142 82 L125 92 L136 109 L113 118" stroke="#8deaff" stroke-width="5" fill="none"><animate attributeName="opacity" values=".35;1;.35" dur=".9s" repeatCount="indefinite"/></path><animateTransform attributeName="transform" type="scale" values="1 1;1.09 1.04;1 1" dur="2.5s" repeatCount="indefinite" additive="sum"/></g>';
    if(accessory==='wings-blood-moon')back+='<g class="arc-legendary-wings"><path d="M94 151 Q48 163 4 108 Q22 99 8 73 Q37 79 34 43 Q67 60 83 103 Q76 56 94 12 Q111 58 105 117Z M106 151 Q152 163 196 108 Q178 99 192 73 Q163 79 166 43 Q133 60 117 103 Q124 56 106 12Z" fill="#762f4a" stroke="#ff9eae" stroke-width="4"/><path d="M91 137 Q52 97 23 68 M109 137 Q148 97 177 68" stroke="#ffd1d8" stroke-width="3" fill="none"/><animateTransform attributeName="transform" type="scale" values="1 1;1.1 1.04;1 1" dur="2.3s" repeatCount="indefinite" additive="sum"/><animate attributeName="opacity" values=".8;1;.8" dur="1.5s" repeatCount="indefinite"/></g>';
    if(accessory==='wings-starlight')back+='<g class="arc-legendary-wings"><path d="M94 150 Q48 164 5 108 Q19 95 5 70 Q39 76 37 39 Q67 57 84 101 Q72 50 94 7 Q111 52 105 116Z M106 150 Q152 164 195 108 Q181 95 195 70 Q161 76 163 39 Q133 57 116 101 Q128 50 106 7Z" fill="#b9b9f0" stroke="#fff" stroke-width="4"/><path d="M91 137 Q52 95 23 65 M109 137 Q148 95 177 65" stroke="#fff" stroke-width="4" fill="none"/><g fill="#fff"><circle cx="40" cy="91" r="3"><animate attributeName="opacity" values=".2;1;.2" dur="1.7s" repeatCount="indefinite"/></circle><circle cx="160" cy="91" r="3"><animate attributeName="opacity" values="1;.2;1" dur="1.7s" repeatCount="indefinite"/></circle></g><animateTransform attributeName="transform" type="scale" values="1 1;1.08 1.05;1 1" dur="3s" repeatCount="indefinite" additive="sum"/></g>';

    const newWingFinishes={
      'wings-ember-titan':['#d9572f','#ffd77e'],'wings-crystal-seraph':['#91d5ee','#f2ffff'],
      'wings-nebula-emperor':['#604a9c','#dfbaff'],'wings-abyssal-flame':['#612b49','#ff8795']
    };
    const wingFinish=newWingFinishes[accessory];
    if(wingFinish){
      back+='<g class="arc-legendary-wings"><path d="M94 151 Q51 155 5 109 Q22 99 7 72 Q40 79 35 39 Q70 58 84 101 Q72 49 94 5 Q112 52 105 116Z M106 151 Q149 155 195 109 Q178 99 193 72 Q160 79 165 39 Q130 58 116 101 Q128 49 106 5Z" fill="'+wingFinish[0]+'" stroke="'+wingFinish[1]+'" stroke-width="5" stroke-linejoin="round"/>'+
       '<path d="M90 139 Q48 99 22 65 M110 139 Q152 99 178 65" stroke="'+wingFinish[1]+'" stroke-width="4" fill="none"/>'+
       '<path d="M91 145 L60 110 L78 118 L95 137 M109 145 L140 110 L122 118 L105 137" fill="none" stroke="#fff" stroke-width="3" opacity=".72"/>'+
       '<animateTransform attributeName="transform" type="scale" values="1 1;1.1 1.05;1 1" dur="2.7s" repeatCount="indefinite" additive="sum"/>'+
       '<animate attributeName="opacity" values=".78;1;.78" dur="1.8s" repeatCount="indefinite"/></g>';
    }

    if(cloak){
      const cloakFinishes={'cloak-forest':['#456c59','#b5d9a0'],'cloak-night':['#51416f','#c6a5ff'],'cloak-veteran':['#783b48','#e8bd7a'],'cloak-phoenix':['#8f302f','#ffbd62'],'cloak-obsidian':['#252b42','#9d8ad0'],'cloak-stars':['#283a66','#f4e1a5'],'cloak-frostfall':['#356d91','#c8f7ff'],'cloak-royal-crimson':['#842d42','#ffd17b'],'cloak-nebula':['#38275f','#e1b4ff'],'cloak-voidflame':['#241c38','#d28aff'],'cloak-storm':['#244f7c','#8cecff'],'cloak-emerald':['#225b48','#9bffcb'],'cloak-solar':['#87602b','#fff0a0'],'cloak-bloodmoon':['#702d4c','#ff9ec2']};
      const cloakFinish=cloakFinishes[cloak]||['#334c72','#d6bd85'];
      const cloakColor=cloakFinish[0];
      back+='<path d="M74 116 Q100 103 126 116 L158 205 Q100 230 42 205Z" fill="'+cloakColor+'" stroke="'+cloakFinish[1]+'" stroke-width="4" stroke-linejoin="round"/><path d="M85 122 L100 212 L115 122" fill="none" stroke="'+cloakFinish[1]+'" stroke-opacity=".55" stroke-width="4"/>');
      if(cloak==='cloak-phoenix')
        back+='<path d="M55 173 Q72 145 89 170 Q100 183 111 165 Q130 144 145 174" fill="none" stroke="#ffcb70" stroke-width="4"/><path d="M71 190 Q84 174 100 191 Q116 174 129 190" fill="none" stroke="#ff7c48" stroke-width="3"/>';
      if(cloak==='cloak-obsidian')
        back+='<path d="M62 150 L100 169 L138 150 M57 177 L100 198 L143 177 M78 129 L100 145 L122 129" fill="none" stroke="#b7a6ec" stroke-width="3" opacity=".78"/>';
      if(cloak==='cloak-stars')
        back+='<g fill="#f4e1a5"><path d="M63 157 l4 8 9 2-9 4-4 9-3-9-9-4 9-2z"/><path d="M137 178 l3 6 7 2-7 3-3 7-3-7-7-3 7-2z"/><circle cx="78" cy="195" r="2.5"/><circle cx="124" cy="147" r="2.5"/></g>';
      if(cloak==='cloak-veteran')
        back+='<path d="M73 125 L100 146 L127 125 L119 190 L100 214 L81 190Z" fill="#a44e4b" stroke="#e8bd7a" stroke-width="3"/>';
      if(['cloak-frostfall','cloak-storm'].includes(cloak))back+='<path d="M58 150 L100 171 L142 150 M66 179 L100 197 L134 179" fill="none" stroke="#e9fbff" stroke-width="3" opacity=".85"/>';
      if(['cloak-nebula','cloak-solar','cloak-bloodmoon'].includes(cloak))back+='<g fill="'+cloakFinish[1]+'"><circle cx="66" cy="166" r="3"><animate attributeName="opacity" values=".2;1;.2" dur="1.7s" repeatCount="indefinite"/></circle><circle cx="134" cy="185" r="3"><animate attributeName="opacity" values="1;.2;1" dur="2s" repeatCount="indefinite"/></circle><path d="M100 147 l4 8 9 2-9 4-4 8-4-8-9-4 9-2Z"/></g>';
    }

    // 2. Corpo e equipamento principal.
    body+='<path d="M78 178 L75 207 Q87 220 99 211 L100 182 M122 178 L125 207 Q113 220 101 211 L100 182" fill="#34415a" stroke="#252c3c" stroke-width="4"/><path d="M69 204 Q84 199 99 207 L99 221 Q81 228 64 216Z M101 207 Q116 199 131 204 L136 216 Q119 228 101 221Z" fill="#493a35" stroke="#242332" stroke-width="4"/><path d="M72 215 L98 215 M102 215 L128 215" stroke="#d5b77b" stroke-width="3"/>';
    // Braços ficam atrás do peitoral.
    body+='<path d="M70 126 Q48 133 39 170 L52 180 Q68 169 79 146 M130 126 Q152 133 161 170 L148 180 Q132 169 121 146" fill="'+p.coat+'" stroke="#30283a" stroke-width="5" stroke-linejoin="round"/><path d="M43 166 Q53 160 62 168 L60 184 Q49 191 39 180Z M157 166 Q147 160 138 168 L140 184 Q151 191 161 180Z" fill="#efc69d" stroke="#30283a" stroke-width="3"/>';
    let coat=p.coat,trim=p.trim,dark=p.dark;
    if(outfit==='outfit-scholar'){coat='#55718b';trim='#c5d6df';dark='#293f57';}
    if(outfit==='outfit-ranger'){coat='#557958';trim='#d4bd7f';dark='#344a37';}
    if(outfit==='outfit-royal'){coat='#263d78';trim='#f0d18b';dark='#18264d';}
    if(outfit==='outfit-arcane'){coat='#634b8d';trim='#d9b8f0';dark='#342650';}
    if(outfit==='outfit-perfect'){coat='#76559b';trim='#f2d991';dark='#382952';}
    if(outfit==='armor-logic'){coat='#60717b';trim='#a9d6df';dark='#2d3d4a';}
    if(outfit==='armor-colossus'){coat='#566b80';trim='#e2c47f';dark='#26394e';}
    if(outfit==='armor-dragon'){coat='#873f3c';trim='#f0ad70';dark='#452735';}
    if(outfit==='armor-paladin'){coat='#d0c7ae';trim='#e5bd62';dark='#55576a';}
    if(outfit==='armor-shadow'){coat='#303c55';trim='#b1a1d4';dark='#171f31';}
    if(outfit==='armor-solar-sovereign'){coat='#a8792e';trim='#ffe18a';dark='#553a19';}
    body+='<path d="M67 126 Q100 108 133 126 L145 190 Q100 211 55 190Z" fill="'+coat+'" stroke="'+dark+'" stroke-width="5" stroke-linejoin="round"/><path d="M76 126 Q100 142 124 126 L113 162 L100 178 L87 162Z" fill="'+trim+'" opacity=".96"/><path d="M100 144 L100 191" stroke="'+dark+'" stroke-width="4"/><path d="M61 175 Q100 187 139 175 L143 190 Q100 202 57 190Z" fill="'+dark+'" stroke="'+trim+'" stroke-width="3"/><circle cx="100" cy="184" r="6" fill="'+trim+'" stroke="'+dark+'" stroke-width="2"/>';
    if(outfit==='outfit-royal'||outfit==='outfit-perfect'||outfit==='armor-logic')
      body+='<path d="M76 146 L88 159 L100 147 L112 159 L124 146" fill="none" stroke="'+trim+'" stroke-width="4"/>';
    if(outfit==='armor-colossus')
      body+='<path d="M68 127 L54 140 L61 176 L77 185 L89 160 L100 171 L111 160 L123 185 L139 176 L146 140 L132 127 L116 136 L100 126 L84 136Z" fill="#687e94" stroke="#202e43" stroke-width="5" stroke-linejoin="round"/><path d="M82 139 L100 149 L118 139 L112 166 L100 178 L88 166Z" fill="#d7bc77" stroke="#34445a" stroke-width="3"/><path d="M76 179 L124 179 M82 191 L118 191" stroke="#e1c78a" stroke-width="4"/><circle cx="100" cy="153" r="7" fill="#8de0ed" stroke="#24364c" stroke-width="3"/>';
    if(outfit==='armor-dragon')
      body+='<path d="M68 127 L55 141 L64 181 L100 203 L136 181 L145 141 L132 127 L116 137 L100 126 L84 137Z" fill="#a94c3f" stroke="#48283a" stroke-width="5"/><path d="M80 138 L100 151 L120 138 L112 176 L100 190 L88 176Z" fill="#e4a05f" stroke="#63313a" stroke-width="3"/><path d="M64 154 L48 169 L67 178 M136 154 L152 169 L133 178" fill="none" stroke="#f2bd79" stroke-width="6"/><path d="M75 185 L85 200 L100 211 L115 200 L125 185" fill="none" stroke="#f0bd76" stroke-width="4"/>';
    if(outfit==='armor-paladin')
      body+='<path d="M68 127 L53 141 L62 181 L100 205 L138 181 L147 141 L132 127 L115 137 L100 126 L85 137Z" fill="#d8d4c4" stroke="#68677a" stroke-width="5"/><path d="M81 139 L100 151 L119 139 L111 177 L100 190 L89 177Z" fill="#e8c66e" stroke="#777080" stroke-width="3"/><path d="M100 144 L100 194 M67 176 L133 176" stroke="#fff0bb" stroke-width="4"/><path d="M84 198 L100 216 L116 198" fill="#b69a62" stroke="#5a5260" stroke-width="3"/>';
    if(outfit==='armor-shadow')
      body+='<path d="M67 127 L52 141 L61 183 L100 205 L139 183 L148 141 L133 127 L115 138 L100 126 L85 138Z" fill="#303d5b" stroke="#151c30" stroke-width="5"/><path d="M82 141 L100 153 L118 141 L111 179 L100 191 L89 179Z" fill="#71628d" stroke="#c2a7df" stroke-width="3"/><path d="M69 165 L131 165 M75 184 L125 184" stroke="#bba3d8" stroke-width="3"/>';
    if(outfit==='armor-solar-sovereign')
      body+='<path d="M68 127 L53 141 L62 181 L100 205 L138 181 L147 141 L132 127 L115 137 L100 126 L85 137Z" fill="#c18b35" stroke="#573817" stroke-width="6"/><path d="M80 139 L100 151 L120 139 L112 177 L100 191 L88 177Z" fill="#ffe18a" stroke="#8d6427" stroke-width="4"/><path d="M100 136 L100 194 M66 174 L134 174" stroke="#fff3b3" stroke-width="4"/><circle cx="100" cy="157" r="11" fill="#fff7bd" stroke="#f5bd43" stroke-width="5"/><path d="M100 137 L105 149 L118 151 L108 160 L111 173 L100 166 L89 173 L92 160 L82 151 L95 149Z" fill="#ffb42f"/><path d="M73 191 L85 202 L100 213 L115 202 L127 191" fill="none" stroke="#ffe18a" stroke-width="5"/>';

    if(outfit==='armor-crystal-knight')body+='<path d="M68 127 L53 141 L62 181 L100 205 L138 181 L147 141 L132 127 L115 137 L100 126 L85 137Z" fill="#b9e8f2" stroke="#4b7d9a" stroke-width="6"/><path d="M81 139 L100 151 L119 139 L111 177 L100 191 L89 177Z" fill="#efffff" stroke="#8bd9ed" stroke-width="4"/><path d="M100 132 L100 194 M66 174 L134 174" stroke="#fff" stroke-width="4"/><circle cx="100" cy="157" r="10" fill="#65eaff" stroke="#fff" stroke-width="4"/><path d="M73 191 L85 202 L100 213 L115 202 L127 191" fill="none" stroke="#d5fbff" stroke-width="5"/>';
    if(outfit==='armor-storm-paladin')body+='<path d="M68 127 L53 141 L62 181 L100 205 L138 181 L147 141 L132 127 L115 137 L100 126 L85 137Z" fill="#d5d9e5" stroke="#5b6681" stroke-width="6"/><path d="M80 139 L100 151 L120 139 L112 177 L100 191 L88 177Z" fill="#6c85b5" stroke="#d9e7ff" stroke-width="4"/><path d="M100 133 L100 194 M66 174 L134 174" stroke="#fff" stroke-width="4"/><path d="M100 139 L106 153 L121 155 L109 165 L112 180 L100 171 L88 180 L91 165 L79 155 L94 153Z" fill="#f5df8a" stroke="#fff2bf" stroke-width="2"/>';
    if(outfit==='armor-emerald-warden')body+='<path d="M68 127 L53 141 L62 181 L100 205 L138 181 L147 141 L132 127 L115 137 L100 126 L85 137Z" fill="#286c58" stroke="#173f3a" stroke-width="6"/><path d="M80 139 L100 151 L120 139 L112 177 L100 191 L88 177Z" fill="#9bd6a1" stroke="#d8ffd2" stroke-width="4"/><path d="M100 133 L100 194 M66 174 L134 174" stroke="#d5f8bd" stroke-width="4"/><path d="M100 142 L113 157 L100 176 L87 157Z" fill="#6ef0b1" stroke="#e0ffe8" stroke-width="3"/>';
    if(outfit==='armor-royal-gold')body+='<path d="M68 127 L53 141 L62 181 L100 205 L138 181 L147 141 L132 127 L115 137 L100 126 L85 137Z" fill="#8c642b" stroke="#f3d27c" stroke-width="6"/><path d="M80 139 L100 151 L120 139 L112 177 L100 191 L88 177Z" fill="#f4d77c" stroke="#fff1ba" stroke-width="4"/><path d="M100 133 L100 194 M66 174 L134 174" stroke="#fff0b1" stroke-width="4"/><circle cx="100" cy="157" r="10" fill="#fff6ca" stroke="#d59b36" stroke-width="4"/><path d="M73 191 L85 202 L100 213 L115 202 L127 191" fill="none" stroke="#f8e5a1" stroke-width="5"/>';
    if(outfit==='armor-abyssal-emperor')body+='<path d="M68 127 L52 140 L61 184 L100 207 L139 184 L148 140 L132 127 L115 138 L100 125 L85 138Z" fill="#25223c" stroke="#9e79d5" stroke-width="6"/><path d="M80 139 L100 151 L120 139 L112 178 L100 192 L88 178Z" fill="#55416f" stroke="#d6b7ff" stroke-width="4"/><path d="M100 132 L100 195 M65 174 L135 174" stroke="#c5a2ff" stroke-width="4"/><path d="M100 143 L112 157 L100 177 L88 157Z" fill="#d78bff" stroke="#fff" stroke-width="3"><animate attributeName="opacity" values=".5;1;.5" dur="1.6s" repeatCount="indefinite"/></path>';
    if(outfit==='armor-void-dragon')body+='<path d="M68 127 L52 141 L62 184 L100 207 L138 184 L148 141 L132 127 L115 137 L100 125 L85 137Z" fill="#26364a" stroke="#61c8d9" stroke-width="6"/><path d="M80 139 L100 151 L120 139 L112 178 L100 192 L88 178Z" fill="#376d78" stroke="#a8f3ef" stroke-width="4"/><path d="M100 132 L100 195 M65 174 L135 174" stroke="#9ff8ec" stroke-width="4"/><path d="M70 132 L55 119 L78 126 M130 132 L145 119 L122 126" stroke="#8ee9df" stroke-width="6" fill="none"/><path d="M100 143 L111 157 L100 176 L89 157Z" fill="#8ffff0" stroke="#fff" stroke-width="3"/>';
    if(outfit==='armor-crimson-warlord')body+='<path d="M68 127 L52 141 L62 184 L100 207 L138 184 L148 141 L132 127 L115 137 L100 125 L85 137Z" fill="#762f3b" stroke="#e6a16f" stroke-width="6"/><path d="M80 139 L100 151 L120 139 L112 178 L100 192 L88 178Z" fill="#b74b4b" stroke="#ffd09a" stroke-width="4"/><path d="M100 132 L100 195 M65 174 L135 174" stroke="#ffcf9a" stroke-width="4"/><path d="M69 131 L53 113 L78 126 M131 131 L147 113 L122 126" stroke="#f2b07d" stroke-width="6" fill="none"/><circle cx="100" cy="157" r="9" fill="#ffb46e" stroke="#fff0c8" stroke-width="3"/>';
    if(outfit==='armor-frost-warden')body+='<path d="M68 127 L52 141 L62 184 L100 207 L138 184 L148 141 L132 127 L115 137 L100 125 L85 137Z" fill="#9ac9dc" stroke="#e6fbff" stroke-width="6"/><path d="M80 139 L100 151 L120 139 L112 178 L100 192 L88 178Z" fill="#e8fbff" stroke="#6ca9c6" stroke-width="4"/><path d="M100 132 L100 195 M65 174 L135 174" stroke="#fff" stroke-width="4"/><path d="M100 139 L106 153 L121 155 L109 165 L112 180 L100 171 L88 180 L91 165 L79 155 L94 153Z" fill="#62d8f4" stroke="#fff" stroke-width="2"/>';
    if(outfit==='armor-nature-guardian')body+='<path d="M68 127 L52 141 L62 184 L100 207 L138 184 L148 141 L132 127 L115 137 L100 125 L85 137Z" fill="#315e47" stroke="#9dc77c" stroke-width="6"/><path d="M80 139 L100 151 L120 139 L112 178 L100 192 L88 178Z" fill="#668e56" stroke="#d5e9a4" stroke-width="4"/><path d="M100 132 L100 195 M65 174 L135 174" stroke="#c6e7a0" stroke-width="4"/><path d="M100 140 Q82 153 100 178 Q118 153 100 140Z" fill="#b5e58a" stroke="#f2ffd0" stroke-width="3"/>';
    if(outfit==='armor-astral-archon')body+='<path d="M68 127 L52 141 L62 184 L100 207 L138 184 L148 141 L132 127 L115 137 L100 125 L85 137Z" fill="#343b70" stroke="#a8b5ff" stroke-width="6"/><path d="M80 139 L100 151 L120 139 L112 178 L100 192 L88 178Z" fill="#626ec1" stroke="#e1e6ff" stroke-width="4"/><path d="M100 132 L100 195 M65 174 L135 174" stroke="#e1e6ff" stroke-width="4"/><path d="M100 138 L106 151 L120 155 L109 165 L112 180 L100 171 L88 180 L91 165 L80 155 L94 151Z" fill="#f0dcff" stroke="#fff" stroke-width="2"/>';
    // Ombreiras aparecem DEPOIS da armadura, encaixadas nos ombros.
    if(shoulders==='shoulders-titan'||shoulders==='shoulders-dragon'||shoulders==='shoulders-paladin'||shoulders==='shoulders-celestial-titan'||shoulders==='shoulders-crystal'||shoulders==='shoulders-infernal'){
      const sc=shoulders==='shoulders-dragon'?'#a84d3e':shoulders==='shoulders-paladin'?'#d5bd7d':shoulders==='shoulders-celestial-titan'?'#526f9e':shoulders==='shoulders-crystal'?'#8bd9ed':shoulders==='shoulders-infernal'?'#803b45':'#687b91';
      const st=shoulders==='shoulders-dragon'?'#f1a16a':shoulders==='shoulders-celestial-titan'?'#a8edff':shoulders==='shoulders-crystal'?'#e8fdff':shoulders==='shoulders-infernal'?'#ff6b59':'#dce8ef';
      body+='<path d="M69 130 L48 112 L25 126 L34 157 L69 151Z M131 130 L152 112 L175 126 L166 157 L131 151Z" fill="'+sc+'" stroke="#252d3b" stroke-width="5" stroke-linejoin="round"/><path d="M34 130 L54 119 L69 136 L56 150 L39 145Z M166 130 L146 119 L131 136 L144 150 L161 145Z" fill="'+st+'" stroke="#343b4c" stroke-width="3"/><path d="M31 126 L18 107 L46 115 M169 126 L182 107 L154 115" fill="none" stroke="'+st+'" stroke-width="5" stroke-linecap="round"/>';
    }


    const shoulderFinishes={
      'shoulders-bronze-guard':['#9a6545','#f3c58a'],'shoulders-forest-ram':['#39754f','#a6e6a7'],
      'shoulders-steel-vanguard':['#52667d','#dce8f2'],'shoulders-ruby-sentinel':['#9b3344','#ffb1a7'],
      'shoulders-moon-silver':['#617d9c','#d8efff'],'shoulders-jade-temple':['#278c70','#c7ffd9'],
      'shoulders-stormbreaker':['#3c6c9b','#8cecff'],'shoulders-obsidian-spikes':['#292b42','#c7a2ff'],
      'shoulders-sunforge':['#a66b21','#fff0a0'],'shoulders-arcane-prism':['#674b9c','#e4d1ff'],
      'shoulders-frost-titan':['#6aabc3','#d9fbff'],'shoulders-dragon-emperor':['#973a3d','#ffd18a'],
      'shoulders-celestial-regent':['#b88a37','#fff3ac'],'shoulders-void-colossus':['#352b59','#c5a0ff']
    };
    const shoulderFinish=shoulderFinishes[shoulders];
    if(shoulderFinish){
      body+='<path d="M69 130 L46 111 L19 126 L31 159 L68 151Z M131 130 L154 111 L181 126 L169 159 L132 151Z" fill="'+shoulderFinish[0]+'" stroke="'+shoulderFinish[1]+'" stroke-width="5" stroke-linejoin="round"/>'+
        '<path d="M30 132 L50 119 L68 136 L55 151 L39 146Z M170 132 L150 119 L132 136 L145 151 L161 146Z" fill="'+shoulderFinish[1]+'" stroke="'+shoulderFinish[0]+'" stroke-width="3"/>'+
        '<path d="M27 126 L13 103 L49 115 M173 126 L187 103 L151 115" fill="none" stroke="'+shoulderFinish[1]+'" stroke-width="6" stroke-linecap="round"/>'+
        '<path d="M37 139 L52 135 L60 144 M163 139 L148 135 L140 144" fill="none" stroke="#fff" stroke-width="2.5" opacity=".8"/>';
    }

    // Cajado fica junto à mão; medalha e orbe são detalhes frontais.
    if(accessory==='accessory-staff')
      back+='<path d="M32 111 L25 218" stroke="#8b6845" stroke-width="8" stroke-linecap="round"/><path d="M25 111 Q25 96 39 93 Q53 96 53 111 Q53 126 39 129 Q25 126 25 111Z" fill="#8dd0ef" stroke="#e4d18b" stroke-width="4"/><path d="M39 96 L39 124 M28 111 L50 111" stroke="#fff" stroke-opacity=".8" stroke-width="2"/>';
    if(accessory==='accessory-orb')
      front+='<circle cx="170" cy="151" r="17" fill="#7fc9ee" fill-opacity=".76" stroke="#d9e8ff" stroke-width="3"/><circle cx="164" cy="145" r="5" fill="#fff"/><path d="M153 172 Q170 181 186 170" fill="none" stroke="#d6b46b" stroke-width="3"/>';
    if(accessory==='accessory-scholar')
      front+='<circle cx="100" cy="166" r="13" fill="#d9b96d" stroke="#fff0b5" stroke-width="3"/><path d="M93 166 L99 173 L109 159" fill="none" stroke="#5b472b" stroke-width="3.5"/>';

    // 3. Cabeça: cabelo por trás, rosto grande e depois franja/olhos.
    head+='<path d="M62 77 Q48 56 60 39 Q73 17 100 20 Q128 17 140 39 Q152 57 138 79 L142 119 Q128 143 100 144 Q72 143 58 119Z" fill="#50372f" stroke="#342b34" stroke-width="4"/>';
    head+='<ellipse cx="54" cy="86" rx="10" ry="14" fill="#efc59f" stroke="#473843" stroke-width="3"/><ellipse cx="146" cy="86" rx="10" ry="14" fill="#efc59f" stroke="#473843" stroke-width="3"/><ellipse cx="100" cy="82" rx="48" ry="56" fill="#f0c69f" stroke="#473843" stroke-width="4"/>';
    let hairColor='#55382f',hairStroke='#342b34',hairLight='#9a7457';
    if(hair==='hair-silver'){hairColor='#d5d8e1';hairStroke='#737d91';hairLight='#ffffff';}
    if(hair==='hair-ember'){hairColor='#b95f39';hairStroke='#713b35';hairLight='#ffd08a';}
    if(hair==='hair-stargazer'){hairColor='#536e9b';hairStroke='#2b4268';hairLight='#c6e4ff';}
    head+='<path d="M53 83 Q46 25 100 22 Q154 25 147 83 L137 75 Q125 69 115 49 Q96 76 65 78Z" fill="'+hairColor+'" stroke="'+hairStroke+'" stroke-width="4"/><path d="M65 70 Q82 72 99 56 Q115 70 135 72" fill="none" stroke="'+hairLight+'" stroke-width="3.5" opacity=".72"/><path d="M61 82 Q55 105 65 118 M139 82 Q145 105 135 118" fill="none" stroke="'+hairColor+'" stroke-width="10" stroke-linecap="round"/>';
    head+='<ellipse cx="81" cy="88" rx="6" ry="8" fill="#2a3044"/><ellipse cx="119" cy="88" rx="6" ry="8" fill="#2a3044"/><circle cx="83" cy="85" r="2" fill="#fff"/><circle cx="121" cy="85" r="2" fill="#fff"/><path d="M94 108 Q100 114 106 108" fill="none" stroke="#a75f5a" stroke-width="3" stroke-linecap="round"/><ellipse cx="70" cy="103" rx="8" ry="4" fill="#e9928b" opacity=".5"/><ellipse cx="130" cy="103" rx="8" ry="4" fill="#e9928b" opacity=".5"/>';
    if(mask==='mask-fox')
      head+='<path d="M68 91 L59 72 L86 83 L100 78 L114 83 L141 72 L132 94 Q130 121 100 125 Q70 121 68 91Z" fill="#d28a4a" stroke="#553b37" stroke-width="4"/><path d="M88 99 L100 109 L112 99" fill="none" stroke="#fff0d1" stroke-width="5"/>';
    if(mask==='mask-raven')
      head+='<path d="M66 84 Q100 70 134 84 L128 114 Q100 128 72 114Z" fill="#344154" stroke="#1d283a" stroke-width="4"/><path d="M100 95 L116 106 L100 116 L84 106Z" fill="#a8b7c7"/>';
    if(mask==='mask-flame')
      head+='<path d="M68 87 Q100 72 132 87 L127 116 Q100 128 73 116Z" fill="#9d4a37" stroke="#f2b36d" stroke-width="4"/><path d="M100 89 Q114 104 100 119 Q86 104 100 89Z" fill="#f7d58f"/>';


    const maskFinishes={
      'mask-copper-fox':['#a95b39','#ffe0a0'],'mask-bone-guard':['#d6c8a2','#fff4cf'],'mask-bamboo-spirit':['#4f9667','#c0f6a9'],
      'mask-scarlet-cloth':['#a83248','#ffb7a9'],'mask-frost-wolf':['#527fba','#c9f5ff'],'mask-jade-dragon':['#278d75','#b1ffe0'],
      'mask-sun-warrior':['#c38c35','#fff0a5'],'mask-raven-moon':['#39465f','#c8ddff'],'mask-void-stalker':['#563b82','#d2a7ff'],
      'mask-crystal-oracle':['#69a9cd','#e0ffff'],'mask-iron-demon':['#333743','#ff6868'],'mask-storm-samurai':['#4169a0','#a6e9ff'],
      'mask-phoenix-empress':['#a93b35','#ffd47a'],'mask-celestial-judge':['#7899ad','#e2ffff'],'mask-abyss-king':['#39254e','#e4a7ff'],
      'mask-eternal-nebula':['#49356f','#ff9bde'],'mask-dragon-god':['#8d363c','#ffe08c']
    };
    const maskFinish=maskFinishes[mask];
    if(maskFinish){
      head+='<path d="M66 84 Q100 70 134 84 L128 116 Q100 132 72 116Z" fill="'+maskFinish[0]+'" stroke="'+maskFinish[1]+'" stroke-width="4"/>'+
        '<path d="M74 92 L91 98 L100 91 L109 98 L126 92 M81 112 L100 121 L119 112" fill="none" stroke="'+maskFinish[1]+'" stroke-width="3"/>'+
        '<path d="M80 102 L92 104 M108 104 L120 102" stroke="#fff" stroke-width="4" stroke-linecap="round"/>'+
        '<circle cx="100" cy="105" r="5" fill="'+maskFinish[1]+'"><animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite"/></circle>';
    }

    // 4. Chapéus e elmos: todos têm a mesma linha de encaixe no alto da cabeça.
    if(hat==='hat-apprentice')
      head+='<path d="M55 70 Q100 28 145 70 L140 85 Q100 97 60 85Z" fill="#8b684d" stroke="#493b3a" stroke-width="4"/><path d="M57 75 Q100 91 143 75" fill="none" stroke="#e0c38b" stroke-width="6"/>';
    if(hat==='hat-wizard')
      head+='<path d="M54 76 Q70 61 78 10 Q103 34 121 11 Q121 55 147 76Z" fill="#51427d" stroke="#2c294f" stroke-width="4"/><path d="M67 65 Q101 79 135 65" fill="none" stroke="#e1c47d" stroke-width="6"/><path d="M104 31 l5 10 10 2-10 4-5 10-4-10-10-4 10-2Z" fill="#f6e1a2"/>';
    if(hat==='hat-ranger')
      head+='<path d="M47 72 Q100 42 153 72 L145 87 Q100 98 55 87Z" fill="#557456" stroke="#334b3b" stroke-width="4"/><path d="M52 75 Q100 58 148 75" fill="none" stroke="#d6c38b" stroke-width="5"/>';
    if(hat==='hat-royal')
      head+='<path d="M58 75 L66 35 L88 57 L101 19 L113 57 L135 35 L143 75Z" fill="#d7b45f" stroke="#74552e" stroke-width="4"/><path d="M60 76 L141 76" stroke="#f5e2a6" stroke-width="6"/><circle cx="101" cy="45" r="7" fill="#8d5c9f" stroke="#f4d998" stroke-width="2"/>';
    if(hat==='hat-firstspark')
      head+='<path d="M59 76 Q100 41 141 76 L136 88 Q100 99 64 88Z" fill="#4f8064" stroke="#2e5443" stroke-width="4"/><path d="M99 53 l6 11 12 2-12 5-6 11-5-11-12-5 12-2Z" fill="#e9d58e"/>';
    if(hat==='horns-infernal')
      head+='<path d="M71 70 Q40 57 34 12 Q68 25 84 61 M129 70 Q160 57 166 12 Q132 25 116 61" fill="#9f3f43" stroke="#3e2635" stroke-width="8" stroke-linecap="round"/><path d="M42 22 Q60 38 70 55 M158 22 Q140 38 130 55" fill="none" stroke="#efaa86" stroke-width="4"/><path d="M57 68 Q100 84 143 68 L138 86 Q100 99 62 86Z" fill="#673a4b" stroke="#3e2635" stroke-width="4"/>';
    if(hat==='horns-ancient')
      head+='<path d="M72 70 Q24 69 14 21 Q56 26 84 60 M128 70 Q176 69 186 21 Q144 26 116 60" fill="#d7bc83" stroke="#514335" stroke-width="8" stroke-linejoin="round"/><path d="M27 30 L55 44 M173 30 L145 44" stroke="#fff0c9" stroke-width="4"/><path d="M57 70 Q100 84 143 70 L138 86 Q100 97 62 86Z" fill="#987a4d" stroke="#514335" stroke-width="4"/>';
    if(hat==='helm-berserker'||hat==='helm-dragon'||hat==='helm-paladin'||hat==='helm-shadow'){
      const helm=hat==='helm-dragon'?'#a34a3e':hat==='helm-paladin'?'#c7cbd0':hat==='helm-shadow'?'#343b56':'#687889';
      const edge=hat==='helm-dragon'?'#492536':hat==='helm-paladin'?'#596273':hat==='helm-shadow'?'#171e32':'#202b3c';
      head+='<path d="M51 87 Q43 20 100 16 Q157 20 149 87 L137 103 L63 103Z" fill="'+helm+'" stroke="'+edge+'" stroke-width="7"/>';
      if(hat==='helm-dragon')
        head+='<path d="M69 49 L51 7 L91 34 L100 0 L109 34 L149 7 L131 49" fill="#d7a05c" stroke="#572d37" stroke-width="6" stroke-linejoin="round"/><path d="M60 62 L100 78 L140 62" fill="none" stroke="#f2c47b" stroke-width="5"/>';
      if(hat==='helm-berserker')
        head+='<path d="M63 56 L39 21 L80 42 M137 56 L161 21 L120 42" fill="#9d4e42" stroke="#432d3b" stroke-width="6" stroke-linejoin="round"/><path d="M58 82 Q100 70 142 82 L137 101 L63 101Z" fill="#42536a" stroke="'+edge+'" stroke-width="4"/>';
      if(hat==='helm-paladin')
        head+='<path d="M100 17 L100 100 M59 61 L141 61" stroke="#f3d17c" stroke-width="6"/><path d="M62 81 L82 90 L100 83 L118 90 L138 81 L132 105 L68 105Z" fill="#aeb7c5" stroke="#596273" stroke-width="4"/>';
        if(hat==='helm-shadow')
        head+='<path d="M61 59 L100 77 L139 59 L132 104 L68 104Z" fill="#252e47" stroke="#9381b5" stroke-width="4"/><path d="M75 87 L92 89 M108 89 L125 87" stroke="#d0a8e7" stroke-width="5"/><path d="M100 17 L100 68" stroke="#b9a0d6" stroke-width="5"/>';
      // A fenda dos elmos preserva a expressão do personagem.
      if(hat==='helm-paladin'||hat==='helm-berserker')
        head+='<path d="M73 84 L92 87 M108 87 L127 84" stroke="#30384a" stroke-width="5" stroke-linecap="round"/>';
    }

    if(hat==='helm-celestial-guardian')head+='<path d="M51 83 Q43 19 100 12 Q157 19 149 83 L137 103 L63 103Z" fill="#e3d7a5" stroke="#fff0bf" stroke-width="7"/><path d="M64 49 L45 9 L88 34 L100 0 L112 34 L155 9 L136 49" fill="#f7e6a9" stroke="#fff8d8" stroke-width="5"/><path d="M58 65 L100 81 L142 65" stroke="#b58b3e" stroke-width="6" fill="none"/><path d="M100 25 L108 43 L127 47 L112 60 L115 79 L100 68 L85 79 L88 60 L73 47 L92 43Z" fill="#75eaff" stroke="#fff" stroke-width="3"/>';
    if(hat==='helm-obsidian-crown')head+='<path d="M51 83 Q43 19 100 12 Q157 19 149 83 L137 103 L63 103Z" fill="#252538" stroke="#9b79c9" stroke-width="7"/><path d="M57 72 L45 16 L80 49 L100 2 L120 49 L155 16 L143 72Z" fill="#3d3159" stroke="#d0a5ff" stroke-width="5"/><path d="M59 76 L141 76" stroke="#c9a5f3" stroke-width="6"/><path d="M100 35 L108 49 L124 52 L112 64 L115 79 L100 70 L85 79 L88 64 L76 52 L92 49Z" fill="#ff5ca8" stroke="#fff" stroke-width="2"/>';
    if(hat==='helm-dragon-emperor')head+='<path d="M51 83 Q43 19 100 12 Q157 19 149 83 L137 103 L63 103Z" fill="#8c393d" stroke="#47283a" stroke-width="7"/><path d="M66 49 L35 2 L87 34 L100 0 L113 34 L165 2 L134 49" fill="#c66a46" stroke="#ffcf91" stroke-width="5" stroke-linejoin="round"/><path d="M58 65 L100 81 L142 65" stroke="#f5bd72" stroke-width="6" fill="none"/><path d="M100 24 L108 42 L127 48 L111 59 L115 78 L100 67 L85 78 L89 59 L73 48 L92 42Z" fill="#ffb64e" stroke="#fff0c0" stroke-width="3"/>';
    if(hat==='helm-rune-knight')head+='<path d="M51 83 Q43 19 100 12 Q157 19 149 83 L137 103 L63 103Z" fill="#53667a" stroke="#c1d7e9" stroke-width="7"/><path d="M62 42 L100 8 L138 42 L130 57 L100 45 L70 57Z" fill="#879bad" stroke="#e3f2ff" stroke-width="4"/><path d="M58 65 L100 81 L142 65" stroke="#e9f6ff" stroke-width="5" fill="none"/><path d="M100 42 L108 55 L121 58 L110 69 L113 84 L100 76 L87 84 L90 69 L79 58 L92 55Z" fill="#7ef0ff" stroke="#fff" stroke-width="2"/>';
    if(hat==='helm-eclipse-crown')
      head+='<path d="M52 78 L58 34 L79 54 L99 8 L119 54 L142 34 L148 78Z" fill="#29283f" stroke="#d2ae64" stroke-width="5" stroke-linejoin="round"/><path d="M57 78 L143 78" stroke="#f4d88d" stroke-width="7"/><path d="M99 25 L105 42 L122 47 L108 58 L111 75 L99 65 L87 75 L90 58 L76 47 L93 42Z" fill="#b48aff" stroke="#f5e0a2" stroke-width="3"/><circle cx="69" cy="67" r="5" fill="#6fe9ff"/><circle cx="130" cy="67" r="5" fill="#6fe9ff"/>';
    if(hat==='helm-astral-dragon')
      head+='<path d="M51 83 Q43 19 100 12 Q157 19 149 83 L137 103 L63 103Z" fill="#315779" stroke="#162d4e" stroke-width="7"/><path d="M66 48 L46 4 L89 32 L100 0 L111 32 L154 4 L134 48" fill="#79c9e9" stroke="#d4f5ff" stroke-width="5" stroke-linejoin="round"/><path d="M58 65 L100 81 L142 65" fill="none" stroke="#f6d98b" stroke-width="6"/><path d="M80 88 L100 95 L120 88" fill="none" stroke="#d8f5ff" stroke-width="4"/><circle cx="100" cy="43" r="6" fill="#c7f6ff"/>';

    const newHatFinishes={
      'hat-crystal-circlet':['#4d9fbc','#c6fbff'],'hat-ember-crown':['#8e3a2d','#ffd27a'],
      'hat-astral-halo':['#7052aa','#d8c2ff'],'hat-thunder-horns':['#3d628c','#a9edff']
    };
    const hatFinish=newHatFinishes[hat];
    if(hatFinish){
      if(hat==='hat-astral-halo')head+='<ellipse cx="100" cy="20" rx="43" ry="10" fill="none" stroke="'+hatFinish[1]+'" stroke-width="4"><animate attributeName="ry" values="8;13;8" dur="2s" repeatCount="indefinite"/></ellipse><path d="M100 2 L108 16 L124 18 L111 29 L114 44 L100 36 L86 44 L89 29 L76 18 L92 16Z" fill="'+hatFinish[1]+'"/>';
      else head+='<path d="M53 75 L62 40 L82 55 L100 21 L118 55 L138 40 L147 75Z" fill="'+hatFinish[0]+'" stroke="'+hatFinish[1]+'" stroke-width="5" stroke-linejoin="round"/><path d="M60 76 L140 76" stroke="'+hatFinish[1]+'" stroke-width="6"/><circle cx="100" cy="49" r="8" fill="'+hatFinish[1]+'"><animate attributeName="r" values="6;9;6" dur="1.8s" repeatCount="indefinite"/></circle>';
    }

    if(accessory==='accessory-astral-core')
      front+='<circle cx="168" cy="152" r="22" fill="#55dfff" opacity=".26"/><path d="M168 129 L184 151 L168 175 L152 151Z" fill="#70eaff" stroke="#e1fdff" stroke-width="4"/><path d="M168 135 L168 169 M157 151 L179 151" stroke="#ffffff" stroke-width="2.5" opacity=".9"/><circle cx="168" cy="151" r="5" fill="#fff"/>';


    if(accessory==='accessory-phoenix-core')front+='<circle cx="165" cy="150" r="25" fill="#ff743f" opacity=".22"/><path d="M165 124 L181 150 L165 177 L149 150Z" fill="#ff9b48" stroke="#ffe6a4" stroke-width="4"/><path d="M165 133 L165 168 M154 150 L176 150" stroke="#fff8d4" stroke-width="3"/><circle cx="165" cy="150" r="6" fill="#fff"><animate attributeName="opacity" values=".35;1;.35" dur="1s" repeatCount="indefinite"/></circle>';
    if(accessory==='accessory-void-orb')front+='<circle cx="168" cy="151" r="23" fill="#9863e7" opacity=".22"/><circle cx="168" cy="151" r="15" fill="#59418b" stroke="#d5aaff" stroke-width="4"/><path d="M168 131 L178 151 L168 171 L158 151Z" fill="#b88aff"/><circle cx="163" cy="145" r="4" fill="#fff"/>';
    if(accessory==='accessory-royal-sigil')front+='<path d="M100 150 L110 160 L100 180 L90 160Z" fill="#d9a943" stroke="#fff0b7" stroke-width="3"/><path d="M83 150 Q100 134 117 150 L113 164 L87 164Z" fill="#8c3b52" stroke="#f3ce7b" stroke-width="3"/><circle cx="100" cy="151" r="5" fill="#fff3b0"/>';
    if(accessory==='accessory-thunder-circlet')front+='<ellipse cx="165" cy="153" rx="24" ry="17" fill="none" stroke="#55dfff" stroke-width="5" transform="rotate(-24 165 153)"><animate attributeName="opacity" values=".55;1;.55" dur="1.1s" repeatCount="indefinite"/></ellipse><path d="M165 130 L172 146 L184 151 L170 158 L166 175 L158 159 L146 153 L160 146Z" fill="#93efff" stroke="#fff" stroke-width="3"/>';

    const vaderArt=outfit==='armor-vader'?'<g class="arc-vader-set"><path d="M74 113 Q100 101 126 113 L160 210 Q100 235 40 210Z" fill="#090d14" stroke="#38424f" stroke-width="4"/><path d="M74 121 L56 144 L67 181 L100 201 L133 181 L144 144 L126 121 L112 130 L100 121 L88 130Z" fill="#141a24" stroke="#737d8b" stroke-width="4"/><path d="M81 133 L100 146 L119 133 L113 171 L100 184 L87 171Z" fill="#05080d" stroke="#8c9aa8" stroke-width="3"/><path d="M86 151 L114 151 M88 160 L112 160 M91 169 L109 169" stroke="#bfced9" stroke-width="3"/><path d="M90 136 L90 174 M100 140 L100 180 M110 136 L110 174" stroke="#d6e0e6" stroke-width="2" opacity=".8"/><path d="M60 132 L43 148 L49 179 L67 173 L76 145 M140 132 L157 148 L151 179 L133 173 L124 145" fill="#080c13" stroke="#697583" stroke-width="4"/><path d="M78 91 Q72 43 100 32 Q128 43 122 91 L132 110 L100 122 L68 110Z" fill="#05080d" stroke="#8b96a2" stroke-width="4"/><path d="M72 73 Q74 23 100 20 Q126 23 128 73 L117 88 L83 88Z" fill="#0a0e15" stroke="#aeb9c4" stroke-width="4"/><path d="M79 77 L94 83 L88 94 L76 90Z M121 77 L106 83 L112 94 L124 90Z" fill="#ff334b" stroke="#ffb6bd" stroke-width="2"><animate attributeName="opacity" values=".65;1;.65" dur="1.3s" repeatCount="indefinite"/></path><path d="M100 90 L117 106 L100 123 L83 106Z" fill="#171d27" stroke="#a3aebb" stroke-width="3"/><path d="M92 101 L100 110 L108 101 M91 114 L100 119 L109 114" stroke="#aeb8c4" stroke-width="3"/><path d="M64 111 L45 123 L52 154 L72 147 M136 111 L155 123 L148 154 L128 147" fill="none" stroke="#222c38" stroke-width="7"/><path d="M78 186 L69 204 L84 216 L100 205 L116 216 L131 204 L122 186" fill="#090d14" stroke="#4c5868" stroke-width="3"/><path d="M82 190 L100 201 L118 190" fill="none" stroke="#c0ccd6" stroke-width="3"/><path d="M78 119 Q100 106 122 119" fill="none" stroke="#d5e1e9" stroke-width="3" opacity=".7"/></g>':'';
    const weaponArt=weapon==='weapon-red-plasma-saber'?'<g class="arc-plasma-saber"><path d="M160 170 L185 42" stroke="#ff243f" stroke-width="12" stroke-linecap="round" opacity=".28"/><path d="M160 170 L185 42" stroke="#ff253f" stroke-width="6" stroke-linecap="round"/><path d="M160 170 L185 42" stroke="#fff4f4" stroke-width="2.2" stroke-linecap="round"/><path d="M151 166 L170 170 L175 158 L156 154Z" fill="#151a24" stroke="#aab5c3" stroke-width="3"/><path d="M152 158 L173 163 M153 168 L172 173" stroke="#dce7ef" stroke-width="2"/><circle cx="165" cy="163" r="4" fill="#ff3c55"><animate attributeName="opacity" values=".5;1;.5" dur=".8s" repeatCount="indefinite"/></circle></g>':'';
    const petArt=pet?(()=>{const wrap='<g class="arc-pet-companion"><ellipse cx="165" cy="205" rx="18" ry="4" fill="#000" opacity=".25"/><animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="2.4s" repeatCount="indefinite"/>';const end='</g>';if(pet==='pet-dragonling')return wrap+'<path d="M150 180 Q135 164 143 148 Q154 153 159 166 M177 178 Q195 161 190 145 Q176 151 170 166" fill="#5cb7d7" stroke="#244c68" stroke-width="3"/><ellipse cx="164" cy="188" rx="17" ry="15" fill="#3f91b7" stroke="#244c68" stroke-width="3"/><path d="M151 185 Q138 189 140 201 Q151 198 157 194" fill="#3f91b7" stroke="#244c68" stroke-width="3"/><circle cx="175" cy="171" r="13" fill="#65c3df" stroke="#244c68" stroke-width="3"/><path d="M166 161 L163 150 L174 158 M179 160 L188 151 L187 165" fill="#79d3e8" stroke="#244c68" stroke-width="3"/><circle cx="179" cy="169" r="2" fill="#142b42"/><circle cx="170" cy="169" r="2" fill="#142b42"/><path d="M171 177 Q176 181 181 176" fill="none" stroke="#17374a" stroke-width="2"/><path d="M157 199 L155 205 M170 200 L171 205" stroke="#244c68" stroke-width="3" stroke-linecap="round"/>'+end;if(pet==='pet-goblin')return wrap+'<path d="M151 177 L137 168 L153 164 M179 174 L195 163 L185 182" fill="#75a94d" stroke="#354b32" stroke-width="3"/><ellipse cx="166" cy="190" rx="15" ry="18" fill="#6f9e49" stroke="#354b32" stroke-width="3"/><circle cx="166" cy="169" r="15" fill="#83b85b" stroke="#354b32" stroke-width="3"/><path d="M155 158 L150 146 L163 155 M174 156 L184 145 L180 162" fill="#a5ce6c" stroke="#354b32" stroke-width="3"/><circle cx="160" cy="169" r="2.5" fill="#202b20"/><circle cx="172" cy="169" r="2.5" fill="#202b20"/><path d="M160 179 Q166 184 173 178" fill="none" stroke="#354b32" stroke-width="2.5"/><path d="M158 204 L155 210 M174 204 L177 210" stroke="#354b32" stroke-width="4" stroke-linecap="round"/>'+end;if(pet==='pet-slime')return wrap+'<path d="M145 201 Q143 176 160 171 Q180 166 187 188 Q190 203 178 207 L151 207Z" fill="#7edb9c" stroke="#2f785c" stroke-width="3"/><ellipse cx="160" cy="188" rx="3" ry="5" fill="#164c43"/><ellipse cx="175" cy="188" rx="3" ry="5" fill="#164c43"/><path d="M162 197 Q168 202 174 197" fill="none" stroke="#2f785c" stroke-width="2.5"/><circle cx="153" cy="178" r="4" fill="#d5ffe4" opacity=".9"/><path d="M166 171 Q158 160 168 155 Q179 163 175 172" fill="#a5f5c4" stroke="#2f785c" stroke-width="2"/>'+end;if(pet==='pet-wolfcub')return wrap+'<ellipse cx="164" cy="191" rx="18" ry="14" fill="#8b9bb4" stroke="#3d4b64" stroke-width="3"/><circle cx="170" cy="173" r="14" fill="#aab8cc" stroke="#3d4b64" stroke-width="3"/><path d="M159 163 L157 148 L169 159 M176 160 L187 151 L183 168" fill="#8295b1" stroke="#3d4b64" stroke-width="3"/><path d="M164 178 Q170 184 177 178" fill="none" stroke="#3d4b64" stroke-width="2.5"/><circle cx="166" cy="171" r="2" fill="#18243a"/><circle cx="176" cy="171" r="2" fill="#18243a"/><ellipse cx="172" cy="180" rx="6" ry="4" fill="#e6eaf0"/><circle cx="173" cy="178" r="2" fill="#263448"/><path d="M150 191 Q138 183 143 174 Q153 177 156 186" fill="#aab8cc" stroke="#3d4b64" stroke-width="3"/><path d="M155 201 L154 207 M172 202 L174 208" stroke="#3d4b64" stroke-width="3" stroke-linecap="round"/>'+end;return wrap+'<path d="M151 184 Q143 166 156 157 Q159 170 166 174 Q172 160 184 160 Q184 177 177 184" fill="#f39a4e" stroke="#82472f" stroke-width="3"/><ellipse cx="166" cy="190" rx="15" ry="14" fill="#f2c36c" stroke="#82472f" stroke-width="3"/><circle cx="166" cy="173" r="13" fill="#ffd37b" stroke="#82472f" stroke-width="3"/><path d="M157 164 Q153 151 164 145 Q167 158 172 162" fill="#ff8a4c"/><circle cx="161" cy="174" r="2" fill="#633b2c"/><circle cx="171" cy="174" r="2" fill="#633b2c"/><path d="M162 181 Q166 185 171 181" fill="none" stroke="#82472f" stroke-width="2"/>'+end;})():'';
    // Camada de acabamento universal: itens novos nunca ficam invisíveis mesmo que ainda não tenham uma ilustração exclusiva.
    const colorSeed=(str)=>{let h=0;for(let i=0;i<String(str||'').length;i++)h=(h*31+String(str).charCodeAt(i))>>>0;return ['#62e8ff','#c18cff','#ff8caa','#ffd36b','#67f0b1','#ff795e'][h%6];};
    const equippedItems=[['outfit',outfit],['hat',hat],['mask',mask],['shoulders',shoulders],['cloak',cloak],['accessory',accessory]];
    for(const [slot,selectedId] of equippedItems){
      if(!selectedId||selectedId==='armor-vader')continue;
      const known=S.catalog.find(x=>x.id===selectedId), accent=colorSeed(selectedId);
      if(slot==='outfit')body+='<path d="M86 151 L100 162 L114 151 L109 183 L100 192 L91 183Z" fill="none" stroke="'+accent+'" stroke-width="2.4" opacity=".82"/><circle cx="100" cy="174" r="4" fill="'+accent+'"><animate attributeName="r" values="3;5;3" dur="1.8s" repeatCount="indefinite"/></circle>';
      if(slot==='hat')head+='<path d="M94 68 L100 59 L106 68 L100 76Z" fill="'+accent+'" stroke="#fff" stroke-opacity=".7" stroke-width="1.5"><animate attributeName="opacity" values=".55;1;.55" dur="1.6s" repeatCount="indefinite"/></path>';
      if(slot==='mask')head+='<path d="M78 101 L93 105 M107 105 L122 101" stroke="'+accent+'" stroke-width="3" stroke-linecap="round" opacity=".95"/>';
      if(slot==='shoulders')body+='<g fill="'+accent+'"><circle cx="31" cy="136" r="4"><animate attributeName="r" values="2;5;2" dur="1.5s" repeatCount="indefinite"/></circle><circle cx="169" cy="136" r="4"><animate attributeName="r" values="5;2;5" dur="1.5s" repeatCount="indefinite"/></circle></g>';
      if(slot==='cloak')back+='<path d="M100 132 L100 210" stroke="'+accent+'" stroke-width="2.5" stroke-dasharray="4 5" opacity=".8"/>';
      if(slot==='accessory'&&!selectedId.startsWith('wings-'))front+='<circle cx="166" cy="142" r="8" fill="'+accent+'" stroke="#fff" stroke-opacity=".8" stroke-width="2"><animate attributeName="r" values="6;9;6" dur="1.8s" repeatCount="indefinite"/></circle>';
    }
    const filterDefs=glowColor
      ? '<filter id="'+auraFilterId+'" x="-55%" y="-45%" width="210%" height="200%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="8" result="softAlpha"/><feFlood flood-color="'+glowColor+'" flood-opacity=".96" result="auraTint"/><feComposite in="auraTint" in2="softAlpha" operator="in" result="coloredGlow"/><feGaussianBlur in="coloredGlow" stdDeviation="4" result="wideGlow"/><feMerge><feMergeNode in="wideGlow"/><feMergeNode in="coloredGlow"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
      : '';
    return '<svg class="arc-avatar arc-avatar-'+esc(variant||'default')+(auraColor?' has-luminous-aura':gearGlowColor?' has-premium-glow':'')+'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 225" role="img" aria-label="Personagem medieval personalizado" style="'+svgStyle+'display:block;overflow:visible" focusable="false"><defs>'+filterDefs+'</defs><g class="arc-layer-back">'+back+'</g><g class="arc-character-glow"'+glowFilter+'><g class="arc-layer-body">'+body+'</g><g class="arc-layer-head">'+head+'</g><g class="arc-layer-front">'+front+'</g>'+vaderArt+'</g>'+petArt+weaponArt+'</svg>';
  }
  function titleMarkup(appearance,variant='stage'){
    const selected=item(appearance?.title);
    if(!selected)return '';
    const slug=selected.id.replace(/[^a-z0-9_-]/g,'');
    return '<div class="arc-title-plate arc-title-'+slug+' arc-title-'+variant+'"><span class="arc-title-sigil">✦</span><b>'+esc(selected.name)+'</b><span class="arc-title-sigil">✦</span></div>';
  }
    function toast(message){const c=C();if(c?.toast)c.toast(message);}
  function notifyAppearance(){
    document.dispatchEvent(new CustomEvent('academia-avatar-changed',{detail:{appearance:Object.assign({},S.appearance)}}));
  }
  async function load(){
    const c=C();
    if(!c||c.guest||!c.user){S.guest=true;S.catalog=[];S.owned=[];return;}
    S.guest=false;S.error=null;
    const sb=c.supabase;
    const synced=await sb.rpc('avatar_sync_achievement_rewards');
    if(synced.error)throw synced.error;
    const [catalog,owned,profile,wallet]=await Promise.all([
      sb.from('avatar_items').select('id,name,slot,rarity,icon,description,asset_key,unlock_type,price,achievement_id').eq('active',true).order('price'),
      sb.from('user_avatar_items').select('item_id,unlock_source,unlocked_at').order('unlocked_at',{ascending:false}),
      sb.from('player_profiles').select('appearance,class').maybeSingle(),
      sb.from('coin_wallets').select('balance').maybeSingle()
    ]);
    const bad=[catalog,owned,profile,wallet].find(x=>x.error);if(bad)throw bad.error;
    const slotOrder=SLOTS.reduce((map,row,index)=>{map[row[0]]=index;return map;},{});
    S.catalog=(catalog.data||[]).sort((a,b)=>
      (slotOrder[a.slot]??99)-(slotOrder[b.slot]??99) ||
      (a.unlock_type===b.unlock_type?0:a.unlock_type==='shop'?-1:1) ||
      Number(a.price||0)-Number(b.price||0) ||
      a.name.localeCompare(b.name,'pt-BR'));
    S.owned=owned.data||[];S.appearance=profile.data?.appearance||{};
    S.playerClass=profile.data?.class||'mago';S.balance=wallet.data?.balance||0;
  }
  function card(x){
    const own=owns(x.id),eq=equipped(x.id),reward=x.unlock_type==='achievement';
    const ach=ACH_NAME[x.achievement_id]||'conquista especial';
    const preview=Object.assign({},S.appearance);preview[x.slot]=x.id;
    const action=reward
      ? '<span class="arc-item-unlock '+(own?'is-owned':'is-locked')+'">'+(own?'✦ Desbloqueado':'🔒 '+esc(ach))+'</span>'
      : '<span class="arc-item-price">'+Number(x.price).toLocaleString('pt-BR')+' Coins</span>';
    let main='';
    if(own)main='<button class="arc-item-main '+(eq?'equipped':'owned')+'" data-avatar-action="'+(eq?'unequip':'equip')+'" data-id="'+esc(x.id)+'">'+(eq?'Desequipar':'Equipar')+'</button>';
    else if(reward)main='<button class="arc-item-main locked" disabled>Conquiste a medalha</button>';
    else main='<button class="arc-item-main" data-avatar-action="buy" data-id="'+esc(x.id)+'">Comprar por '+Number(x.price).toLocaleString('pt-BR')+' C</button>';
    const premium=x.rarity==='Lendário'||Number(x.price)>=2000;
    const visual=x.slot==='title'
      ? '<div class="arc-title-card-preview">'+titleMarkup(preview,'card')+'<small>PRÉVIA DO TÍTULO</small></div>'
      : x.slot==='nameColor'
        ? '<div class="arc-name-color-preview"><b class="'+nameColorClass(x.id)+'">Aventureiro</b><small>PRÉVIA DA COR DO NOME</small></div>'
        : render(preview,'item',S.playerClass);
    return '<article class="arc-item-card arc-rarity-'+(RARITY[x.rarity]||'common')+(premium?' arc-premium-card':'')+(x.slot==='title'?' arc-title-item-card':'')+(x.slot==='aura'?' arc-aura-item-card':'')+(x.slot==='pet'?' arc-pet-item-card':'')+'"><div class="arc-item-visual">'+visual+'</div><div class="arc-item-copy"><div class="arc-item-top"><span>'+esc(x.id.startsWith('wings-')?'Asas':(SLOT_NAME[x.slot]||x.slot))+'</span><b>'+esc(x.rarity)+'</b></div><h4>'+esc(x.name)+'</h4><p>'+esc(x.description)+'</p><div class="arc-item-bottom">'+action+'</div><div class="arc-item-actions"><button class="arc-preview-btn '+(S.previewId===x.id?'active':'')+'" data-avatar-action="preview" data-id="'+esc(x.id)+'">'+(S.previewId===x.id?'Em prévia':'Experimentar')+'</button>'+main+'</div></div></article>';
  }
  function renderAtelier(){
    const root=$('rpgView');if(!root)return;
    if(S.guest){root.innerHTML='<section class="arc-hero"><div><div class="arc-eyebrow">ATELIÊ ARCANO</div><h3>Vista sua próxima aventura.</h3><p>Entre com sua conta Google para comprar itens, desbloquear recompensas e sincronizar seu personagem.</p></div>'+render({},'preview','mago')+'</section><div class="rpg-note">O modo convidado não acessa Coins nem inventário. Sua aparência será salva na conta conectada.</div>';return;}
    if(S.error){root.innerHTML='<div class="panel"><b>Não foi possível abrir o Ateliê Arcano.</b><p class="sub">'+esc(S.error)+'</p><button class="secondary" data-avatar-action="reload">Tentar novamente</button></div>';return;}
    if(!S.catalog.length){root.innerHTML='<div class="panel"><div class="empty">Carregando os visuais do Ateliê Arcano...</div></div>';return;}
    const current=getPreviewAppearance(),selected=item(S.previewId);
    const previewName=selected?'Prévia: '+selected.name:'Seu visual atual';
    const previewButtons=selected?'<button class="arc-button arc-button-soft" data-avatar-action="cancel-preview">Voltar ao visual equipado</button>':'<span class="arc-preview-hint">Experimente qualquer peça antes de comprar.</span>';
    const list=S.catalog.filter(x=>(S.filter==='all'||(S.filter==='wings'?x.id.startsWith('wings-'):x.slot===S.filter))&&(S.tab==='shop'||owns(x.id)));
    const categorySource=S.catalog.filter(x=>S.tab==='shop'||owns(x.id));
    const categoryButton=([key,label])=>{
      const count=key==='all'?categorySource.length:key==='wings'?categorySource.filter(v=>v.id.startsWith('wings-')).length:categorySource.filter(v=>v.slot===key).length;
      return '<button type="button" class="arc-filter '+(S.filter===key?'active':'')+'" data-avatar-filter="'+key+'" aria-pressed="'+(S.filter===key?'true':'false')+'"><span class="arc-filter-icon">'+SLOT_ICON[key]+'</span><span class="arc-filter-label">'+label+'</span><small>'+count+'</small></button>';
    };
    const sideGroups=[
      {title:'Aparência',items:[['hair','Cabelos'],['hat','Chapéus e elmos']]},
      {title:'Equipamentos',items:[['outfit','Armaduras'],['shoulders','Ombreiras'],['cloak','Capas'],['mask','Máscaras'],['accessory','Acessórios'],['weapon','Armas']]},
      {title:'Identidade',items:[['nameColor','Cores neon']]},{title:'Poderes e títulos',items:[['aura','Auras'],['pet','Pets'],['title','Títulos']]}
    ];
    const cats='<div class="arc-side-all">'+categoryButton(['all','Todos os itens'])+'</div>'+
      '<div class="arc-nav-groups">'+sideGroups.map(group=>
        '<section class="arc-nav-group"><h4 class="arc-nav-heading">'+group.title+'</h4><div class="arc-nav-options">'+group.items.map(categoryButton).join('')+'</div></section>'
      ).join('')+'</div>';
    const activeCategory=S.filter==='wings'?['wings','Asas']:SLOTS.find(x=>x[0]===S.filter);
    const categoryHeading=S.filter==='all'?'Todos os visuais':(activeCategory?.[1]||'Visuais');
    const categoryMeta=list.length+' '+(list.length===1?'item':'itens');
    const tabs='<button class="arc-tab '+(S.tab==='shop'?'active':'')+'" data-avatar-tab="shop">Loja de visuais</button><button class="arc-tab '+(S.tab==='inventory'?'active':'')+'" data-avatar-tab="inventory">Meu inventário ('+S.owned.length+')</button>';
    const items=S.filter==='wings'?list.map(card).join(''):S.filter==='all'
      ? SLOTS.slice(1).map(([slot,label])=>{
          const group=list.filter(x=>x.slot===slot&&!(slot==='accessory'&&x.id.startsWith('wings-')));
          return group.length?'<div class="arc-group-heading">'+label+'</div>'+group.map(card).join(''):'';
        }).join('')+(list.some(x=>x.id.startsWith('wings-'))?'<div class="arc-group-heading">Asas</div>'+list.filter(x=>x.id.startsWith('wings-')).map(card).join(''):'')
      : list.map(card).join('');
    root.innerHTML=
      '<section class="arc-hero"><div><div class="arc-eyebrow">✦ ATELIÊ ARCANO ✦</div><h3>Seu personagem, sua lenda.</h3><p>Combine cabelos, chapéus, roupas, capas, máscaras e itens mágicos. Os visuais conquistados por mérito ficam guardados para sempre.</p><div class="arc-wallet"><span>🪙</span><div><small>SALDO DISPONÍVEL</small><b>'+S.balance.toLocaleString('pt-BR')+' Coins</b></div></div></div><div class="arc-stage arc-stage-aura-'+(current.aura||'none')+'"><div class="arc-stage-glow"></div>'+render(current,'preview',S.playerClass)+titleMarkup(current,'stage')+'<div class="arc-stage-caption"><b>'+esc(previewName)+'</b><small>'+esc(SLOT_NAME[selected?.slot]||'Aventureiro')+'</small>'+previewButtons+'</div></div></section>'+
      '<div class="arc-toolbar"><div><h3>Guarda-roupa</h3><p>Os itens comprados usam as Coins que você já acumula na Academia.</p></div><div class="arc-tabs">'+tabs+'</div></div>'+
      (S.tab==='inventory'?'<div class="arc-inventory-note">Itens no inventário: '+S.owned.length+' · Recompensas de conquistas não custam Coins.</div>':'')+
      '<div class="arc-catalog-layout"><aside class="arc-side-nav" aria-label="Categorias do Ateliê"><div class="arc-side-title">FILTRAR VISUAIS</div>'+cats+'</aside><div class="arc-catalog-main"><div class="arc-catalog-heading"><div><span>CATÁLOGO ARCANO</span><h4>'+categoryHeading+'</h4></div><small>'+categoryMeta+'</small></div><div class="arc-item-grid">'+(items||'<div class="arc-empty">'+(S.tab==='inventory'?'Você ainda não possui itens nesta categoria. Visite a loja ou complete conquistas para receber novos visuais.':'Nenhum item encontrado nesta categoria.')+'</div>')+'</div></div></div>'+
      '<p class="arc-footnote">As prévias não alteram seu personagem. A aparência só muda quando você equipa um item, e fica sincronizada na sua conta.</p>';
  }
  async function open(){
    S.tab='shop';S.filter='all';S.previewId=null;S.error=null;
    renderAtelier();
    try{await load();}catch(e){S.error=e.message||String(e);console.error('Ateliê Arcano:',e);}
    if(document.querySelector('[data-rpg="atelier"].active'))renderAtelier();
  }
  async function action(button){
    if(!button||S.busy)return;
    const act=button.dataset.avatarAction,id=button.dataset.id;
    if(act==='preview'){S.previewId=S.previewId===id?null:id;renderAtelier();return;}
    if(act==='cancel-preview'){S.previewId=null;renderAtelier();return;}
    if(act==='reload'){S.error=null;await open();return;}
    if(act==='buy'||act==='equip'||act==='unequip'){
      if(S.guest){toast('Entre com Google para salvar seu personagem.');return;}
      S.busy=true;button.disabled=true;
      try{
        if(act==='buy'){
          const {data,error}=await C().supabase.rpc('avatar_buy_item',{p_item_id:id});
          if(error)throw error;
          if(!data?.ok){
            toast(data?.reason==='insufficient'?'Coins insuficientes para este visual.':'Este visual já está no seu inventário.');
          }else{toast('Visual adquirido! Ele já está disponível no seu inventário.');S.previewId=id;}
        }else{
          const {data,error}=await C().supabase.rpc('avatar_equip_item',{p_item_id:id,p_equipped:act!=='unequip'});
          if(error)throw error;
          S.appearance=data?.appearance||{};
          S.previewId=null;notifyAppearance();
          toast(act==='unequip'?'Peça removida do personagem.':'Visual equipado com sucesso!');
        }
        await load();
      }catch(e){toast('Não foi possível concluir: '+(e.message||e));}
      finally{S.busy=false;renderAtelier();}
    }
  }
  const root=$('rpgView');
  if(root){
    root.addEventListener('click',e=>{
      const b=e.target.closest('[data-avatar-action],[data-avatar-tab],[data-avatar-filter]');
      if(!b)return;
      if(b.dataset.avatarTab){S.tab=b.dataset.avatarTab;S.filter='all';S.previewId=null;renderAtelier();return;}
      if(b.dataset.avatarFilter){S.filter=b.dataset.avatarFilter;renderAtelier();return;}
      action(b).catch(e=>{console.error(e);toast('Não foi possível concluir esta ação.');});
    });
  }
  document.addEventListener('academia-avatar-changed',e=>{if(e.detail?.appearance)S.appearance=e.detail.appearance;});
  window.AcademiaAvatar={render,open,renderAtelier,titleMarkup,nameMarkup};
})();