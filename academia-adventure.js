// Academia RPG · Expansão da Aventura
// Missões semanais, ranking, chefes, guildas e painel docente.
(() => {
  'use strict';
  const C=()=>window.AcademiaCtx, $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const n=v=>Number(v||0).toLocaleString('pt-BR');
  const cat=v=>({programacao:'Programação',banco:'Banco de Dados',modelagem:'Modelagem',geral:'Conhecimentos gerais'}[v]||v);
  const kind=v=>({quiz_count:'Quizzes concluídos',correct_answers:'Questões corretas',xp_earned:'XP conquistado',boss_wins:'Chefes derrotados'}[v]||v);
  const HEAD={
    missions:['JORNADA SEMANAL','Quadro de Missões','Desafios renovados a cada semana. Cumpra objetivos, receba XP e Coins.'],
    ranking:['SALÃO DOS CAMPEÕES','Ranking de Aventureiros','A evolução de cada aventureiro registrada na Academia.'],
    story:['JORNADA DO AVENTUREIRO','Modo História','Explore regiões, enfrente monstros e evolua em uma campanha individual.'],
    bosses:['ARENA DE COMBATE','Arena dos Chefes','Responda aos enigmas, proteja sua energia e conquiste recompensas.'],
    guilds:['SALÃO DAS GUILDAS','Guildas','Reúna aliados, compartilhe um código e evoluam em equipe.'],
    friends:['COMPANHEIROS DE JORNADA','Amigos','Encontre aventureiros e reúna seus aliados.'],
    teacher:['MESTRE DA ACADEMIA','Painel do Professor','Acompanhe a turma e administre a jornada de aprendizagem.']
  };
  const S={page:null,userKey:null,teacher:false,data:null,period:'all',teacherTab:'overview',guildTab:'directory',guildQuery:'',friendQuery:'',friendResults:[],studentQuery:'',missionDraft:null,bossDraft:null,battle:null,storyBattle:null,storyState:null,flagDraft:null,busy:false};
  const toast=m=>C()?.toast?.(m);
  async function rpc(name,args={}){const c=C();if(!c?.supabase||!c.user||c.guest)throw Error('Entre com sua conta Google para usar este recurso.');const {data,error}=await c.supabase.rpc(name,args);if(error)throw error;return data;}
  const wait=m=>`<div class="adv-panel"><div class="adv-loading"><span class="adv-spinner"></span>${esc(m||'Consultando os registros da Academia...')}</div></div>`;
  const fail=m=>`<div class="adv-panel"><div class="adv-empty"><b>Não foi possível carregar esta área.</b>${esc(m)}<br><button class="adv-btn adv-btn-soft" data-adv="retry">Tentar novamente</button></div></div>`;
  const metric=(label,value,icon)=>`<article class="adv-stat"><span>${icon}</span><small>${esc(label)}</small><strong>${esc(value)}</strong></article>`;
  const bar=(v,t)=>`<div class="adv-progress" role="progressbar" aria-valuenow="${t?Math.min(100,Math.round(v/t*100)):0}" aria-valuemin="0" aria-valuemax="100"><i style="width:${t?Math.min(100,Math.round(v/t*100)):0}%"></i></div>`;
  const badge=(s,k='')=>`<span class="adv-badge ${esc(k)}">${esc(s)}</span>`;
  const bossImage=(boss,large=false)=>{
    const files={'guardiao-dados':'boss-guardiao-dados.svg','sentinela-codigo':'boss-sentinela-codigo.svg','oraculo-uml':'boss-oraculo-uml.svg'};
    const key=String(boss?.id||'');
    const file=files[key]||files[({'banco':'guardiao-dados','programacao':'sentinela-codigo','modelagem':'oraculo-uml'})[boss?.category]]||files['guardiao-dados'];
    return '<img class="adv-boss-portrait'+(large?' large':'')+'" src="./assets/'+file+'" alt="Retrato de '+esc(boss?.name||'chefe da Academia')+'" loading="eager">';
  };
  const FLAG_COLOR_OPTIONS=[['#9f3e40','Carmesim'],['#3b638a','Azul real'],['#34465d','Azul ardósia'],['#426c56','Verde bosque'],['#936533','Bronze'],['#71538c','Violeta'],['#d0b36b','Ouro antigo'],['#303b4d','Aço escuro'],['#d9d6cd','Marfim'],['#263d32','Verde esmeralda'],['#5b315f','Ametista'],['#8b542e','Cobre'],['#a7b6c9','Prata lunar'],['#20202d','Ônix'],['#b84e35','Vermelho rubi'],['#477b83','Turquesa'],['#d6a84f','Dourado solar'],['#6d789e','Azul místico']];
  const FLAG_PATTERNS=[['solid','Liso'],['horizontal','Faixas horizontais'],['vertical','Faixas verticais'],['diagonal','Diagonal'],['cross','Cruz'],['chevron','Chevrons'],['quartered','Partido'],['waves','Ondas'],['diamond','Losangos'],['stripes','Listras triplas'],['sunburst','Raio solar']];
  const FLAG_SYMBOLS=['⚔️','🐉','🦉','🦅','🐺','🛡️','✦','♛','🌙','🔥','🦁','🦌','🦊','🗡️','🏰','⚜️','☀️','❖','🪽','💎','🌿','👑'];
  const FLAG_CRESTS=[['classic','Clássico'],['heater','Medieval'],['kite','Pipa'],['round','Circular'],['tower','Torre'],['pointed','Pontudo']];
  const FLAG_SHIELDS=[['steel','Aço polido'],['royal','Real dourado'],['obsidian','Obsidiana'],['winged','Alado']];
  const GUILD_SHOP_ITEMS=[
    ['guild-crest-dragon','Brasão do Dragão','crest','🐉'],['guild-crest-phoenix','Brasão da Fênix','crest','🔥'],
    ['guild-shield-royal','Escudo da Realeza','shield','🛡️'],['guild-shield-obsidian','Escudo de Obsidiana','shield','⚔️'],
    ['guild-effect-aurora','Aura Boreal','effect','✨'],['guild-effect-flame','Chamas Arcanas','effect','🔥'],['guild-effect-runes','Runas Luminosas','effect','ᚱ']
  ];
  const ownedGuildItems=type=>[['','Nenhum item equipado'],...((S.guildItems||[]).filter(x=>!type||x.id.startsWith('guild-'+type+'-')).map(x=>[x.id,x.name]))];
  const flagConfig=raw=>({
    primary:FLAG_COLOR_OPTIONS.some(x=>x[0]===raw?.primary)?raw.primary:'#303b4d',
    secondary:FLAG_COLOR_OPTIONS.some(x=>x[0]===raw?.secondary)?raw.secondary:'#d0b36b',
    pattern:FLAG_PATTERNS.some(x=>x[0]===raw?.pattern)?raw.pattern:'diagonal',
    symbol:FLAG_SYMBOLS.includes(raw?.symbol)?raw.symbol:'⚔️',
    crest:FLAG_CRESTS.some(x=>x[0]===raw?.crest)?raw.crest:'heater',
    shield:FLAG_SHIELDS.some(x=>x[0]===raw?.shield)?raw.shield:'steel',
    crestItem:GUILD_SHOP_ITEMS.some(x=>x[0]===raw?.crestItem&&x[2]==='crest')?raw.crestItem:'',
    shieldItem:GUILD_SHOP_ITEMS.some(x=>x[0]===raw?.shieldItem&&x[2]==='shield')?raw.shieldItem:'',
    effectItem:GUILD_SHOP_ITEMS.some(x=>x[0]===raw?.effectItem&&x[2]==='effect')?raw.effectItem:'',
    motto:String(raw?.motto||'').slice(0,48)
  });
  const flagMarkup=(raw,size='mini')=>{
    const f=flagConfig(raw),classes=['adv-flag','adv-flag-'+size,'adv-flag--'+f.pattern,'adv-flag-shape-'+f.crest,'adv-flag-shield-'+f.shield];
    if(f.crestItem)classes.push('adv-flag-'+f.crestItem);
    if(f.shieldItem)classes.push('adv-flag-'+f.shieldItem);
    if(f.effectItem)classes.push('adv-flag-'+f.effectItem);
    return `<div class="${classes.join(' ')}" style="--flag-primary:${f.primary};--flag-secondary:${f.secondary}" role="img" aria-label="Brasão e escudo da guilda"><span class="adv-flag-symbol">${esc(f.symbol)}</span><i class="adv-flag-glint"></i></div>`;
  };
  function flagOptions(options,selected){return options.map(([value,label])=>`<option value="${esc(value)}" ${value===selected?'selected':''}>${esc(label)}</option>`).join('');}
  function flagEditor(g){
    const f=flagConfig(g.flag_config);
    return `<section class="adv-panel adv-flag-panel"><div class="adv-section-head"><div><h3>Forja de brasões e escudos</h3><small>Personalize a heráldica da guilda com cores, símbolos e relíquias compradas.</small></div><span class="adv-flag-editor-mark">⚜</span></div>
      <form id="advGuildFlagForm" class="adv-flag-editor" data-adv-form="save-guild-flag">
        <div class="adv-flag-preview-wrap"><div class="adv-flag-preview" id="advFlagPreview">${flagMarkup(f,'preview')}</div><small>Prévia ao vivo do brasão</small><p id="advFlagMottoPreview" class="adv-flag-motto-preview">${esc(f.motto||'O lema da guilda aparecerá aqui')}</p></div>
        <div class="adv-flag-controls">
          <label>Cor principal<select id="advFlagPrimary">${flagOptions(FLAG_COLOR_OPTIONS,f.primary)}</select></label>
          <label>Cor secundária<select id="advFlagSecondary">${flagOptions(FLAG_COLOR_OPTIONS,f.secondary)}</select></label>
          <label>Desenho da bandeira<select id="advFlagPattern">${flagOptions(FLAG_PATTERNS,f.pattern)}</select></label>
          <label>Símbolo central<select id="advFlagSymbol">${flagOptions(FLAG_SYMBOLS.map(x=>[x,x]),f.symbol)}</select></label>
          <label>Formato do brasão<select id="advFlagCrest">${flagOptions(FLAG_CRESTS,f.crest)}</select></label>
          <label>Acabamento do escudo<select id="advFlagShield">${flagOptions(FLAG_SHIELDS,f.shield)}</select></label>
          <label>Brasão especial da loja<select id="advFlagCrestItem">${flagOptions(ownedGuildItems('crest'),f.crestItem)}</select></label>
          <label>Escudo especial da loja<select id="advFlagShieldItem">${flagOptions(ownedGuildItems('shield'),f.shieldItem)}</select></label>
          <label>Efeito luminoso da loja<select id="advFlagEffectItem">${flagOptions(ownedGuildItems('effect'),f.effectItem)}</select></label>
          <label class="adv-flag-motto-field">Lema da guilda<input id="advFlagMotto" maxlength="48" value="${esc(f.motto)}" placeholder="Ex.: Unidos pela sabedoria"></label>
          <button class="adv-btn" type="submit">Salvar heráldica</button>
          <small class="adv-flag-permission">Somente o líder pode alterar. Itens especiais precisam estar no inventário do líder; todos os membros verão a heráldica salva.</small>
        </div>
      </form></section>`;
  }
  function updateFlagPreview(){
    const wrap=$('advFlagPreview');if(!wrap)return;
    const f=flagConfig({primary:$('advFlagPrimary')?.value,secondary:$('advFlagSecondary')?.value,pattern:$('advFlagPattern')?.value,symbol:$('advFlagSymbol')?.value,crest:$('advFlagCrest')?.value,shield:$('advFlagShield')?.value,crestItem:$('advFlagCrestItem')?.value,shieldItem:$('advFlagShieldItem')?.value,effectItem:$('advFlagEffectItem')?.value,motto:$('advFlagMotto')?.value});
    wrap.innerHTML=flagMarkup(f,'preview');
    const motto=$('advFlagMottoPreview');if(motto)motto.textContent=f.motto||'O lema da guilda aparecerá aqui';
  }

  function mount(){
    const nav=document.querySelector('.rpgnav-adventure');if(!nav||nav.querySelector('[data-adventure="missions"]'))return;
    nav.insertAdjacentHTML('beforeend',`
      <button type="button" data-adventure="missions"><span class="ico">✦</span> Missões Semanais</button>
      <button type="button" data-adventure="ranking"><span class="ico">♛</span> Ranking</button>
      <button type="button" data-adventure="story"><span class="ico">📜</span> Modo História</button>
      <button type="button" data-adventure="bosses"><span class="ico">🐉</span> Arena dos Chefes</button>
      <button type="button" data-adventure="guilds"><span class="ico">⚑</span> Guildas</button>
      <button type="button" data-adventure="friends"><span class="ico">♟</span> Amigos</button>
      <button type="button" data-adventure="teacher" id="advTeacherNav" hidden><span class="ico">⚜</span> Painel do Professor</button>`);
  }
  async function sync(){
    const c=C();if(!c)return;const key=c.guest?'guest':(c.user?.id||null),admin=$('advTeacherNav');
    if(!key){S.userKey=null;S.teacher=false;S.data=null;S.battle=null;S.storyBattle=null;S.storyState=null;if(admin)admin.hidden=true;return;}
    if(key===S.userKey)return;S.userKey=key;S.teacher=false;S.data=null;S.battle=null;S.storyBattle=null;S.storyState=null;
    if(c.guest){if(admin)admin.hidden=true;return;}
    try{S.teacher=!!(await rpc('is_academy_teacher'));}catch(e){console.warn('Perfil docente:',e.message);}
    if(admin)admin.hidden=!S.teacher;if(S.page==='teacher'&&!S.teacher)open('missions');
  }
  function open(page){
    const c=C();if(!HEAD[page])return;
    if(!c?.user||c.guest){toast('Entre com sua conta Google para usar este recurso. O modo convidado não salva progresso.');return;}
    if(page==='teacher'&&!S.teacher){toast('O painel do professor é restrito a contas autorizadas.');return;}
    mount();S.page=page;$('home').style.display='none';$('library').style.display='none';$('storageNotice').style.display='none';$('rpgView').style.display='block';
    document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.rpgnav button').forEach(b=>b.classList.toggle('active',b.dataset.rpg===page||b.dataset.adventure===page));
    $('pageKicker').textContent=HEAD[page][0];$('pageTitle').textContent=HEAD[page][1];$('pageSub').textContent=HEAD[page][2];
    $('rpgView').innerHTML=wait();load().catch(e=>{$('rpgView').innerHTML=fail(e.message||'Erro inesperado.');});
  }
  async function load(){if(S.page==='missions')return missions();if(S.page==='ranking')return ranking();if(S.page==='story')return story();if(S.page==='bosses')return bosses();if(S.page==='guilds')return guilds();if(S.page==='friends')return friends();if(S.page==='teacher')return teacher();}

  async function missions(){
    const items=await rpc('get_weekly_missions');
    const cards=(items||[]).map(m=>{
      const done=Number(m.progress)>=Number(m.target),pct=m.target?Math.min(100,Math.round(m.progress/m.target*100)):0;
      const action=m.claimed?'<button class="adv-btn adv-btn-done" disabled>Recompensa resgatada</button>':
        done?`<button class="adv-btn" data-adv="claim" data-id="${esc(m.id)}">Resgatar recompensa</button>`:
        '<button class="adv-btn adv-btn-disabled" disabled>Em andamento</button>';
      return `<article class="adv-mission"><div class="adv-card-top"><span class="adv-card-symbol">✦</span>${badge(m.claimed?'Concluída':done?'Pronta para resgate':'Em andamento',m.claimed?'good':done?'ready':'')}</div>
        <h4>${esc(m.title)}</h4><p>${esc(m.description)}</p><div class="adv-progress-label"><span>${n(m.progress)} / ${n(m.target)} · ${esc(kind(m.kind))}</span><b>${pct}%</b></div>
        ${bar(m.progress,m.target)}<div class="adv-reward-line"><span>✧ ${n(m.xp_reward)} XP</span><span>🪙 ${n(m.coin_reward)} Coins</span></div>${action}</article>`;
    }).join('');
    $('rpgView').innerHTML=`<section class="adv-hero"><div><div class="adv-kicker">CAPÍTULO DA SEMANA</div><h3>Pequenos feitos. Grandes lendas.</h3><p>As missões acompanham suas atividades reais. A conclusão e o resgate são conferidos pelo servidor e só podem ser feitos uma vez por semana.</p></div><div class="adv-hero-mark">✦</div></section>
      <div class="adv-section-head"><div><h3>Contratos disponíveis</h3><small>O quadro se renova toda segunda-feira.</small></div><button class="adv-btn adv-btn-soft" data-adv="retry">Atualizar</button></div>
      <div class="adv-grid">${cards||'<div class="adv-panel adv-empty">Nenhuma missão ativa neste momento.</div>'}</div>
      <p class="adv-footnote">As recompensas de XP respeitam o limite diário da Academia. Coins entram na carteira do Mercado Arcano.</p>`;
  }
  async function ranking(){
    const r=await rpc('get_leaderboard',{p_period:S.period}),rows=r.entries||[];
    const list=rows.map(e=>`<div class="adv-rank-row ${e.rank<=3?'top-'+e.rank:''} ${e.is_me?'is-me':''}">
      <span class="adv-rank-number">${e.rank<=3?['♛','Ⅱ','Ⅲ'][e.rank-1]:n(e.rank)}</span><span class="adv-rank-avatar">${window.AcademiaAvatar ? window.AcademiaAvatar.render(e.appearance||{},'rank',e.class) : esc(e.avatar||'🧙')}</span>
      <div class="adv-rank-name"><b>${window.AcademiaAvatar?.nameMarkup(e.name,e.appearance||{})||esc(e.name)}</b>${window.AcademiaAvatar?.titleMarkup(e.appearance||{},'rank') || ''}<small>${esc(e.class||'Aventureiro')} · Nível ${n(e.level)}</small></div>
      <strong>${n(e.xp)} <small>XP</small></strong>${e.is_me?badge('Você','ready'):''}</div>`).join('');
    const me=r.my_rank?`Sua posição: #${n(r.my_rank)}`:'Seu personagem ainda não aparece nesta classificação.';
    $('rpgView').innerHTML=`<section class="adv-hero adv-rank-hero"><div><div class="adv-kicker">SALÃO DOS CAMPEÕES</div><h3>O conhecimento é sua maior arma.</h3><p>${esc(me)} Complete seu personagem para escolher o nome que será exibido aos outros aventureiros.</p></div><div class="adv-hero-mark">♛</div></section>
      <div class="adv-rank-toolbar"><div class="adv-tabs"><button class="${S.period==='all'?'active':''}" data-adv="period" data-period="all">Geral</button><button class="${S.period==='week'?'active':''}" data-adv="period" data-period="week">Esta semana</button><button class="${S.period==='month'?'active':''}" data-adv="period" data-period="month">Este mês</button></div><span class="adv-muted">Até 50 aventureiros</span></div>
      <section class="adv-panel"><div class="adv-section-head"><div><h3>Classificação</h3><small>Somente XP validado pela Academia.</small></div></div><div class="adv-rank-list">${list||'<div class="adv-empty">Ainda não há aventureiros no ranking. Seja o primeiro a treinar!</div>'}</div></section>
      <p class="adv-footnote">O ranking mostra apenas nome de aventureiro, avatar, classe, nível e XP. E-mails não são exibidos.</p>`;
  }

  const STORY_MONSTERS={goblin:'👺',spider:'🕷️',shaman:'🧙','goblin-king':'👑',kobold:'⛏️',orc:'🏹','orc-brute':'🪓','orc-general':'⚔️',skeleton:'💀',archer:'🏹',knight:'🛡️',lich:'☠️',draconian:'🐲',wyvern:'🐉','dragon-warden':'🐉','ancient-dragon':'🐉','primordial-dragon':'🔥'};
  function storyArt(e,large=false){const icon=STORY_MONSTERS[e.monster_key]||'👾';return '<div class="adv-story-art'+(large?' large':'')+(e.is_boss?' boss':'')+'"><span>'+icon+'</span><i></i></div>';}
  async function story(){
    if(S.storyBattle&&!S.storyBattle.result)return storyFight();
    const data=await rpc('get_story_state');S.storyState=data;
    const encounters=data.encounters||[],current=encounters.find(x=>Number(x.stage_order)===Number(data.current_stage));
    const cleared=encounters.filter(x=>x.status==='cleared').length,pct=data.total_stages?Math.round(cleared/data.total_stages*100):0;
    const chapters=[...new Map(encounters.map(x=>[x.chapter,x.chapter_name])).entries()];
    const chapterHtml=chapters.map(([chapter,name])=>{
      const rows=encounters.filter(x=>x.chapter===chapter);
      const nodes=rows.map(e=>{
        const status=e.status,klass=status==='cleared'?'cleared':status==='available'?'available':'locked';
        const tag=status==='cleared'?badge('Derrotado','good'):status==='available'?badge('Sua próxima batalha','ready'):badge('Bloqueado');
        const difficulty=['','Iniciante','Intermediário','Avançado','Lendário'][Number(e.difficulty)]||'';
        const btn=status==='available'?'<button class="adv-btn" data-adv="start-story" data-id="'+esc(e.id)+'">⚔ Enfrentar</button>':status==='cleared'?'<button class="adv-btn adv-btn-done" disabled>✓ Concluído</button>':'<button class="adv-btn adv-btn-disabled" disabled>🔒 Bloqueado</button>';
        return '<article class="adv-story-node '+klass+(e.is_boss?' is-boss':'')+'">'+tag+storyArt(e)+'<div class="adv-story-node-copy"><small>ETAPA '+e.stage_order+(e.is_boss?' · CHEFE':' · MONSTRO')+'</small><h4>'+esc(e.name)+'</h4><p>'+esc(e.description)+'</p><div class="adv-story-meta"><span>'+difficulty+'</span><span>'+e.question_count+' questões</span><span>'+e.required_correct+' acertos para vencer</span></div><div class="adv-reward-line"><span>✧ '+n(e.xp_reward)+' XP</span><span>🪙 '+n(e.coin_reward)+' Coins</span></div>'+btn+'</div></article>';
      }).join('');
      return '<section class="adv-story-chapter"><div class="adv-story-chapter-head"><div><small>REGIÃO '+chapter+'</small><h3>'+esc(name)+'</h3></div><span>'+rows.filter(x=>x.status==='cleared').length+' / '+rows.length+'</span></div><div class="adv-story-nodes">'+nodes+'</div></section>';
    }).join('');
    const heroTitle=data.completed?'A campanha foi concluída!':current?'A jornada continua em '+current.region_name:'Sua lenda começa aqui';
    const heroText=data.completed?'Você atravessou todas as regiões e derrotou o Dragão Primordial. Seu nome ficará marcado na história da Academia.':current?'Sua próxima batalha é contra '+current.name+'. Vença para desbloquear a próxima criatura.':'Prepare-se para explorar a primeira região.';
    $('rpgView').innerHTML='<section class="adv-story-hero"><div><div class="adv-kicker">CAMPANHA INDIVIDUAL · 17 ETAPAS</div><h3>'+esc(heroTitle)+'</h3><p>'+esc(heroText)+'</p><div class="adv-story-progress-label"><span>Progresso da campanha</span><b>'+cleared+' / '+data.total_stages+' etapas</b></div>'+bar(cleared,data.total_stages)+'</div><div class="adv-story-hero-mark">📜</div></section>'+
      '<div class="adv-story-stats">'+metric('Vitórias registradas',n(data.total_victories),'⚔️')+metric('Regiões','4 + final','🗺️')+metric('Progresso',pct+'%','✦')+'</div>'+
      '<div class="adv-story-intro"><div><span class="adv-kicker">MAPA DA JORNADA</span><h3>Seu caminho até o Dragão Primordial</h3><p>As questões ficam mais difíceis a cada região. Derrote os monstros para liberar o próximo caminho.</p></div><span class="adv-story-legend">'+badge('Concluído','good')+' '+badge('Disponível','ready')+' '+badge('Bloqueado')+'</span></div>'+
      (chapterHtml||'<div class="adv-panel adv-empty">A campanha ainda não possui etapas cadastradas.</div>')+
      '<p class="adv-footnote">Cada vitória concede XP e Coins uma única vez. Se for derrotado, você pode tentar novamente a mesma criatura. Seu avanço é individual e fica salvo na conta.</p>';
  }
  async function startStory(id){
    if(S.busy)return;S.busy=true;$('rpgView').innerHTML=wait('A criatura se aproxima. Preparando os enigmas...');
    try{const d=await rpc('start_story_battle',{p_encounter_id:id});S.storyBattle={id:d.session_id,encounter:d.encounter,questions:d.questions||[],index:0,correct:0,wrong:0,answered:false,result:null};await storyFight();}
    catch(e){$('rpgView').innerHTML=fail(e.message||'Não foi possível iniciar esta batalha.');}
    finally{S.busy=false;}
  }
  function storyFight(){
    const b=S.storyBattle;if(!b)return story();const e=b.encounter,q=b.questions[b.index];
    if(b.result)return storyResult(b.result);
    const foeHp=Math.max(0,e.required_correct-b.correct),heroHp=Math.max(0,3-b.wrong);
    const kind=e.is_boss?'CHEFE DA REGIÃO':'ENCONTRO DE COMBATE';
    $('rpgView').innerHTML='<section class="adv-story-fight-banner"><div><div class="adv-kicker">'+kind+' · ETAPA '+e.stage_order+'</div><h3>'+esc(e.name)+'</h3><p>'+esc(e.description)+'</p><span class="adv-story-region">'+esc(e.chapter_name)+'</span></div>'+storyArt(e,true)+'</section>'+
      '<section class="adv-story-hud"><div class="adv-hp-card boss-hp"><div class="adv-hp-top"><b>👹 Resistência do monstro</b><strong>'+foeHp+' golpes restantes</strong></div>'+bar(e.required_correct-foeHp,e.required_correct)+'<small>Cada resposta correta enfraquece a criatura.</small></div><div class="adv-hp-card hero-hp"><div class="adv-hp-top"><b>🛡 Sua energia</b><strong>'+heroHp+' / 3</strong></div>'+bar(heroHp,3)+'<small>Erros reduzem sua energia, mas você pode concluir o desafio.</small></div></section>'+
      '<section class="adv-panel adv-question-panel adv-story-question"><div class="adv-question-top"><span>Conhecimento nível '+e.difficulty+' · Questão '+(b.index+1)+' de '+b.questions.length+'</span><button class="adv-link-btn" data-adv="leave-story">Voltar ao mapa</button></div>'+bar(b.index,b.questions.length)+'<h3>'+esc(q.prompt)+'</h3><div class="adv-answer-list">'+q.options.map((o,i)=>'<button class="adv-answer '+(b.answered&&b.selected===i?(b.lastCorrect?'correct':'incorrect'):'')+'" data-adv="answer-story" data-index="'+i+'" '+(b.answered?'disabled':'')+'><b>'+'ABCD'[i]+'</b><span>'+esc(o)+'</span></button>').join('')+'</div><div id="advStoryFeedback">'+(b.answered?'<div class="adv-feedback '+(b.lastCorrect?'correct':'incorrect')+'">'+(b.lastCorrect?'Golpe certeiro!':'A criatura resistiu ao golpe.')+' '+esc(b.explanation||'')+'<button class="adv-btn" data-adv="next-story">'+(b.index===b.questions.length-1?'Concluir combate':'Próxima questão')+'</button></div>':'<p class="adv-muted">Escolha uma alternativa para atacar. A resposta é conferida pelo servidor.</p>')+'</div></section>';
  }
  async function answerStory(index){
    const b=S.storyBattle;if(!b||b.answered||S.busy)return;const q=b.questions[b.index],answer=q?.options?.[index];if(answer==null)return;S.busy=true;
    const fb=$('advStoryFeedback');if(fb)fb.textContent='Avaliando seu ataque...';
    try{const r=await rpc('answer_quiz_question',{p_session:b.id,p_question_id:q.id,p_answer:answer});b.answered=true;b.selected=index;b.lastCorrect=!!r.is_correct;b.explanation=r.explanation||'';if(r.is_correct)b.correct++;else b.wrong++;storyFight();}
    catch(e){if(fb)fb.innerHTML='<div class="adv-feedback incorrect">'+esc(e.message||'Não foi possível validar a resposta.')+'<button class="adv-btn adv-btn-soft" data-adv="retry-story-answer">Tentar novamente</button></div>';}
    finally{S.busy=false;}
  }
  async function finishStory(){
    const b=S.storyBattle;if(!b||S.busy)return;
    if(!b.answered||b.index!==b.questions.length-1){toast('Responda todas as questões antes de concluir.');return;}
    S.busy=true;$('rpgView').innerHTML=wait('Calculando sua vitória ou derrota...');
    let timeoutId;
    try{
      const result=await Promise.race([
        rpc('finish_story_battle',{p_session:b.id}),
        new Promise((_,reject)=>{timeoutId=setTimeout(()=>reject(new Error('A avaliação está demorando mais que o esperado. Tente registrar novamente; sua tentativa não será duplicada.')),18000);})
      ]);
      b.result=result;
      $('rpgView').innerHTML=storyResult(result);
      if(result.won)toast('Vitória! +'+n(result.xp_awarded)+' XP e +'+n(result.coins_awarded)+' Coins.');
      else toast('A criatura resistiu. Você pode tentar novamente!');
    }catch(e){
      $('rpgView').innerHTML='<section class="adv-panel adv-empty"><b>Não foi possível concluir a avaliação.</b><p>'+esc(e.message||'Falha ao registrar o resultado.')+'</p><button class="adv-btn" data-adv="finish-story">Tentar registrar novamente</button><button class="adv-btn adv-btn-soft" data-adv="story-map">Voltar ao mapa</button></section>';
    }finally{clearTimeout(timeoutId);S.busy=false;}
  }
  function storyResult(r){
    const b=S.storyBattle,e=b.encounter;
    if(r.won)return '<section class="adv-story-result victory"><div class="adv-story-result-mark">🏆</div><div class="adv-kicker">'+(r.campaign_complete?'FIM DA CAMPANHA':'VITÓRIA NA JORNADA')+'</div><h3>'+(r.campaign_complete?'O Dragão Primordial foi derrotado!':'Você derrotou '+esc(e.name)+'!')+'</h3><p>Você acertou '+n(r.correct)+' de '+n(r.total)+' questões e abriu o tesouro da batalha.</p><div class="adv-result-rewards"><b>✧ +'+n(r.xp_awarded)+' XP</b><b>🪙 +'+n(r.coins_awarded)+' Coins</b></div><button class="adv-btn" data-adv="story-continue">'+(r.campaign_complete?'Ver campanha concluída':'Avançar para a próxima etapa')+'</button></section>';
    return '<section class="adv-story-result defeat"><div class="adv-story-result-mark">🛡️</div><div class="adv-kicker">FIM DO COMBATE</div><h3>'+esc(e.name)+' venceu desta vez.</h3><p>Você acertou '+n(r.correct)+' de '+n(r.total)+' questões. São necessários '+n(r.required)+' acertos para vencer.</p><p class="adv-muted">Revise o conteúdo e tente novamente. Seu progresso anterior permanece salvo.</p><button class="adv-btn" data-adv="story-retry">Tentar novamente</button><button class="adv-btn adv-btn-soft" data-adv="story-map">Voltar ao mapa</button></section>';
  }

  async function bosses(){
    if(S.battle&&!S.battle.result)return fight();
    const list=await rpc('get_boss_catalog');
    const cards=(list||[]).map(b=>{
      const icon={programacao:'⌘',banco:'▤',modelagem:'◇',geral:'✦'}[b.category]||'🐉';
      return `<article class="adv-boss-card ${b.defeated?'defeated':''}"><div class="adv-boss-art">${bossImage(b)}<small>${esc(cat(b.category))}</small></div>
        <div class="adv-boss-content">${badge(b.defeated?'Derrotado nesta semana':'Chefe disponível',b.defeated?'good':'danger')}<h4>${esc(b.name)}</h4><p>${esc(b.description)}</p>
        <div class="adv-boss-requirement">Vitória: <b>${n(b.min_correct)} acertos de 6</b></div><div class="adv-reward-line"><span>✧ ${n(b.xp_reward)} XP</span><span>🪙 ${n(b.coin_reward)} Coins</span></div>
        <small class="adv-muted">${b.best_correct?`Melhor tentativa: ${n(b.best_correct)}/6`:'Nenhuma tentativa nesta semana'}</small>
        <button class="adv-btn ${b.defeated?'adv-btn-disabled':''}" data-adv="start-boss" data-id="${esc(b.id)}" ${b.defeated?'disabled':''}>${b.defeated?'Vitória registrada':'Entrar na batalha'}</button></div></article>`;
    }).join('');
    $('rpgView').innerHTML=`<section class="adv-hero adv-boss-hero"><div><div class="adv-kicker">PORTAIS DE COMBATE</div><h3>Seu conhecimento será posto à prova.</h3><p>Cada batalha usa seis questões sorteadas do banco seguro da Academia. Acerte o suficiente para vencer e receber o tesouro.</p></div><div class="adv-hero-mark">🐉</div></section>
      <div class="adv-grid adv-boss-grid">${cards||'<div class="adv-panel adv-empty">Nenhum chefe ativo. O professor pode convocar novos desafios.</div>'}</div>
      <p class="adv-footnote">Cada chefe concede recompensa uma vez por aventureiro a cada semana. Tentativas incompletas não dão prêmio.</p>`;
  }
  async function startBoss(id){
    if(S.busy)return;S.busy=true;$('rpgView').innerHTML=wait('Invocando o chefe e preparando seis questões...');
    try{const d=await rpc('start_boss_battle',{p_boss_id:id});S.battle={id:d.session_id,boss:d.boss,questions:d.questions||[],index:0,correct:0,wrong:0,answered:false,result:null};await fight();}
    catch(e){$('rpgView').innerHTML=fail(e.message||'Não foi possível iniciar a batalha.');}
    finally{S.busy=false;}
  }
  function fight(){
    const b=S.battle;if(!b)return bosses();const boss=b.boss,done=!!b.result,q=b.questions[b.index];
    const bossHp=Math.max(0,boss.min_correct-b.correct),heroHp=Math.max(0,3-b.wrong);
    $('rpgView').innerHTML=`<section class="adv-fight-banner"><div class="adv-fight-title"><div class="adv-kicker">ARENA DE COMBATE</div><h3>${esc(boss.name)}</h3><p>${esc(boss.description)}</p></div><div class="adv-fight-portrait">${bossImage(boss,true)}</div></section>
      <section class="adv-fight-hud"><div class="adv-hp-card boss-hp"><div class="adv-hp-top"><b>🐉 Energia do chefe</b><strong>${n(bossHp)} / ${n(boss.min_correct)}</strong></div>${bar(boss.min_correct-bossHp,boss.min_correct)}<small>Cada acerto enfraquece o guardião.</small></div>
      <div class="adv-hp-card hero-hp"><div class="adv-hp-top"><b>🛡 Sua resistência</b><strong>${n(heroHp)} / 3</strong></div>${bar(heroHp,3)}<small>Erros reduzem sua energia de combate.</small></div></section>
      ${done?bossResult(b.result):`<section class="adv-panel adv-question-panel"><div class="adv-question-top"><span>${esc(cat(boss.category))} · Enigma ${b.index+1} de ${b.questions.length}</span><button class="adv-link-btn" data-adv="leave-boss">Retornar à arena</button></div>
        ${bar(b.index,b.questions.length)}<h3>${esc(q.prompt)}</h3><div class="adv-answer-list">${q.options.map((o,i)=>`<button class="adv-answer ${b.answered&&b.selected===i?(b.lastCorrect?'correct':'incorrect'):''}" data-adv="answer-boss" data-index="${i}" ${b.answered?'disabled':''}><b>${'ABCD'[i]}</b><span>${esc(o)}</span></button>`).join('')}</div>
        <div id="advBattleFeedback">${b.answered?`<div class="adv-feedback ${b.lastCorrect?'correct':'incorrect'}">${b.lastCorrect?'Acerto confirmado!':'O chefe resistiu a este golpe.'} ${esc(b.explanation||'')}<button class="adv-btn" data-adv="next-boss">${b.index===b.questions.length-1?'Concluir batalha':'Próximo enigma'}</button></div>`:'<p class="adv-muted">Escolha uma alternativa. A resposta será conferida pelo servidor.</p>'}</div></section>`}`;
  }
  async function answerBoss(index){
    const b=S.battle;if(!b||b.answered||S.busy)return;const q=b.questions[b.index],answer=q?.options?.[index];if(answer==null)return;S.busy=true;
    const fb=$('advBattleFeedback');if(fb)fb.textContent='O guardião está avaliando sua resposta...';
    try{const r=await rpc('answer_quiz_question',{p_session:b.id,p_question_id:q.id,p_answer:answer});b.answered=true;b.selected=index;b.lastCorrect=!!r.is_correct;b.explanation=r.explanation||'';if(r.is_correct)b.correct++;else b.wrong++;fight();}
    catch(e){if(fb)fb.innerHTML=`<div class="adv-feedback incorrect">${esc(e.message||'Não foi possível validar a resposta.')}<button class="adv-btn adv-btn-soft" data-adv="retry-boss-answer">Tentar novamente</button></div>`;}
    finally{S.busy=false;}
  }
  async function finishBoss(){
    const b=S.battle;if(!b||S.busy)return;S.busy=true;$('rpgView').innerHTML=wait('Registrando resultado e calculando recompensas...');
    try{await rpc('finish_quiz',{p_session:b.id});b.result=await rpc('finish_boss_battle',{p_session:b.id});fight();
      const r=b.result;if(r.rewarded)toast(`Vitória! +${n(r.xp_awarded)} XP e +${n(r.coins_awarded)} Coins.`);
      else if(r.won)toast('Vitória registrada. A recompensa deste chefe já foi resgatada nesta semana.');else toast('O chefe resistiu. Treine e tente novamente!');
    }catch(e){$('rpgView').innerHTML=`<div class="adv-panel adv-empty"><b>Não foi possível registrar o final da batalha.</b>${esc(e.message||'')}<button class="adv-btn" data-adv="finish-boss">Tentar registrar novamente</button></div>`;}
    finally{S.busy=false;}
  }
  function bossResult(r){
    if(r.won)return `<div class="adv-battle-result victory"><div class="adv-result-icon">⚔</div><div class="adv-kicker">VITÓRIA NA ARENA</div><h3>O guardião foi derrotado!</h3><p>Você acertou ${n(r.correct)} das ${n(r.total)} questões e abriu o baú da batalha.</p>
      ${r.rewarded?`<div class="adv-result-rewards"><b>✧ +${n(r.xp_awarded)} XP</b><b>🪙 +${n(r.coins_awarded)} Coins</b></div>`:'<p class="adv-muted">Você já havia resgatado a recompensa deste chefe nesta semana.</p>'}<button class="adv-btn" data-adv="back-bosses">Voltar à arena</button></div>`;
    return `<div class="adv-battle-result defeat"><div class="adv-result-icon">🛡</div><div class="adv-kicker">FIM DA BATALHA</div><h3>O chefe ainda está de pé.</h3><p>Você acertou ${n(r.correct)} de ${n(r.total)} questões. São necessários ${n(r.required||S.battle?.boss?.min_correct||4)} acertos para vencer.</p><p class="adv-muted">Revise os conteúdos e volte mais forte. Nenhuma recompensa de chefe foi concedida nesta tentativa.</p><button class="adv-btn" data-adv="back-bosses">Voltar à arena</button></div>`;
  }

  async function guilds(tab){
    if(tab)S.guildTab=tab;
    const [mine,all]=await Promise.all([rpc('get_my_guild'),rpc('list_guilds')]);
    S.guildItems=[];
    if(mine?.guild?.owner){
      const owned=await C().supabase.from('user_cosmetics').select('item_id').eq('user_id',C().user.id);
      if(owned.error)throw owned.error;
      const ids=(owned.data||[]).map(x=>x.item_id).filter(id=>GUILD_SHOP_ITEMS.some(x=>x[0]===id));
      if(ids.length){const catalog=await C().supabase.from('market_items').select('id,name,icon').in('id',ids).eq('category','guild');if(catalog.error)throw catalog.error;S.guildItems=catalog.data||[];}
    }
    const guildRows=(all||[]).map(g=>`<article class="adv-guild-row" data-guild-search="${esc((g.name+' '+g.tag+' '+(g.description||'')).toLocaleLowerCase('pt-BR'))}"><div class="adv-guild-crest">${flagMarkup(g.flag_config,'mini')}</div><div class="adv-guild-info"><b>${esc(g.name)}</b><small>${esc(g.description||'Uma guilda em busca de novos aventureiros.')}</small><span>${n(g.members)} / 6 membros · ${n(g.total_xp)} XP somados</span></div>${g.joined?badge('Sua guilda','good'):badge('Guilda aberta')}</article>`).join('');
    const directory=`<div class="adv-guild-directory-tools"><input class="adv-input" id="advGuildSearch" type="search" placeholder="Buscar guilda por nome ou sigla..." value="${esc(S.guildQuery)}"><span>${n((all||[]).length)} guildas encontradas</span></div><div class="adv-guild-directory" id="advGuildDirectory">${guildRows||'<div class="adv-empty">Nenhuma guilda foi fundada ainda.</div>'}</div>`;
    const tabs=`<div class="adv-tabs adv-guild-tabs">${mine?.guild?`<button class="${S.guildTab==='mine'?'active':''}" data-adv="guild-tab" data-tab="mine">Minha guilda</button>`:''}<button class="${S.guildTab==='directory'?'active':''}" data-adv="guild-tab" data-tab="directory">Explorar guildas <span>${n((all||[]).length)}</span></button><button class="${S.guildTab==='manage'?'active':''}" data-adv="guild-tab" data-tab="manage">${mine?.guild?'Convites':'Fundar / entrar'}</button></div>`;
    if(mine?.guild && S.guildTab==='mine'){
      const g=mine.guild,ms=mine.members||[],f=flagConfig(g.flag_config);
      $('rpgView').innerHTML= tabs+`<section class="adv-hero adv-guild-hero"><div><div class="adv-kicker">SUA BANDEIRA</div><h3>${esc(g.name)} <small>[${esc(g.tag)}]</small></h3><p>${esc(g.description||'Uma irmandade de aventureiros.')}</p></div><div class="adv-guild-flag-side">${flagMarkup(f,'hero')}${f.motto?`<small>${esc(f.motto)}</small>`:''}</div></section>
        ${g.active?'':'<div class="adv-warning">Esta guilda foi temporariamente suspensa pelo professor. Seus membros podem consultar os dados e sair normalmente.</div>'}
        ${g.owner?flagEditor(g):''}
        <section class="adv-panel"><div class="adv-section-head"><div><h3>Companheiros de jornada</h3><small>${n(ms.length)} de 6 vagas ocupadas</small></div>${g.owner&&g.invite_code?`<button class="adv-btn adv-btn-soft" data-adv="copy-invite" data-code="${esc(g.invite_code)}">Convidar · ${esc(g.invite_code)}</button>`:''}</div>
        <div class="adv-member-list">${ms.map(m=>`<div class="adv-member"><span class="adv-rank-avatar">${esc(m.avatar||'🧙')}</span><div><b>${window.AcademiaAvatar?.nameMarkup(m.name,m.appearance||{})||esc(m.name)} ${m.is_me?'(você)':''}</b><small>${esc(m.role==='leader'?'Líder':m.role==='officer'?'Oficial':'Membro')} · ${esc(m.class||'Aventureiro')}</small></div><strong>${n(m.xp)} XP</strong></div>`).join('')}</div></section>
        <div class="adv-guild-actions"><p class="adv-footnote">O líder pode compartilhar o código de convite com até cinco companheiros.</p><button class="adv-btn adv-btn-danger" data-adv="leave-guild">Sair da guilda</button></div>`;return;
    }
    if(S.guildTab==='directory'){$('rpgView').innerHTML=tabs+`<section class="adv-hero adv-guild-hero"><div><div class="adv-kicker">DIRETÓRIO DA ACADEMIA</div><h3>Encontre sua próxima companhia.</h3><p>Explore as guildas, conheça seus brasões, veja a força de cada equipe e encontre um grupo para sua jornada.</p></div><div class="adv-hero-mark">⚑</div></section><section class="adv-panel"><div class="adv-section-head"><div><h3>Guildas da Academia</h3><small>Companhias ativas em ordem de atividade e força.</small></div></div>${directory}</section>`;return;}
    $('rpgView').innerHTML=tabs+`<section class="adv-hero adv-guild-hero"><div><div class="adv-kicker">AVENTUREIRO SOLITÁRIO?</div><h3>Encontre sua companhia.</h3><p>Crie uma guilda para liderar seus aliados ou entre em uma usando o código enviado pelo líder.</p></div><div class="adv-hero-mark">⚑</div></section>
      <div class="adv-guild-forms">
        <form class="adv-panel adv-form" data-adv-form="create-guild"><div class="adv-section-head"><div><h3>Fundar uma guilda</h3><small>Você será o líder inicial.</small></div></div>
          <label>Nome da guilda<input id="advGuildName" maxlength="24" minlength="3" required placeholder="Ex.: Ordem da Fênix"></label>
          <label>Sigla (2 a 5 letras/números)<input id="advGuildTag" maxlength="5" minlength="2" required placeholder="FENIX"></label>
          <label>Descrição (opcional)<textarea id="advGuildDescription" maxlength="140" rows="2" placeholder="Qual é o propósito da sua companhia?"></textarea></label><button class="adv-btn" type="submit">Criar guilda</button></form>
        <form class="adv-panel adv-form" data-adv-form="join-guild"><div class="adv-section-head"><div><h3>Entrar por convite</h3><small>Peça o código ao líder da guilda.</small></div></div>
          <label>Código de convite<input id="advGuildCode" maxlength="8" minlength="8" required placeholder="AB12CD34"></label><button class="adv-btn adv-btn-soft" type="submit">Entrar na guilda</button></form>
      </div>
      <section class="adv-panel"><div class="adv-section-head"><div><h3>Guildas da Academia</h3><small>Conheça as companhias que estão recrutando.</small></div></div>${directory}</section>`;
  }

  async function friends(){
    const rows=await rpc('list_my_friends');
    const groups={friend:rows.filter(x=>x.request_type==='friend'),received:rows.filter(x=>x.request_type==='received'),sent:rows.filter(x=>x.request_type==='sent')};
    const result=(S.friendResults||[]).map(x=>'<div class="adv-member"><span class="adv-rank-avatar">'+esc(x.avatar||'🧙')+'</span><div><b>'+esc(x.player_name)+'</b><small>'+n(x.total_xp)+' XP</small></div>'+(x.is_friend?badge('Amigo','good'):x.request_status==='sent'?badge('Enviado','ready'):'<button class="adv-btn" data-adv="friend-add" data-id="'+x.user_id+'">Adicionar</button>')+'</div>').join('');
    const cards=(arr,type)=>arr.map(x=>'<div class="adv-member"><span class="adv-rank-avatar">'+esc(x.avatar||'🧙')+'</span><div><b>'+esc(x.player_name)+'</b><small>'+n(x.total_xp)+' XP</small></div>'+(type==='received'?'<button class="adv-btn" data-adv="friend-accept" data-id="'+x.request_id+'">Aceitar</button><button class="adv-btn adv-btn-soft" data-adv="friend-reject" data-id="'+x.request_id+'">Recusar</button>':badge(type==='sent'?'Aguardando':'Amigo',type==='sent'?'ready':'good'))+'</div>').join('');
    $('rpgView').innerHTML='<section class="adv-hero"><div><div class="adv-kicker">REDE DE AVENTUREIROS</div><h3>Adicione seus amigos.</h3><p>Procure pelo nome de aventureiro e envie solicitações de amizade.</p></div><div class="adv-hero-mark">♟</div></section><section class="adv-panel"><form id="advFriendSearchForm" class="adv-guild-directory-tools"><input class="adv-input" id="advFriendSearch" minlength="2" placeholder="Nome do aventureiro..." value="'+esc(S.friendQuery)+'"><button class="adv-btn" type="submit">Buscar</button></form><div class="adv-member-list">'+(result||'<p class="adv-muted">Pesquise para encontrar amigos.</p>')+'</div></section><section class="adv-panel"><h3>Solicitações recebidas</h3><div class="adv-member-list">'+(cards(groups.received,'received')||'<p class="adv-muted">Nenhuma solicitação recebida.</p>')+'</div></section><section class="adv-panel"><h3>Meus amigos</h3><div class="adv-member-list">'+(cards(groups.friend,'friend')||'<p class="adv-muted">Você ainda não adicionou amigos.</p>')+'</div></section><section class="adv-panel"><h3>Solicitações enviadas</h3><div class="adv-member-list">'+(cards(groups.sent,'sent')||'<p class="adv-muted">Nenhuma solicitação enviada.</p>')+'</div></section>';
  }
  async function teacher(){
    if(!S.teacher)throw Error('Esta conta não possui permissão docente.');
    const d=await rpc('teacher_get_control_room');S.data=d;
    const tabs=[['overview','Visão geral'],['students','Alunos'],['missions','Missões'],['bosses','Chefes'],['guilds','Guildas']];
    const html=tabs.map(([id,label])=>`<button class="${S.teacherTab===id?'active':''}" data-adv="teacher-tab" data-tab="${id}">${label}</button>`).join('');
    const content=S.teacherTab==='students'?teacherStudents(d):S.teacherTab==='missions'?teacherMissions(d):S.teacherTab==='bosses'?teacherBosses(d):S.teacherTab==='guilds'?teacherGuilds(d):teacherOverview(d);
    $('rpgView').innerHTML=`<section class="adv-hero adv-teacher-hero"><div><div class="adv-kicker">CENTRO DE COMANDO DOCENTE</div><h3>O mestre acompanha a jornada.</h3><p>Consulte a evolução da turma e mantenha desafios, chefes e guildas organizados.</p></div><div class="adv-hero-mark">⚜</div></section><div class="adv-tabs adv-teacher-tabs">${html}</div><div class="adv-teacher-content">${content}</div>`;
  }
  function teacherOverview(d){
    const s=d.overview||{},top=(d.students||[]).slice(0,5).map((a,i)=>`<div class="adv-member"><span class="adv-rank-number">${i+1}</span><span class="adv-rank-avatar">${esc(a.avatar||'🧙')}</span><div><b>${esc(a.name)}</b><small>${n(a.quizzes)} quizzes concluídos</small></div><strong>${n(a.total_xp)} XP</strong></div>`).join('');
    return `<div class="adv-stat-grid">${metric('Aventureiros cadastrados',n(s.students),'♟')}${metric('Ativos nesta semana',n(s.active_week),'✦')}${metric('Quizzes concluídos',n(s.quizzes_week),'▤')}${metric('XP distribuído',n(s.total_xp),'⚜')}${metric('Guildas ativas',n(s.guilds),'⚑')}${metric('Chefes derrotados',n(s.boss_wins),'🐉')}</div>
      <section class="adv-panel"><div class="adv-section-head"><div><h3>Aventureiros em destaque</h3><small>Os cinco maiores totais de XP.</small></div><button class="adv-link-btn" data-adv="teacher-tab" data-tab="students">Ver turma</button></div><div class="adv-member-list">${top||'<div class="adv-empty">A turma ainda não possui atividade registrada.</div>'}</div></section>
      <section class="adv-panel adv-teacher-tip"><b>Como interpretar os dados</b><p>O painel conta atividades concluídas e recompensas persistidas no banco. XP e Coins não podem ser editados pelo navegador. Missões e chefes podem ser ativados, pausados e configurados nas abas próprias.</p></section>`;
  }
  function teacherStudents(d){
    const q=S.studentQuery.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
    const list=(d.students||[]).filter(a=>`${a.name} ${a.guild_name||''} ${a.class||''}`.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').includes(q));
    return `<section class="adv-panel"><div class="adv-section-head"><div><h3>Progresso dos alunos</h3><small>${n(list.length)} aventureiros na lista.</small></div><input id="advStudentSearch" class="adv-input adv-student-search" value="${esc(S.studentQuery)}" placeholder="Buscar aluno ou guilda"></div>
      <div class="adv-table-wrap"><table class="adv-table"><thead><tr><th>Aventureiro</th><th>XP</th><th>Quizzes</th><th>Acertos</th><th>Coins</th><th>Guilda</th></tr></thead><tbody>
      ${list.map(a=>`<tr><td><span class="adv-table-player">${esc(a.avatar||'🧙')} <b>${esc(a.name)}</b><small>${esc(a.class||'Sem classe')}</small></span></td><td>${n(a.total_xp)}</td><td>${n(a.quizzes)}</td><td>${n(a.correct)} / ${n(a.questions)}</td><td>${n(a.coins)}</td><td>${esc(a.guild_name||'—')}</td></tr>`).join('')||'<tr><td colspan="6" class="adv-empty">Nenhum aluno corresponde à busca.</td></tr>'}
      </tbody></table></div><p class="adv-footnote">Por privacidade, o painel não exibe e-mails nem dados de autenticação.</p></section>`;
  }
  function teacherMissions(d){
    const x=S.missionDraft||{},rows=(d.missions||[]).map(m=>`<div class="adv-admin-row"><div><b>${esc(m.title)}</b><small>${esc(kind(m.kind))} · Meta ${n(m.target)} · ${n(m.xp_reward)} XP / ${n(m.coin_reward)} Coins</small></div>${badge(m.active?'Ativa':'Pausada',m.active?'good':'')}<button class="adv-btn adv-btn-mini adv-btn-soft" data-adv="edit-mission" data-id="${esc(m.id)}">Editar</button><button class="adv-btn adv-btn-mini ${m.active?'adv-btn-danger':''}" data-adv="toggle-mission" data-id="${esc(m.id)}">${m.active?'Pausar':'Ativar'}</button></div>`).join('');
    return `<section class="adv-panel"><div class="adv-section-head"><div><h3>${x.id?'Editar missão semanal':'Criar missão semanal'}</h3><small>As metas são medidas automaticamente pelo histórico dos alunos.</small></div></div>
      <form class="adv-form adv-admin-form" data-adv-form="save-mission"><div class="adv-form-grid"><label>ID único<input id="advMissionId" maxlength="40" required value="${esc(x.id||'')}" placeholder="ex.: semana-java" ${x.id?'readonly':''}></label><label>Título<input id="advMissionTitle" maxlength="60" required value="${esc(x.title||'')}" placeholder="Nome do contrato"></label></div>
      <label>Descrição<input id="advMissionDescription" maxlength="220" required value="${esc(x.description||'')}" placeholder="Explique o objetivo"></label>
      <div class="adv-form-grid"><label>Tipo de progresso<select id="advMissionKind">${[['quiz_count','Quizzes concluídos'],['correct_answers','Questões corretas'],['xp_earned','XP conquistado'],['boss_wins','Chefes derrotados']].map(([v,l])=>`<option value="${v}" ${x.kind===v?'selected':''}>${l}</option>`).join('')}</select></label><label>Meta<input id="advMissionTarget" type="number" min="1" max="10000" required value="${esc(x.target??3)}"></label></div>
      <div class="adv-form-grid"><label>Recompensa XP (1 a 250)<input id="advMissionXp" type="number" min="1" max="250" required value="${esc(x.xp_reward??100)}"></label><label>Recompensa Coins (0 a 100)<input id="advMissionCoins" type="number" min="0" max="100" required value="${esc(x.coin_reward??30)}"></label></div>
      <div class="adv-form-actions"><button class="adv-btn" type="submit">Salvar missão</button>${x.id?'<button class="adv-btn adv-btn-soft" type="button" data-adv="cancel-mission">Cancelar edição</button>':''}</div></form></section>
      <section class="adv-panel"><div class="adv-section-head"><div><h3>Quadro de missões</h3><small>Desative sem apagar o histórico de resgates.</small></div></div><div class="adv-admin-list">${rows||'<div class="adv-empty">Nenhuma missão cadastrada.</div>'}</div></section>`;
  }
  function teacherBosses(d){
    const x=S.bossDraft||{},rows=(d.bosses||[]).map(b=>`<div class="adv-admin-row"><div><b>${esc(b.name)}</b><small>${esc(cat(b.category))} · ${n(b.min_correct)}/6 acertos · ${n(b.xp_reward)} XP / ${n(b.coin_reward)} Coins</small></div>${badge(b.active?'Ativo':'Pausado',b.active?'good':'')}<button class="adv-btn adv-btn-mini adv-btn-soft" data-adv="edit-boss" data-id="${esc(b.id)}">Editar</button><button class="adv-btn adv-btn-mini ${b.active?'adv-btn-danger':''}" data-adv="toggle-boss" data-id="${esc(b.id)}">${b.active?'Pausar':'Ativar'}</button></div>`).join('');
    return `<section class="adv-panel"><div class="adv-section-head"><div><h3>${x.id?'Editar chefe':'Convocar chefe'}</h3><small>Chefes usam as seis questões da categoria escolhida.</small></div></div>
      <form class="adv-form adv-admin-form" data-adv-form="save-boss"><div class="adv-form-grid"><label>ID único<input id="advBossId" maxlength="40" required value="${esc(x.id||'')}" placeholder="ex.: guardiao-redes" ${x.id?'readonly':''}></label><label>Nome do chefe<input id="advBossName" maxlength="60" required value="${esc(x.name||'')}" placeholder="Nome do guardião"></label></div>
      <label>Descrição<input id="advBossDescription" maxlength="220" required value="${esc(x.description||'')}" placeholder="Apresente o desafio"></label>
      <div class="adv-form-grid"><label>Categoria<select id="advBossCategory">${[['programacao','Programação'],['banco','Banco de Dados'],['modelagem','Modelagem'],['geral','Conhecimentos gerais']].map(([v,l])=>`<option value="${v}" ${x.category===v?'selected':''}>${l}</option>`).join('')}</select></label><label>Acertos necessários (1 a 6)<input id="advBossMin" type="number" min="1" max="6" required value="${esc(x.min_correct??4)}"></label></div>
      <div class="adv-form-grid"><label>Recompensa XP (1 a 250)<input id="advBossXp" type="number" min="1" max="250" required value="${esc(x.xp_reward??120)}"></label><label>Recompensa Coins (0 a 100)<input id="advBossCoins" type="number" min="0" max="100" required value="${esc(x.coin_reward??40)}"></label></div>
      <div class="adv-form-actions"><button class="adv-btn" type="submit">Salvar chefe</button>${x.id?'<button class="adv-btn adv-btn-soft" type="button" data-adv="cancel-boss">Cancelar edição</button>':''}</div></form></section>
      <section class="adv-panel"><div class="adv-section-head"><div><h3>Chefes cadastrados</h3><small>Chefes pausados deixam de aparecer na arena.</small></div></div><div class="adv-admin-list">${rows||'<div class="adv-empty">Nenhum chefe cadastrado.</div>'}</div></section>`;
  }
  function teacherGuilds(d){
    const rows=(d.guilds||[]).map(g=>`<div class="adv-admin-row"><div><b>[${esc(g.tag)}] ${esc(g.name)}</b><small>${n(g.members)} membros · Líder: ${esc(g.owner||'Aventureiro')}</small></div>${badge(g.active?'Ativa':'Suspensa',g.active?'good':'')}<button class="adv-btn adv-btn-mini ${g.active?'adv-btn-danger':''}" data-adv="toggle-guild" data-id="${esc(g.id)}" data-active="${g.active?'true':'false'}">${g.active?'Suspender':'Reativar'}</button></div>`).join('');
    return `<section class="adv-panel"><div class="adv-section-head"><div><h3>Moderação de guildas</h3><small>Suspender oculta a guilda do recrutamento e impede novos convites.</small></div></div><div class="adv-admin-list">${rows||'<div class="adv-empty">Nenhuma guilda foi criada.</div>'}</div></section>`;
  }

  async function claim(id){const r=await rpc('claim_weekly_mission',{p_mission_id:id});if(!r.ok)toast(r.reason==='claimed'?'Esta missão já foi resgatada nesta semana.':`Missão incompleta: ${n(r.progress)} de ${n(r.target)}.`);else toast(`Recompensa recebida: +${n(r.xp_awarded)} XP e +${n(r.coins_awarded)} Coins.`);return missions();}
  async function createGuild(e){e.preventDefault();const r=await rpc('create_guild',{p_name:$('advGuildName').value.trim(),p_tag:$('advGuildTag').value.trim().toUpperCase(),p_description:$('advGuildDescription').value.trim()});toast(`Guilda ${r.tag} fundada! Código de convite: ${r.invite_code}.`);return guilds();}
  async function joinGuild(e){e.preventDefault();const r=await rpc('join_guild',{p_invite_code:$('advGuildCode').value.trim().toUpperCase()});toast(`Você entrou na guilda [${r.guild_tag}] ${r.guild_name}.`);return guilds();}
  async function saveGuildFlag(e){e.preventDefault();await rpc('save_guild_flag',{p_primary:$('advFlagPrimary').value,p_secondary:$('advFlagSecondary').value,p_pattern:$('advFlagPattern').value,p_symbol:$('advFlagSymbol').value,p_motto:$('advFlagMotto').value.trim(),p_crest:$('advFlagCrest').value,p_shield:$('advFlagShield').value,p_crest_item:$('advFlagCrestItem').value||null,p_shield_item:$('advFlagShieldItem').value||null,p_effect_item:$('advFlagEffectItem').value||null});toast('Heráldica salva. Todos os membros já podem vê-la.');return guilds();}
  async function saveMission(e){e.preventDefault();await rpc('teacher_save_mission',{p_id:$('advMissionId').value.trim(),p_title:$('advMissionTitle').value.trim(),p_description:$('advMissionDescription').value.trim(),p_kind:$('advMissionKind').value,p_target:Number($('advMissionTarget').value),p_xp_reward:Number($('advMissionXp').value),p_coin_reward:Number($('advMissionCoins').value),p_active:true});S.missionDraft=null;toast('Missão salva e sincronizada com o banco.');return teacher();}
  async function saveBoss(e){e.preventDefault();await rpc('teacher_save_boss',{p_id:$('advBossId').value.trim(),p_name:$('advBossName').value.trim(),p_category:$('advBossCategory').value,p_description:$('advBossDescription').value.trim(),p_min_correct:Number($('advBossMin').value),p_xp_reward:Number($('advBossXp').value),p_coin_reward:Number($('advBossCoins').value),p_active:true});S.bossDraft=null;toast('Chefe salvo na Arena.');return teacher();}

  async function action(b){
    const a=b.dataset.adv;
    if(a==='retry')return load();
    if(a==='guild-tab'){S.guildTab=b.dataset.tab;return guilds();}
    if(a==='friend-add'){await rpc('send_friend_request',{p_user_id:b.dataset.id});toast('Solicitação enviada.');return friends();}
    if(a==='friend-accept'||a==='friend-reject'){await rpc('respond_friend_request',{p_request_id:b.dataset.id,p_accept:a==='friend-accept'});toast('Solicitação atualizada.');return friends();}
    if(a==='invite-friend'){try{await navigator.clipboard.writeText(b.dataset.code);toast('Código da guilda copiado. Envie ao amigo!');}catch{toast('Código: '+b.dataset.code);}return;}
    if(a==='claim')return claim(b.dataset.id);
    if(a==='period'){S.period=b.dataset.period;return ranking();}
    if(a==='start-story')return startStory(b.dataset.id);
    if(a==='answer-story')return answerStory(Number(b.dataset.index));
    if(a==='retry-story-answer'){S.storyBattle.answered=false;return storyFight();}
    if(a==='next-story'){if(S.storyBattle.index===S.storyBattle.questions.length-1)return finishStory();S.storyBattle.index++;S.storyBattle.answered=false;return storyFight();}
    if(a==='finish-story')return finishStory();
    if(a==='story-continue'||a==='story-map'){S.storyBattle=null;return story();}
    if(a==='story-retry'){const id=S.storyBattle.encounter.id;S.storyBattle=null;return startStory(id);}
    if(a==='leave-story'){S.storyBattle=null;return story();}
    if(a==='start-boss')return startBoss(b.dataset.id);
    if(a==='answer-boss')return answerBoss(Number(b.dataset.index));
    if(a==='retry-boss-answer'){S.battle.answered=false;return fight();}
    if(a==='next-boss'){if(S.battle.index===S.battle.questions.length-1)return finishBoss();S.battle.index++;S.battle.answered=false;return fight();}
    if(a==='finish-boss')return finishBoss();
    if(a==='leave-boss'||a==='back-bosses'){S.battle=null;return bosses();}
    if(a==='copy-invite'){try{await navigator.clipboard.writeText(b.dataset.code);toast('Código de convite copiado.');}catch{toast(`Código de convite: ${b.dataset.code}`);}return;}
    if(a==='leave-guild'){if(!confirm('Sair desta guilda? Se você for líder, a liderança será transferida ao membro mais antigo.'))return;await rpc('leave_guild');toast('Você saiu da guilda.');return guilds();}
    if(a==='teacher-tab'){S.teacherTab=b.dataset.tab;S.missionDraft=null;S.bossDraft=null;return teacher();}
    if(a==='edit-mission'){S.missionDraft=(S.data.missions||[]).find(x=>x.id===b.dataset.id)||null;return teacher();}
    if(a==='cancel-mission'){S.missionDraft=null;return teacher();}
    if(a==='toggle-mission'){const m=(S.data.missions||[]).find(x=>x.id===b.dataset.id);if(!m)return;await rpc('teacher_save_mission',{p_id:m.id,p_title:m.title,p_description:m.description,p_kind:m.kind,p_target:m.target,p_xp_reward:m.xp_reward,p_coin_reward:m.coin_reward,p_active:!m.active});toast(m.active?'Missão pausada.':'Missão ativada.');return teacher();}
    if(a==='edit-boss'){S.bossDraft=(S.data.bosses||[]).find(x=>x.id===b.dataset.id)||null;return teacher();}
    if(a==='cancel-boss'){S.bossDraft=null;return teacher();}
    if(a==='toggle-boss'){const x=(S.data.bosses||[]).find(y=>y.id===b.dataset.id);if(!x)return;await rpc('teacher_save_boss',{p_id:x.id,p_name:x.name,p_category:x.category,p_description:x.description,p_min_correct:x.min_correct,p_xp_reward:x.xp_reward,p_coin_reward:x.coin_reward,p_active:!x.active});toast(x.active?'Chefe pausado.':'Chefe ativado.');return teacher();}
    if(a==='toggle-guild'){await rpc('teacher_set_guild_active',{p_guild_id:b.dataset.id,p_active:b.dataset.active!=='true'});toast(b.dataset.active==='true'?'Guilda suspensa.':'Guilda reativada.');return teacher();}
  }
  const root=$('rpgView');
  if(root){
    root.addEventListener('click',e=>{const b=e.target.closest('[data-adv]');if(!b||b.disabled)return;action(b).catch(err=>{console.error('Ação da Aventura:',err);toast(err.message||'Não foi possível concluir esta ação.');});});
    root.addEventListener('submit',e=>{if(e.target.id==='advFriendSearchForm'){e.preventDefault();S.friendQuery=$('advFriendSearch').value.trim();if(S.friendQuery.length<2){toast('Digite pelo menos 2 caracteres.');return;}rpc('search_academy_players',{p_query:S.friendQuery}).then(r=>{S.friendResults=r||[];friends();}).catch(err=>toast(err.message));return;}const f=e.target.closest('[data-adv-form]');if(!f)return;const map={'create-guild':createGuild,'join-guild':joinGuild,'save-guild-flag':saveGuildFlag,'save-mission':saveMission,'save-boss':saveBoss};if(map[f.dataset.advForm])map[f.dataset.advForm](e).catch(err=>toast(err.message||'Não foi possível salvar.'));});
    root.addEventListener('input',e=>{if(e.target.id==='advGuildSearch'){S.guildQuery=e.target.value.toLocaleLowerCase('pt-BR');root.querySelectorAll('[data-guild-search]').forEach(row=>row.hidden=!row.dataset.guildSearch.includes(S.guildQuery));return;}if(e.target.id==='advStudentSearch'){S.studentQuery=e.target.value;const q=S.studentQuery.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const rows=(S.data?.students||[]).filter(x=>`${x.name} ${x.guild_name||''} ${x.class||''}`.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q));const body=root.querySelector('.adv-table tbody');if(body)body.innerHTML=rows.map(x=>`<tr><td><span class="adv-table-player">${esc(x.avatar||'🧙')} <b>${esc(x.name)}</b><small>${esc(x.class||'Sem classe')}</small></span></td><td>${n(x.total_xp)}</td><td>${n(x.quizzes)}</td><td>${n(x.correct)} / ${n(x.questions)}</td><td>${n(x.coins)}</td><td>${esc(x.guild_name||'—')}</td></tr>`).join('')||'<tr><td colspan="6" class="adv-empty">Nenhum aluno corresponde à busca.</td></tr>';return;}if(e.target.closest('#advGuildFlagForm'))updateFlagPreview();});
    root.addEventListener('change',e=>{if(e.target.closest('#advGuildFlagForm'))updateFlagPreview();});
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-adventure]');if(b)open(b.dataset.adventure);});
  function accountChanged(){mount();sync().catch(e=>console.warn('Conta da Academia:',e.message));}
  const app=$('app');if(app){new MutationObserver(accountChanged).observe(app,{attributes:true,attributeFilter:['style']});if(app.style.display==='block')accountChanged();}
  window.addEventListener('load',accountChanged,{once:true});setTimeout(accountChanged,900);mount();
})();