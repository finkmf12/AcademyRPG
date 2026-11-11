// Academia RPG · Livro de Conquistas
(() => {
  'use strict';
  const C=()=>window.AcademiaCtx, $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>Number(v||0).toLocaleString('pt-BR');
  const BOOK=[
    ['primeiro','🎯','Primeiro Passo','Complete seu primeiro quiz.','Conhecimento','Comum','quiz_count',1],
    ['quiz-10','📘','Estudioso','Conclua 10 quizzes.','Conhecimento','Comum','quiz_count',10],
    ['quiz-50','📚','Biblioteca Viva','Conclua 50 quizzes.','Conhecimento','Raro','quiz_count',50],
    ['quiz-100','🧠','Mente Extraordinária','Alcance 100 quizzes concluídos.','Conhecimento','Épico','quiz_count',100],
    ['sequencia','🔥','Sequência de Fogo','Acerte 5 questões seguidas.','Conhecimento','Comum','best_streak',5],
    ['streak-10','🌋','Chama Implacável','Acerte 10 questões seguidas.','Conhecimento','Épico','best_streak',10],
    ['gabarito','💎','Gabarito Perfeito','Acerte todas as questões de um quiz.','Conhecimento','Raro','perfect_count',1],
    ['precision-90','🎖️','Precisão de Mestre','Alcance pelo menos 90% de acertos em um quiz.','Conhecimento','Épico','precision90_count',1],
    ['explorador','🧭','Explorador do Conhecimento','Faça quizzes das quatro categorias de estudo.','Conhecimento','Raro','category_count',4],
    ['simulado','🏆','Desafio Completo','Conclua seu primeiro simulado.','Conhecimento','Comum','simulado_count',1],
    ['simulado-5','👑','Mestre dos Simulados','Conclua 5 simulados.','Conhecimento','Lendário','simulado_count',5],
    ['colecionador','✨','Experiência Acumulada','Acumule 500 XP.','Progressão','Comum','xp',500],
    ['xp2500','🌟','Energia Arcana','Acumule 2.500 XP.','Progressão','Raro','xp',2500],
    ['xp10000','☀️','Lenda da Academia','Acumule 10.000 XP.','Progressão','Lendário','xp',10000],
    ['nivel5','⭐','Aventureiro Experiente','Alcance o nível 5.','Progressão','Incomum','level',5],
    ['nivel10','🔱','Veterano do Reino','Alcance o nível 10.','Progressão','Épico','level',10],
    ['nivel20','🌌','Ascensão Lendária','Alcance o nível 20.','Progressão','Lendário','level',20],
    ['dedicado','📅','Presença Constante','Registre atividade diária em 3 dias diferentes.','Dedicação','Comum','active_days',3],
    ['dedicado-7','🗓️','Uma Semana de Foco','Registre atividade diária em 7 dias diferentes.','Dedicação','Raro','active_days',7],
    ['dedicado-30','🌳','Guardião da Rotina','Registre atividade diária em 30 dias diferentes.','Dedicação','Lendário','active_days',30],
    ['historia-primeira','⚔️','A Primeira Vitória','Vença sua primeira batalha no Modo História.','Campanha','Comum','story_wins',1],
    ['historia-5','🐉','Caçador de Monstros','Vença 5 batalhas da campanha.','Campanha','Raro','story_wins',5],
    ['historia-completa','📜','Lenda da Campanha','Conclua todas as etapas disponíveis do Modo História.','Campanha','Lendário','story_progress','story_total'],
    ['chefe-primeiro','🛡️','Desafiante da Arena','Derrote seu primeiro chefe.','Chefes','Incomum','boss_wins',1],
    ['chefe-trinca','🔺','Tríplice Triunfo','Derrote os três chefes diferentes da Academia.','Chefes','Épico','boss_unique',3],
    ['chefe-10','🏅','Lenda da Arena','Conquiste 10 vitórias contra chefes.','Chefes','Lendário','boss_wins',10],
    ['moedas-5000','🪙','Tesouro Guardado','Ganhe 5.000 Coins ao longo da jornada.','Coleção','Raro','coins_earned',5000],
    ['colecao-inicial','🎒','Primeiro Tesouro','Adquira seu primeiro cosmético ou equipamento.','Coleção','Comum','cosmetic_count',1],
    ['colecao-10','💠','Colecionador Arcano','Reúna 10 itens cosméticos ou equipamentos.','Coleção','Épico','cosmetic_count',10],
    ['item-lendario','💫','Relíquia Lendária','Tenha pelo menos um item de raridade Lendária.','Coleção','Lendário','legendary_count',1],
    ['guilda','🏰','Laços do Reino','Entre ou funde uma guilda da Academia.','Comunidade','Incomum','in_guild',1]
  ];
  const state={data:null,error:null,filter:'all',category:'Todas',loading:false};
  const categories=['Todas','Conhecimento','Progressão','Dedicação','Campanha','Chefes','Coleção','Comunidade'];
  function progress(item,stats){
    const target=item[7]==='story_total'?Math.max(1,Number(stats.story_total||1)):item[7];
    const raw=item[6]==='in_guild'?(stats.in_guild?1:0):Number(stats[item[6]]||0);
    return {raw,target,current:Math.min(raw,target),pct:Math.min(100,Math.round(raw/target*100))};
  }
  function unlockedMap(){return new Map((state.data?.unlocked||[]).map(x=>[x.id,x.unlocked_at]));}
  function card(item,stats,unlocked){
    const p=progress(item,stats),date=unlocked.get(item[0]),done=!!date;
    const rarity=item[5].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    let label=num(p.current)+' / '+num(p.target);
    if(item[0]==='historia-completa')label=num(stats.story_progress)+' / '+num(stats.story_total)+' etapas';
    if(item[0]==='guilda')label=done?'Guilda encontrada':'Ainda sem guilda';
    const when=date&&!Number.isNaN(new Date(date).getTime())?new Date(date).toLocaleDateString('pt-BR',{dateStyle:'medium'}):'';
    return `<article class="ab-card rarity-${rarity} ${done?'is-unlocked':''}">
      <div class="ab-card-top"><span class="ab-icon">${item[1]}</span><span class="ab-rarity">${esc(item[5])}</span></div>
      <div class="ab-card-copy"><div class="ab-card-title">${esc(item[2])}</div><p>${esc(item[3])}</p></div>
      <div class="ab-card-bottom"><div class="ab-progress-label"><span>${done?'Conquista desbloqueada':p.raw>0?'Em andamento':'Ainda não iniciada'}</span><b>${done?'100%':p.pct+'%'}</b></div>
      <div class="ab-progress"><i style="width:${done?100:p.pct}%"></i></div>
      <div class="ab-card-meta"><span>${esc(done?'Desbloqueada em '+when:label)}</span><strong>${done?'✓ Concluída':'+40 Coins'}</strong></div></div>
    </article>`;
  }
  function renderBoard(){
    const el=$('rpgView');if(!el||!state.data)return;
    const stats=state.data.stats||{},unlocked=unlockedMap(),count=BOOK.filter(x=>unlocked.has(x[0])).length,total=BOOK.length,pct=Math.round(count/total*100);
    const list=BOOK.filter(item=>{
      const done=unlocked.has(item[0]),p=progress(item,stats);
      const ok=state.filter==='all'||(state.filter==='unlocked'&&done)||(state.filter==='progress'&&!done&&p.raw>0)||(state.filter==='locked'&&!done&&p.raw<=0);
      return ok&&(state.category==='Todas'||state.category===item[4]);
    });
    const filters=[['all','Todas'],['unlocked','Desbloqueadas'],['progress','Em andamento'],['locked','Bloqueadas']]
      .map(x=>`<button type="button" class="ab-filter ${state.filter===x[0]?'active':''}" data-ach-filter="${x[0]}">${x[1]}</button>`).join('');
    const cats=categories.map(x=>`<button type="button" class="ab-category ${state.category===x?'active':''}" data-ach-category="${esc(x)}">${esc(x)}</button>`).join('');
    el.innerHTML=`
      <section class="ab-hero"><div class="ab-hero-symbol">✧</div>
        <div class="ab-hero-copy"><span class="ab-eyebrow">ARQUIVO DOS AVENTUREIROS</span><h2>Livro de Conquistas</h2><p>Registre suas vitórias, descubra novos objetivos e deixe sua lenda marcada na Academia.</p></div>
        <div class="ab-hero-score"><strong>${count}<small>/${total}</small></strong><span>conquistas obtidas</span></div>
        <div class="ab-hero-progress"><div class="ab-hero-progress-head"><span>Progresso da sua jornada</span><b>${pct}%</b></div><div class="ab-progress ab-progress-hero"><i style="width:${pct}%"></i></div></div>
      </section>
      <div class="ab-summary">
        <article><span>📚</span><div><small>Quizzes concluídos</small><strong>${num(stats.quiz_count)}</strong></div></article>
        <article><span>⭐</span><div><small>Nível atual</small><strong>${num(stats.level)}</strong></div></article>
        <article><span>⚔️</span><div><small>Vitórias na aventura</small><strong>${num(Number(stats.story_wins||0)+Number(stats.boss_wins||0))}</strong></div></article>
        <article><span>✨</span><div><small>XP acumulado</small><strong>${num(stats.xp)}</strong></div></article>
      </div>
      <section class="ab-shelf">
        <div class="ab-section-heading"><div><span class="ab-eyebrow">SUA COLEÇÃO</span><h3>Conquistas da Academia</h3></div><button type="button" class="ab-refresh" data-ach-action="refresh" ${state.loading?'disabled':''}>↻ Atualizar</button></div>
        <div class="ab-filters" aria-label="Filtrar conquistas">${filters}</div><div class="ab-categories" aria-label="Categorias de conquistas">${cats}</div>
        <div class="ab-result-line"><span>${list.length} ${list.length===1?'conquista encontrada':'conquistas encontradas'}</span><span>Recompensa: <b>+40 Coins</b> por conquista</span></div>
        <div class="ab-grid">${list.map(x=>card(x,stats,unlocked)).join('')||'<div class="ab-empty">Nenhuma conquista nesta seleção. Experimente outro filtro.</div>'}</div>
      </section>
      <p class="ab-footnote">As conquistas ficam vinculadas à sua conta e acompanham você em qualquer computador. Algumas metas são reconhecidas automaticamente ao abrir este livro ou concluir um quiz.</p>`;
  }
  function loading(){
    const el=$('rpgView');if(el)el.innerHTML='<div class="ab-loading"><span class="ab-loading-mark">✧</span><b>Consultando o Livro de Conquistas...</b><small>Reunindo seus feitos e registros da Academia.</small></div>';
  }
  function errorView(){
    const el=$('rpgView');if(el)el.innerHTML='<div class="ab-error"><span>📖</span><h3>Não foi possível abrir o livro</h3><p>'+esc(state.error||'Ocorreu um erro ao consultar suas conquistas.')+'</p><button type="button" data-ach-action="refresh">Tentar novamente</button></div>';
  }
  function isBookActive(){
    return document.querySelector('.rpgnav button.active')?.dataset.rpg==='conquistas';
  }
  async function open(){
    const c=C();state.data=null;state.error=null;
    if(c?.guest||!c?.user){const el=$('rpgView');if(el)el.innerHTML='<div class="ab-guest"><span>🏅</span><h3>Suas conquistas começam aqui</h3><p>Entre com sua conta Google para registrar seu progresso, desbloquear recompensas e manter seu livro salvo na nuvem.</p></div>';return;}
    state.loading=true;loading();
    try{
      const {data,error}=await c.supabase.rpc('get_achievement_book');if(error)throw error;
      if(!data||!data.stats||!Array.isArray(data.unlocked))throw new Error('A resposta do Livro de Conquistas está incompleta.');
      state.data=data;state.loading=false;
      if(!isBookActive())return;
      renderBoard();
      const fresh=Array.isArray(data.newly_unlocked)?data.newly_unlocked:[];
      if(fresh.length)c.toast('🏅 '+fresh.length+' conquista(s) nova(s)! Você recebeu '+num(fresh.length*40)+' Coins.');
    }catch(e){state.error=e?.message||String(e);state.loading=false;if(isBookActive())errorView();}
  }
  function refresh(){if(!state.loading)open();}
  document.addEventListener('click',e=>{
    const r=e.target.closest('[data-ach-action="refresh"]');if(r){refresh();return;}
    const f=e.target.closest('[data-ach-filter]');if(f){state.filter=f.dataset.achFilter;renderBoard();return;}
    const c=e.target.closest('[data-ach-category]');if(c){state.category=c.dataset.achCategory;renderBoard();}
  });
  window.AcademiaAchievements={open,render:renderBoard,refresh};
})();