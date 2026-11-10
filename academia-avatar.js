// Academy RPG · Ateliê Arcano
// Avatares vetoriais em camadas; itens e aparência sincronizados pelo Supabase.
(() => {
  'use strict';
  const C=()=>window.AcademiaCtx, $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const S={catalog:[],owned:[],appearance:{},balance:0,playerClass:'mago',tab:'shop',filter:'all',previewId:null,guest:false,busy:false,error:null};
  const SLOTS=[
    ['all','Todos'],['nameColor','Cores neon'],['hair','Cabelos'],['hat','Chapéus e elmos'],['outfit','Armaduras'],
    ['shoulders','Ombreiras'],['cloak','Capas'],['mask','Máscaras'],['accessory','Acessórios'],
    ['aura','Auras'],['title','Títulos']
  ];
  const SLOT_NAME={nameColor:'Cor do nome',hair:'Cabelo',hat:'Chapéu / elmo',outfit:'Armadura',shoulders:'Ombreiras',cloak:'Capa',mask:'Máscara',accessory:'Acessório',aura:'Aura',title:'Título'};
  const SLOT_ICON={all:'✦',nameColor:'✧',hair:'✂',hat:'♛',outfit:'⚔',shoulders:'🛡',cloak:'◈',mask:'◉',accessory:'✧',aura:'☼',title:'♕'};
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
  function nameColorClass(id){return ({'name-neon-cyan':'arc-name-neon-cyan','name-neon-pink':'arc-name-neon-pink','name-neon-purple':'arc-name-neon-purple','name-neon-green':'arc-name-neon-green','name-neon-gold':'arc-name-neon-gold','name-neon-red':'arc-name-neon-red'})[id]||'';}
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
      cloak=id('cloak'),mask=id('mask'),accessory=id('accessory'),aura=id('aura');
    const auraColors={
      'aura-ember':'#ff873d','aura-celestial':'#8bdcff','aura-dedication':'#f5d98b',
      'aura-solar-ascendant':'#ffd04b','aura-void-emperor':'#bd78ff',
      'aura-phoenix':'#ff603e','aura-arcane-supreme':'#64e4ff'
    };
    const auraColor=auraColors[aura]||'';
    let gearGlowColor='';
    if(hat==='helm-eclipse-crown'||outfit==='armor-solar-sovereign'||shoulders==='shoulders-celestial-titan')gearGlowColor='#ffd36b';
    if(hat==='helm-astral-dragon'||accessory==='accessory-astral-core')gearGlowColor='#73e5ff';
    if(cloak==='cloak-phoenix')gearGlowColor='#ff754b';
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
    }
    if(accessory==='accessory-wings')
      back+='<path d="M75 144 Q28 143 17 91 Q46 93 72 124 Q44 83 53 48 Q88 69 94 126 M125 144 Q172 143 183 91 Q154 93 128 124 Q156 83 147 48 Q112 69 106 126" fill="#a5dced" fill-opacity=".65" stroke="#e2f6ff" stroke-width="4" stroke-linejoin="round"/><path d="M69 125 Q45 100 47 72 M131 125 Q155 100 153 72" fill="none" stroke="#eafaff" stroke-width="3" opacity=".85"/>';
    if(cloak){
      const cloakColor=cloak==='cloak-forest'?'#456c59':cloak==='cloak-night'?'#51416f':cloak==='cloak-veteran'?'#783b48':cloak==='cloak-phoenix'?'#8f302f':cloak==='cloak-obsidian'?'#252b42':'#334c72';
      back+='<path d="M74 116 Q100 103 126 116 L158 205 Q100 230 42 205Z" fill="'+cloakColor+'" stroke="'+(cloak==='cloak-phoenix'?'#ffbd62':cloak==='cloak-obsidian'?'#9d8ad0':'#d6bd85')+'" stroke-width="4" stroke-linejoin="round"/><path d="M85 122 L100 212 L115 122" fill="none" stroke="#ffffff" stroke-opacity=".25" stroke-width="4"/>';
      if(cloak==='cloak-phoenix')
        back+='<path d="M55 173 Q72 145 89 170 Q100 183 111 165 Q130 144 145 174" fill="none" stroke="#ffcb70" stroke-width="4"/><path d="M71 190 Q84 174 100 191 Q116 174 129 190" fill="none" stroke="#ff7c48" stroke-width="3"/>';
      if(cloak==='cloak-obsidian')
        back+='<path d="M62 150 L100 169 L138 150 M57 177 L100 198 L143 177 M78 129 L100 145 L122 129" fill="none" stroke="#b7a6ec" stroke-width="3" opacity=".78"/>';
      if(cloak==='cloak-stars')
        back+='<g fill="#f4e1a5"><path d="M63 157 l4 8 9 2-9 4-4 9-3-9-9-4 9-2z"/><path d="M137 178 l3 6 7 2-7 3-3 7-3-7-7-3 7-2z"/><circle cx="78" cy="195" r="2.5"/><circle cx="124" cy="147" r="2.5"/></g>';
      if(cloak==='cloak-veteran')
        back+='<path d="M73 125 L100 146 L127 125 L119 190 L100 214 L81 190Z" fill="#a44e4b" stroke="#e8bd7a" stroke-width="3"/>';
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

    // Ombreiras aparecem DEPOIS da armadura, encaixadas nos ombros.
    if(shoulders==='shoulders-titan'||shoulders==='shoulders-dragon'||shoulders==='shoulders-paladin'||shoulders==='shoulders-celestial-titan'){
      const sc=shoulders==='shoulders-dragon'?'#a84d3e':shoulders==='shoulders-paladin'?'#d5bd7d':shoulders==='shoulders-celestial-titan'?'#526f9e':'#687b91';
      const st=shoulders==='shoulders-dragon'?'#f1a16a':shoulders==='shoulders-celestial-titan'?'#a8edff':'#dce8ef';
      body+='<path d="M69 130 L48 112 L25 126 L34 157 L69 151Z M131 130 L152 112 L175 126 L166 157 L131 151Z" fill="'+sc+'" stroke="#252d3b" stroke-width="5" stroke-linejoin="round"/><path d="M34 130 L54 119 L69 136 L56 150 L39 145Z M166 130 L146 119 L131 136 L144 150 L161 145Z" fill="'+st+'" stroke="#343b4c" stroke-width="3"/><path d="M31 126 L18 107 L46 115 M169 126 L182 107 L154 115" fill="none" stroke="'+st+'" stroke-width="5" stroke-linecap="round"/>';
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

    if(hat==='helm-eclipse-crown')
      head+='<path d="M52 78 L58 34 L79 54 L99 8 L119 54 L142 34 L148 78Z" fill="#29283f" stroke="#d2ae64" stroke-width="5" stroke-linejoin="round"/><path d="M57 78 L143 78" stroke="#f4d88d" stroke-width="7"/><path d="M99 25 L105 42 L122 47 L108 58 L111 75 L99 65 L87 75 L90 58 L76 47 L93 42Z" fill="#b48aff" stroke="#f5e0a2" stroke-width="3"/><circle cx="69" cy="67" r="5" fill="#6fe9ff"/><circle cx="130" cy="67" r="5" fill="#6fe9ff"/>';
    if(hat==='helm-astral-dragon')
      head+='<path d="M51 83 Q43 19 100 12 Q157 19 149 83 L137 103 L63 103Z" fill="#315779" stroke="#162d4e" stroke-width="7"/><path d="M66 48 L46 4 L89 32 L100 0 L111 32 L154 4 L134 48" fill="#79c9e9" stroke="#d4f5ff" stroke-width="5" stroke-linejoin="round"/><path d="M58 65 L100 81 L142 65" fill="none" stroke="#f6d98b" stroke-width="6"/><path d="M80 88 L100 95 L120 88" fill="none" stroke="#d8f5ff" stroke-width="4"/><circle cx="100" cy="43" r="6" fill="#c7f6ff"/>';
    if(accessory==='accessory-astral-core')
      front+='<circle cx="168" cy="152" r="22" fill="#55dfff" opacity=".26"/><path d="M168 129 L184 151 L168 175 L152 151Z" fill="#70eaff" stroke="#e1fdff" stroke-width="4"/><path d="M168 135 L168 169 M157 151 L179 151" stroke="#ffffff" stroke-width="2.5" opacity=".9"/><circle cx="168" cy="151" r="5" fill="#fff"/>';

    const filterDefs=glowColor
      ? '<filter id="'+auraFilterId+'" x="-55%" y="-45%" width="210%" height="200%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="8" result="softAlpha"/><feFlood flood-color="'+glowColor+'" flood-opacity=".96" result="auraTint"/><feComposite in="auraTint" in2="softAlpha" operator="in" result="coloredGlow"/><feGaussianBlur in="coloredGlow" stdDeviation="4" result="wideGlow"/><feMerge><feMergeNode in="wideGlow"/><feMergeNode in="coloredGlow"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
      : '';
    return '<svg class="arc-avatar arc-avatar-'+esc(variant||'default')+(auraColor?' has-luminous-aura':gearGlowColor?' has-premium-glow':'')+'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 225" role="img" aria-label="Personagem medieval personalizado" style="'+svgStyle+'display:block;overflow:visible" focusable="false"><defs>'+filterDefs+'</defs><g class="arc-layer-back">'+back+'</g><g class="arc-character-glow"'+glowFilter+'><g class="arc-layer-body">'+body+'</g><g class="arc-layer-head">'+head+'</g><g class="arc-layer-front">'+front+'</g></g></svg>';
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
    return '<article class="arc-item-card arc-rarity-'+(RARITY[x.rarity]||'common')+(premium?' arc-premium-card':'')+(x.slot==='title'?' arc-title-item-card':'')+(x.slot==='aura'?' arc-aura-item-card':'')+'"><div class="arc-item-visual">'+visual+'</div><div class="arc-item-copy"><div class="arc-item-top"><span>'+esc(SLOT_NAME[x.slot]||x.slot)+'</span><b>'+esc(x.rarity)+'</b></div><h4>'+esc(x.name)+'</h4><p>'+esc(x.description)+'</p><div class="arc-item-bottom">'+action+'</div><div class="arc-item-actions"><button class="arc-preview-btn '+(S.previewId===x.id?'active':'')+'" data-avatar-action="preview" data-id="'+esc(x.id)+'">'+(S.previewId===x.id?'Em prévia':'Experimentar')+'</button>'+main+'</div></div></article>';
  }
  function renderAtelier(){
    const root=$('rpgView');if(!root)return;
    if(S.guest){root.innerHTML='<section class="arc-hero"><div><div class="arc-eyebrow">ATELIÊ ARCANO</div><h3>Vista sua próxima aventura.</h3><p>Entre com sua conta Google para comprar itens, desbloquear recompensas e sincronizar seu personagem.</p></div>'+render({},'preview','mago')+'</section><div class="rpg-note">O modo convidado não acessa Coins nem inventário. Sua aparência será salva na conta conectada.</div>';return;}
    if(S.error){root.innerHTML='<div class="panel"><b>Não foi possível abrir o Ateliê Arcano.</b><p class="sub">'+esc(S.error)+'</p><button class="secondary" data-avatar-action="reload">Tentar novamente</button></div>';return;}
    if(!S.catalog.length){root.innerHTML='<div class="panel"><div class="empty">Carregando os visuais do Ateliê Arcano...</div></div>';return;}
    const current=getPreviewAppearance(),selected=item(S.previewId);
    const previewName=selected?'Prévia: '+selected.name:'Seu visual atual';
    const previewButtons=selected?'<button class="arc-button arc-button-soft" data-avatar-action="cancel-preview">Voltar ao visual equipado</button>':'<span class="arc-preview-hint">Experimente qualquer peça antes de comprar.</span>';
    const list=S.catalog.filter(x=>(S.filter==='all'||x.slot===S.filter)&&(S.tab==='shop'||owns(x.id)));
    const categorySource=S.catalog.filter(x=>S.tab==='shop'||owns(x.id));
    const categoryButton=([key,label])=>{
      const count=key==='all'?categorySource.length:categorySource.filter(v=>v.slot===key).length;
      return '<button type="button" class="arc-filter '+(S.filter===key?'active':'')+'" data-avatar-filter="'+key+'" aria-pressed="'+(S.filter===key?'true':'false')+'"><span class="arc-filter-icon">'+SLOT_ICON[key]+'</span><span class="arc-filter-label">'+label+'</span><small>'+count+'</small></button>';
    };
    const sideGroups=[
      {title:'Aparência',items:[['hair','Cabelos'],['hat','Chapéus e elmos']]},
      {title:'Equipamentos',items:[['outfit','Armaduras'],['shoulders','Ombreiras'],['cloak','Capas'],['mask','Máscaras'],['accessory','Acessórios']]},
      {title:'Poderes e títulos',items:[['aura','Auras'],['title','Títulos']]}
    ];
    const cats='<div class="arc-side-all">'+categoryButton(['all','Todos os itens'])+'</div>'+
      '<div class="arc-nav-groups">'+sideGroups.map(group=>
        '<section class="arc-nav-group"><h4 class="arc-nav-heading">'+group.title+'</h4><div class="arc-nav-options">'+group.items.map(categoryButton).join('')+'</div></section>'
      ).join('')+'</div>';
    const activeCategory=SLOTS.find(x=>x[0]===S.filter);
    const categoryHeading=S.filter==='all'?'Todos os visuais':(activeCategory?.[1]||'Visuais');
    const categoryMeta=list.length+' '+(list.length===1?'item':'itens');
    const tabs='<button class="arc-tab '+(S.tab==='shop'?'active':'')+'" data-avatar-tab="shop">Loja de visuais</button><button class="arc-tab '+(S.tab==='inventory'?'active':'')+'" data-avatar-tab="inventory">Meu inventário ('+S.owned.length+')</button>';
    const items=S.filter==='all'
      ? SLOTS.slice(1).map(([slot,label])=>{
          const group=list.filter(x=>x.slot===slot);
          return group.length?'<div class="arc-group-heading">'+label+'</div>'+group.map(card).join(''):'';
        }).join('')
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