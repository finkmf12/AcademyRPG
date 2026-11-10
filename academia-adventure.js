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
    bosses:['ARENA DE COMBATE','Arena dos Chefes','Responda aos enigmas, proteja sua energia e conquiste recompensas.'],
    guilds:['SALÃO DAS GUILDAS','Guildas','Reúna aliados, compartilhe um código e evoluam em equipe.'],
    teacher:['MESTRE DA ACADEMIA','Painel do Professor','Acompanhe a turma e administre a jornada de aprendizagem.']
  };
  const S={page:null,userKey:null,teacher:false,data:null,period:'all',teacherTab:'overview',studentQuery:'',missionDraft:null,bossDraft:null,battle:null,busy:false};
  const toast=m=>C()?.toast?.(m);
  async function rpc(name,args={}){const c=C();if(!c?.supabase||!c.user||c.guest)throw Error('Entre com sua conta Google para usar este recurso.');const {data,error}=await c.supabase.rpc(name,args);if(error)throw error;return data;}
  const wait=m=>`<div class="adv-panel"><div class="adv-loading"><span class="adv-spinner"></span>${esc(m||'Consultando os registros da Academia...')}</div></div>`;
  const fail=m=>`<div class="adv-panel"><div class="adv-empty"><b>Não foi possível carregar esta área.</b>${esc(m)}<br><button class="adv-btn adv-btn-soft" data-adv="retry">Tentar novamente</button></div></div>`;
  const metric=(label,value,icon)=>`<article class="adv-stat"><span>${icon}</span><small>${esc(label)}</small><strong>${esc(value)}</strong></article>`;
  const bar=(v,t)=>`<div class="adv-progress" role="progressbar" aria-valuenow="${t?Math.min(100,Math.round(v/t*100)):0}" aria-valuemin="0" aria-valuemax="100"><i style="width:${t?Math.min(100,Math.round(v/t*100)):0}%"></i></div>`;
  const badge=(s,k='')=>`<span class="adv-badge ${esc(k)}">${esc(s)}</span>`;

  function mount(){
    const nav=document.querySelector('.rpgnav');if(!nav||nav.querySelector('[data-adventure="missions"]'))return;
    nav.insertAdjacentHTML('beforeend',`<div class="adv-nav-divider">AVENTURA</div>
      <button type="button" data-adventure="missions"><span class="ico">✦</span> Missões Semanais</button>
      <button type="button" data-adventure="ranking"><span class="ico">♛</span> Ranking</button>
      <button type="button" data-adventure="bosses"><span class="ico">🐉</span> Arena dos Chefes</button>
      <button type="button" data-adventure="guilds"><span class="ico">⚑</span> Guildas</button>
      <button type="button" data-adventure="teacher" id="advTeacherNav" hidden><span class="ico">⚜</span> Painel do Professor</button>`);
  }
  async function sync(){
    const c=C();if(!c)return;const key=c.guest?'guest':(c.user?.id||null),admin=$('advTeacherNav');
    if(!key){S.userKey=null;S.teacher=false;S.data=null;S.battle=null;if(admin)admin.hidden=true;return;}
    if(key===S.userKey)return;S.userKey=key;S.teacher=false;S.data=null;S.battle=null;
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
  async function load(){if(S.page==='missions')return missions();if(S.page==='ranking')return ranking();if(S.page==='bosses')return bosses();if(S.page==='guilds')return guilds();if(S.page==='teacher')return teacher();}

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
      <span class="adv-rank-number">${e.rank<=3?['♛','Ⅱ','Ⅲ'][e.rank-1]:n(e.rank)}</span><span class="adv-rank-avatar">${esc(e.avatar||'🧙')}</span>
      <span class="adv-rank-name"><b>${esc(e.name)}</b><small>${esc(e.class||'Aventureiro')} · Nível ${n(e.level)}</small></span>
      <strong>${n(e.xp)} <small>XP</small></strong>${e.is_me?badge('Você','ready'):''}</div>`).join('');
    const me=r.my_rank?`Sua posição: #${n(r.my_rank)}`:'Seu personagem ainda não aparece nesta classificação.';
    $('rpgView').innerHTML=`<section class="adv-hero adv-rank-hero"><div><div class="adv-kicker">SALÃO DOS CAMPEÕES</div><h3>O conhecimento é sua maior arma.</h3><p>${esc(me)} Complete seu personagem para escolher o nome que será exibido aos outros aventureiros.</p></div><div class="adv-hero-mark">♛</div></section>
      <div class="adv-rank-toolbar"><div class="adv-tabs"><button class="${S.period==='all'?'active':''}" data-adv="period" data-period="all">Geral</button><button class="${S.period==='week'?'active':''}" data-adv="period" data-period="week">Esta semana</button><button class="${S.period==='month'?'active':''}" data-adv="period" data-period="month">Este mês</button></div><span class="adv-muted">Até 50 aventureiros</span></div>
      <section class="adv-panel"><div class="adv-section-head"><div><h3>Classificação</h3><small>Somente XP validado pela Academia.</small></div></div><div class="adv-rank-list">${list||'<div class="adv-empty">Ainda não há aventureiros no ranking. Seja o primeiro a treinar!</div>'}</div></section>
      <p class="adv-footnote">O ranking mostra apenas nome de aventureiro, avatar, classe, nível e XP. E-mails não são exibidos.</p>`;
  }
  async function bosses(){
    if(S.battle&&!S.battle.result)return fight();
    const list=await rpc('get_boss_catalog');
    const cards=(list||[]).map(b=>{
      const icon={programacao:'⌘',banco:'▤',modelagem:'◇',geral:'✦'}[b.category]||'🐉';
      return `<article class="adv-boss-card ${b.defeated?'defeated':''}"><div class="adv-boss-art"><span>${icon}</span><small>${esc(cat(b.category))}</small></div>
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
    $('rpgView').innerHTML=`<section class="adv-fight-banner"><div class="adv-fight-title"><div class="adv-kicker">ARENA DE COMBATE</div><h3>${esc(boss.name)}</h3><p>${esc(boss.description)}</p></div><div class="adv-fight-rune">⚔</div></section>
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

  async function guilds(){
    const [mine,all]=await Promise.all([rpc('get_my_guild'),rpc('list_guilds')]);
    const directory=(all||[]).map(g=>`<article class="adv-guild-row"><div class="adv-guild-crest">${esc(g.tag)}</div><div class="adv-guild-info"><b>${esc(g.name)}</b><small>${esc(g.description||'Uma guilda em busca de novos aventureiros.')}</small><span>${n(g.members)} / 6 membros · ${n(g.total_xp)} XP somados</span></div>${g.joined?badge('Sua guilda','good'):badge('Guilda aberta')}</article>`).join('');
    if(mine?.guild){
      const g=mine.guild,ms=mine.members||[];
      $('rpgView').innerHTML=`<section class="adv-hero adv-guild-hero"><div><div class="adv-kicker">SUA BANDEIRA</div><h3>${esc(g.name)} <small>[${esc(g.tag)}]</small></h3><p>${esc(g.description||'Uma irmandade de aventureiros.')}</p></div><div class="adv-hero-mark">⚑</div></section>
        ${g.active?'':'<div class="adv-warning">Esta guilda foi temporariamente suspensa pelo professor. Seus membros podem consultar os dados e sair normalmente.</div>'}
        <section class="adv-panel"><div class="adv-section-head"><div><h3>Companheiros de jornada</h3><small>${n(ms.length)} de 6 vagas ocupadas</small></div>${g.owner&&g.invite_code?`<button class="adv-btn adv-btn-soft" data-adv="copy-invite" data-code="${esc(g.invite_code)}">Copiar convite · ${esc(g.invite_code)}</button>`:''}</div>
        <div class="adv-member-list">${ms.map(m=>`<div class="adv-member"><span class="adv-rank-avatar">${esc(m.avatar||'🧙')}</span><div><b>${esc(m.name)} ${m.is_me?'(você)':''}</b><small>${esc(m.role==='leader'?'Líder':m.role==='officer'?'Oficial':'Membro')} · ${esc(m.class||'Aventureiro')}</small></div><strong>${n(m.xp)} XP</strong></div>`).join('')}</div></section>
        <div class="adv-guild-actions"><p class="adv-footnote">O líder pode compartilhar o código de convite com até cinco companheiros.</p><button class="adv-btn adv-btn-danger" data-adv="leave-guild">Sair da guilda</button></div>`;return;
    }
    $('rpgView').innerHTML=`<section class="adv-hero adv-guild-hero"><div><div class="adv-kicker">AVENTUREIRO SOLITÁRIO?</div><h3>Encontre sua companhia.</h3><p>Crie uma guilda para liderar seus aliados ou entre em uma usando o código enviado pelo líder.</p></div><div class="adv-hero-mark">⚑</div></section>
      <div class="adv-guild-forms">
        <form class="adv-panel adv-form" data-adv-form="create-guild"><div class="adv-section-head"><div><h3>Fundar uma guilda</h3><small>Você será o líder inicial.</small></div></div>
          <label>Nome da guilda<input id="advGuildName" maxlength="24" minlength="3" required placeholder="Ex.: Ordem da Fênix"></label>
          <label>Sigla (2 a 5 letras/números)<input id="advGuildTag" maxlength="5" minlength="2" required placeholder="FENIX"></label>
          <label>Descrição (opcional)<textarea id="advGuildDescription" maxlength="140" rows="2" placeholder="Qual é o propósito da sua companhia?"></textarea></label><button class="adv-btn" type="submit">Criar guilda</button></form>
        <form class="adv-panel adv-form" data-adv-form="join-guild"><div class="adv-section-head"><div><h3>Entrar por convite</h3><small>Peça o código ao líder da guilda.</small></div></div>
          <label>Código de convite<input id="advGuildCode" maxlength="8" minlength="8" required placeholder="AB12CD34"></label><button class="adv-btn adv-btn-soft" type="submit">Entrar na guilda</button></form>
      </div>
      <section class="adv-panel"><div class="adv-section-head"><div><h3>Guildas da Academia</h3><small>Conheça as companhias que estão recrutando.</small></div></div><div class="adv-guild-directory">${directory||'<div class="adv-empty">Nenhuma guilda foi fundada ainda.</div>'}</div></section>`;
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
  async function saveMission(e){e.preventDefault();await rpc('teacher_save_mission',{p_id:$('advMissionId').value.trim(),p_title:$('advMissionTitle').value.trim(),p_description:$('advMissionDescription').value.trim(),p_kind:$('advMissionKind').value,p_target:Number($('advMissionTarget').value),p_xp_reward:Number($('advMissionXp').value),p_coin_reward:Number($('advMissionCoins').value),p_active:true});S.missionDraft=null;toast('Missão salva e sincronizada com o banco.');return teacher();}
  async function saveBoss(e){e.preventDefault();await rpc('teacher_save_boss',{p_id:$('advBossId').value.trim(),p_name:$('advBossName').value.trim(),p_category:$('advBossCategory').value,p_description:$('advBossDescription').value.trim(),p_min_correct:Number($('advBossMin').value),p_xp_reward:Number($('advBossXp').value),p_coin_reward:Number($('advBossCoins').value),p_active:true});S.bossDraft=null;toast('Chefe salvo na Arena.');return teacher();}

  async function action(b){
    const a=b.dataset.adv;
    if(a==='retry')return load();
    if(a==='claim')return claim(b.dataset.id);
    if(a==='period'){S.period=b.dataset.period;return ranking();}
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
    root.addEventListener('submit',e=>{const f=e.target.closest('[data-adv-form]');if(!f)return;const map={'create-guild':createGuild,'join-guild':joinGuild,'save-mission':saveMission,'save-boss':saveBoss};if(map[f.dataset.advForm])map[f.dataset.advForm](e).catch(err=>toast(err.message||'Não foi possível salvar.'));});
    root.addEventListener('input',e=>{if(e.target.id!=='advStudentSearch')return;S.studentQuery=e.target.value;const q=S.studentQuery.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const rows=(S.data?.students||[]).filter(x=>`${x.name} ${x.guild_name||''} ${x.class||''}`.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q));const body=root.querySelector('.adv-table tbody');if(body)body.innerHTML=rows.map(x=>`<tr><td><span class="adv-table-player">${esc(x.avatar||'🧙')} <b>${esc(x.name)}</b><small>${esc(x.class||'Sem classe')}</small></span></td><td>${n(x.total_xp)}</td><td>${n(x.quizzes)}</td><td>${n(x.correct)} / ${n(x.questions)}</td><td>${n(x.coins)}</td><td>${esc(x.guild_name||'—')}</td></tr>`).join('')||'<tr><td colspan="6" class="adv-empty">Nenhum aluno corresponde à busca.</td></tr>';});
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-adventure]');if(b)open(b.dataset.adventure);});
  function accountChanged(){mount();sync().catch(e=>console.warn('Conta da Academia:',e.message));}
  const app=$('app');if(app){new MutationObserver(accountChanged).observe(app,{attributes:true,attributeFilter:['style']});if(app.style.display==='block')accountChanged();}
  window.addEventListener('load',accountChanged,{once:true});setTimeout(accountChanged,900);mount();
})();