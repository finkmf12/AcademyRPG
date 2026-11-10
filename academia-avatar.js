// Academy RPG · Ateliê Arcano
// Avatares vetoriais em camadas; itens e aparência sincronizados pelo Supabase.
(() => {
  'use strict';
  const C=()=>window.AcademiaCtx, $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const S={catalog:[],owned:[],appearance:{},balance:0,playerClass:'mago',tab:'shop',filter:'all',previewId:null,guest:false,busy:false,error:null};
  const SLOTS=[
    ['all','Todos'],['hair','Cabelos'],['hat','Chapéus'],['outfit','Roupas e armaduras'],
    ['cloak','Capas'],['mask','Máscaras'],['accessory','Acessórios'],['aura','Auras']
  ];
  const SLOT_NAME={hair:'Cabelo',hat:'Chapéu',outfit:'Roupa / armadura',cloak:'Capa',mask:'Máscara',accessory:'Acessório',aura:'Aura'};
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
    const small=variant==='rank'||variant==='mini';
    const scale=small?'100%':'100%';
    const id=(slot)=>a[slot]||'';
    const hair=id('hair'),hat=id('hat'),outfit=id('outfit'),cloak=id('cloak'),mask=id('mask'),accessory=id('accessory'),aura=id('aura');
    let out='';
    if(aura==='aura-ember')out+='<circle cx="100" cy="112" r="82" fill="none" stroke="#e58b55" stroke-width="5" opacity=".34" stroke-dasharray="7 7"><animate attributeName="opacity" values=".2;.5;.2" dur="4s" repeatCount="indefinite"/></circle>';
    if(aura==='aura-celestial'||aura==='aura-dedication')out+='<circle cx="100" cy="106" r="84" fill="none" stroke="'+(aura==='aura-dedication'?'#f1d58e':'#8dc7f1')+'" stroke-width="3" opacity=".55" stroke-dasharray="2 8"/><path d="M32 72 Q100 5 168 72" fill="none" stroke="#f4dfa8" stroke-width="2" opacity=".75"/>';
    if(accessory==='accessory-wings')out+='<path d="M69 139 Q13 105 24 73 Q57 79 75 122 Q52 83 55 58 Q84 75 87 128 M131 139 Q187 105 176 73 Q143 79 125 122 Q148 83 145 58 Q116 75 113 128" fill="#9bd7e8" fill-opacity=".5" stroke="#d5f2fa" stroke-width="3" stroke-linejoin="round"/>';
    if(cloak){
      const cc=cloak==='cloak-forest'?'#456c59':cloak==='cloak-night'?'#51416f':'#334c72';
      out+='<path d="M76 116 Q100 105 124 116 L149 194 Q100 214 51 194Z" fill="'+cc+'" stroke="#d6bd85" stroke-width="3"/><path d="M88 124 L100 197 L112 124" fill="none" stroke="#ffffff" stroke-opacity=".23" stroke-width="3"/>';
      if(cloak==='cloak-stars')out+='<g fill="#f4e1a5"><path d="M71 156 l3 6 6 1-6 3-3 6-2-6-6-3 6-1z"/><path d="M130 171 l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></g>';
    }
    // Corpo, braços e botas: base comum a todas as combinações.
    out+='<path d="M68 126 Q47 135 43 163 L54 169 L73 146 M132 126 Q153 135 157 163 L146 169 L127 146" fill="'+p.coat+'" stroke="#30283a" stroke-width="4" stroke-linejoin="round"/><path d="M55 164 Q61 156 69 160 L65 176 Q55 180 49 172Z M145 164 Q139 156 131 160 L135 176 Q145 180 151 172Z" fill="#efc69d" stroke="#30283a" stroke-width="3"/>';
    out+='<path d="M78 181 L76 205 Q87 214 98 207 L100 184 M122 181 L124 205 Q113 214 102 207 L100 184" fill="#34415a" stroke="#252c3c" stroke-width="3"/><path d="M72 202 Q85 199 98 206 L98 216 Q82 221 67 214Z M102 206 Q115 199 128 202 L133 214 Q118 221 102 216Z" fill="#493a35" stroke="#242332" stroke-width="3"/>';
    let coat=p.coat, trim=p.trim, dark=p.dark;
    if(outfit==='outfit-scholar'){coat='#55718b';trim='#c5d6df';dark='#293f57';}
    if(outfit==='outfit-ranger'){coat='#557958';trim='#d4bd7f';dark='#344a37';}
    if(outfit==='outfit-royal'){coat='#263d78';trim='#f0d18b';dark='#18264d';}
    if(outfit==='outfit-arcane'){coat='#634b8d';trim='#d9b8f0';dark='#342650';}
    if(outfit==='outfit-perfect'){coat='#76559b';trim='#f2d991';dark='#382952';}
    if(outfit==='outfit_logic'){coat='#60717b';trim='#a9d6df';dark='#2d3d4a';}
    out+='<path d="M69 126 Q100 108 131 126 L146 194 Q100 210 54 194Z" fill="'+coat+'" stroke="'+dark+'" stroke-width="4" stroke-linejoin="round"/><path d="M77 126 Q100 139 123 126 L112 163 L100 176 L88 163Z" fill="'+trim+'" opacity=".94"/><path d="M100 143 L100 190" stroke="'+dark+'" stroke-width="3"/><path d="M62 177 Q100 186 138 177 L141 188 Q100 199 59 188Z" fill="'+dark+'" stroke="'+trim+'" stroke-width="2"/><circle cx="100" cy="183" r="5" fill="'+trim+'"/>';
    if(outfit==='outfit-royal'||outfit==='outfit-perfect'||outfit==='outfit_logic')out+='<path d="M78 147 L88 157 L100 147 L112 157 L122 147" fill="none" stroke="'+trim+'" stroke-width="3"/>';
    // Pescoço, orelhas e rosto.
    out+='<path d="M88 111 L88 130 Q100 140 112 130 L112 111" fill="#e7b58d" stroke="#493b3a" stroke-width="2"/><ellipse cx="58" cy="78" rx="8" ry="12" fill="#efc59f" stroke="#473843" stroke-width="3"/><ellipse cx="142" cy="78" rx="8" ry="12" fill="#efc59f" stroke="#473843" stroke-width="3"/><ellipse cx="100" cy="78" rx="43" ry="48" fill="#f0c69f" stroke="#473843" stroke-width="4"/>';
    out+='<ellipse cx="84" cy="82" rx="5.2" ry="7" fill="#2a3044"/><ellipse cx="116" cy="82" rx="5.2" ry="7" fill="#2a3044"/><circle cx="86" cy="79" r="1.8" fill="#fff"/><circle cx="118" cy="79" r="1.8" fill="#fff"/><path d="M94 98 Q100 103 106 98" fill="none" stroke="#a75f5a" stroke-width="2.8" stroke-linecap="round"/><ellipse cx="75" cy="96" rx="7" ry="3.5" fill="#e9928b" opacity=".45"/><ellipse cx="125" cy="96" rx="7" ry="3.5" fill="#e9928b" opacity=".45"/>';
    // Cabelo independente.
    if(hair==='hair-cocoa')out+='<path d="M58 77 Q51 30 100 28 Q150 28 142 78 L132 66 Q119 57 110 48 Q94 68 67 67Z" fill="#55382f" stroke="#342b34" stroke-width="3"/>';
    else if(hair==='hair-silver')out+='<path d="M58 78 Q49 29 101 27 Q152 29 142 78 L132 65 Q113 57 108 46 Q88 65 67 66Z" fill="#d5d8e1" stroke="#737d91" stroke-width="3"/><path d="M69 43 Q100 24 127 43" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>';
    else if(hair==='hair-ember')out+='<path d="M58 78 Q49 29 101 27 Q152 29 142 78 L132 65 Q113 57 108 46 Q88 65 67 66Z" fill="#b95f39" stroke="#713b35" stroke-width="3"/><path d="M69 42 Q100 22 127 42" fill="none" stroke="#ffd08a" stroke-width="3"/>';
    else if(hair==='hair-stargazer')out+='<path d="M58 78 Q49 29 101 27 Q152 29 142 78 L132 65 Q113 57 108 46 Q88 65 67 66Z" fill="#536e9b" stroke="#2b4268" stroke-width="3"/><path d="M70 42 Q100 20 130 42" fill="none" stroke="#c6e4ff" stroke-width="3"/>';
    else out+='<path d="M59 78 Q52 31 100 29 Q147 31 141 78 L132 66 Q113 58 108 47 Q89 64 67 67Z" fill="#50372f" stroke="#342b34" stroke-width="3"/>';
    if(mask==='mask-fox')out+='<path d="M72 87 L64 72 L85 80 L100 75 L115 80 L136 72 L128 89 Q127 110 100 113 Q73 110 72 87Z" fill="#d28a4a" stroke="#553b37" stroke-width="3"/><path d="M91 93 L100 101 L109 93" fill="none" stroke="#fff0d1" stroke-width="4"/>';
    if(mask==='mask-raven')out+='<path d="M70 80 Q100 68 130 80 L124 105 Q100 117 76 105Z" fill="#344154" stroke="#1d283a" stroke-width="3"/><path d="M100 91 L114 100 L100 107 L86 100Z" fill="#a8b7c7"/>';
    if(mask==='mask-flame')out+='<path d="M72 82 Q100 70 128 82 L124 105 Q100 116 76 105Z" fill="#9d4a37" stroke="#f2b36d" stroke-width="3"/><path d="M100 84 Q111 96 100 107 Q89 96 100 84Z" fill="#f7d58f"/>';
    if(hat==='hat-apprentice')out+='<path d="M61 63 Q100 22 139 63 L135 76 Q100 89 65 76Z" fill="#8b684d" stroke="#493b3a" stroke-width="3"/><path d="M63 68 Q100 81 137 68" fill="none" stroke="#e0c38b" stroke-width="5"/>';
    if(hat==='hat-wizard')out+='<path d="M62 66 Q82 44 80 5 Q104 25 119 10 Q117 43 139 66Z" fill="#51427d" stroke="#2c294f" stroke-width="3"/><path d="M80 51 Q100 58 127 51" fill="none" stroke="#e1c47d" stroke-width="5"/><path d="M103 29 l4 8 8 2-8 3-4 8-3-8-8-3 8-2Z" fill="#f6e1a2"/>';
    if(hat==='hat-ranger')out+='<path d="M54 64 Q100 39 146 64 L139 75 Q100 84 61 75Z" fill="#557456" stroke="#334b3b" stroke-width="3"/><path d="M59 66 Q100 53 141 66" fill="none" stroke="#d6c38b" stroke-width="4"/>';
    if(hat==='hat-royal')out+='<path d="M66 64 L72 35 L91 51 L101 26 L112 51 L130 35 L136 66Z" fill="#d7b45f" stroke="#74552e" stroke-width="3"/><path d="M68 65 L134 65" stroke="#f5e2a6" stroke-width="5"/><circle cx="101" cy="42" r="5" fill="#8d5c9f"/>';
    if(hat==='hat-firstspark')out+='<path d="M65 64 Q100 34 135 64 L132 74 Q100 84 68 74Z" fill="#4f8064" stroke="#2e5443" stroke-width="3"/><path d="M98 47 l5 9 10 2-10 4-5 9-4-9-10-4 10-2Z" fill="#e9d58e"/>';
    if(accessory==='accessory-staff')out+='<path d="M45 121 L34 197" stroke="#8b6845" stroke-width="7" stroke-linecap="round"/><path d="M34 112 Q34 101 45 98 Q56 101 56 112 Q56 123 45 125 Q34 123 34 112Z" fill="#8dd0ef" stroke="#e4d18b" stroke-width="3"/>';
    if(accessory==='accessory-orb')out+='<circle cx="156" cy="139" r="14" fill="#7fc9ee" fill-opacity=".72" stroke="#d9e8ff" stroke-width="3"/><circle cx="151" cy="134" r="4" fill="#fff"/><path d="M142 156 Q156 164 169 154" fill="none" stroke="#d6b46b" stroke-width="2"/>';
    if(accessory==='accessory-scholar')out+='<circle cx="100" cy="166" r="12" fill="#d9b96d" stroke="#fff0b5" stroke-width="3"/><path d="M94 166 L99 171 L108 160" fill="none" stroke="#5b472b" stroke-width="3"/>';
    return '<svg class="arc-avatar arc-avatar-'+esc(variant||'default')+'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 225" role="img" aria-label="Personagem medieval personalizado" style="width:'+scale+';height:100%;display:block;overflow:visible" focusable="false">'+out+'</svg>';
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
    S.catalog=catalog.data||[];S.owned=owned.data||[];S.appearance=profile.data?.appearance||{};
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
    return '<article class="arc-item-card arc-rarity-'+(RARITY[x.rarity]||'common')+'"><div class="arc-item-visual">'+render(preview,'item',S.playerClass)+'</div><div class="arc-item-copy"><div class="arc-item-top"><span>'+esc(SLOT_NAME[x.slot]||x.slot)+'</span><b>'+esc(x.rarity)+'</b></div><h4>'+esc(x.name)+'</h4><p>'+esc(x.description)+'</p><div class="arc-item-bottom">'+action+'</div><div class="arc-item-actions"><button class="arc-preview-btn '+(S.previewId===x.id?'active':'')+'" data-avatar-action="preview" data-id="'+esc(x.id)+'">'+(S.previewId===x.id?'Em prévia':'Experimentar')+'</button>'+main+'</div></div></article>';
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
    const cats=SLOTS.map(x=>'<button class="arc-filter '+(S.filter===x[0]?'active':'')+'" data-avatar-filter="'+x[0]+'">'+x[1]+'</button>').join('');
    const tabs='<button class="arc-tab '+(S.tab==='shop'?'active':'')+'" data-avatar-tab="shop">Loja de visuais</button><button class="arc-tab '+(S.tab==='inventory'?'active':'')+'" data-avatar-tab="inventory">Meu inventário ('+S.owned.length+')</button>';
    const items=list.map(card).join('');
    root.innerHTML=
      '<section class="arc-hero"><div><div class="arc-eyebrow">✦ ATELIÊ ARCANO ✦</div><h3>Seu personagem, sua lenda.</h3><p>Combine cabelos, chapéus, roupas, capas, máscaras e itens mágicos. Os visuais conquistados por mérito ficam guardados para sempre.</p><div class="arc-wallet"><span>🪙</span><div><small>SALDO DISPONÍVEL</small><b>'+S.balance.toLocaleString('pt-BR')+' Coins</b></div></div></div><div class="arc-stage"><div class="arc-stage-glow"></div>'+render(current,'preview',S.playerClass)+'<div class="arc-stage-caption"><b>'+esc(previewName)+'</b><small>'+esc(SLOT_NAME[selected?.slot]||'Aventureiro')+'</small>'+previewButtons+'</div></div></section>'+
      '<div class="arc-toolbar"><div><h3>Guarda-roupa</h3><p>Os itens comprados usam as Coins que você já acumula na Academia.</p></div><div class="arc-tabs">'+tabs+'</div></div>'+
      (S.tab==='shop'?'<div class="arc-filters">'+cats+'</div>':'<div class="arc-inventory-note">Itens do inventário: '+S.owned.length+' · Recompensas de conquistas não custam Coins.</div>')+
      '<div class="arc-item-grid">'+(items||'<div class="arc-empty">'+(S.tab==='inventory'?'Você ainda não possui itens nesta categoria. Visite a loja ou complete conquistas para receber novos visuais.':'Nenhum item encontrado nesta categoria.')+'</div>')+'</div>'+
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
  window.AcademiaAvatar={render,open,renderAtelier};
})();