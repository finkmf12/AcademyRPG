import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const SUPABASE_URL='https://bvsxvcvuiorvwxxlqrmy.supabase.co';
const SUPABASE_KEY='sb_publishable_qBKPW3YTNn8k9p4_SMg_MQ_mAkAU_L6';
const $=id=>document.getElementById(id);
let supabase,sessionUser=null,guest=false,toastTimer,profileData=null;
const titles={
 inicio:['VISÃO GERAL','O Reino aguarda por você.','Acompanhe sua jornada e escolha seu próximo destino.','✧'],
 personagem:['PERSONAGEM','Seu herói, suas escolhas.','Defina sua identidade e construa a aparência do seu aventureiro.','♙'],
 atelier:['ATELIÊ ARCANO','Vista sua próxima lenda.','Armaduras, asas, capas, efeitos e cenários ilustrados para seu aventureiro.','✦'],
 mapa:['MAPA DO REINO','Territórios além do horizonte.','Explore as regiões de Programação, Banco de Dados, Modelagem e Tecnologia.','⌖'],
 biblioteca:['BIBLIOTECA','Seu conhecimento, sempre ao alcance.','Uma nova biblioteca organizada por disciplinas, com seus arquivos sincronizados.','▤'],
 treinamento:['TREINAMENTO','A prática fortalece o aventureiro.','Quizzes, simulados e desafios para transformar estudo em experiência.','⚔'],
 missoes:['MISSÕES','Toda conquista começa com um objetivo.','Missões diárias, semanais e desafios especiais da Academia.','⚑'],
 guildas:['GUILDAS','Nenhum aventureiro precisa caminhar sozinho.','Encontre sua equipe, compartilhe estratégias e evolua em conjunto.','♜'],
 taverna:['TAVERNA','O ponto de encontro dos aventureiros.','Converse com a comunidade e acompanhe o movimento do reino.','☷'],
 mensagens:['MENSAGENS','Conexões além das fronteiras.','Conversas privadas, amizades e notificações em um só lugar.','✉'],
 ranking:['RANKING','As lendas são lembradas.','Acompanhe os aventureiros que mais evoluem na Academia.','♛'],
 mercado:['MERCADO ARCANO','Personalize sua jornada.','Fundos, visuais, efeitos e itens para deixar seu personagem único.','◇'],
 conquistas:['CONQUISTAS','Cada passo merece ser registrado.','Seu livro de conquistas e marcos importantes da jornada.','✧']
};

const realmData={
 programacao:{number:'I',category:'TERRITÓRIO I · FUNDAMENTOS',emblem:'⌘',title:'Terras da Programação',description:'Onde a lógica ganha forma e cada linha de código abre uma nova possibilidade.',tone:'code',topics:[['Lógica e algoritmos','Raciocínio lógico, sequência e resolução de problemas.'],['Portugol e estruturas','Variáveis, decisões, laços e vetores.'],['Java e orientação a objetos','Classes, objetos, métodos e encapsulamento.']],subject:'programacao',note:'A biblioteca já possui um espaço para seus códigos, projetos e exercícios.'},
 banco:{number:'II',category:'TERRITÓRIO II · INFORMAÇÃO',emblem:'▤',title:'Domínios dos Dados',description:'Um território de registros, relações e descobertas, onde a informação encontra sua estrutura.',tone:'data',topics:[['Fundamentos de banco de dados','Tabelas, registros, atributos e SGBD.'],['Linguagem SQL','SELECT, INSERT, UPDATE, DELETE e consultas.'],['Modelagem relacional','Chaves primárias, estrangeiras e relacionamentos.']],subject:'banco',note:'Organize scripts SQL, consultas e anotações no cofre da biblioteca.'},
 modelagem:{number:'III',category:'TERRITÓRIO III · ARQUITETURA',emblem:'◇',title:'Vales da Modelagem',description:'Transforme ideias em estruturas claras. Aqui nascem os projetos, requisitos e diagramas.',tone:'model',topics:[['Requisitos e regras de negócio','Entenda necessidades e defina o comportamento do sistema.'],['Diagramas e processos','Casos de uso, atividades e fluxos.'],['DER e modelagem de dados','Entidades, atributos, cardinalidade e relacionamentos.']],subject:'modelagem',note:'Guarde diagramas, documentos e especificações na biblioteca.'},
 tecnologia:{number:'IV',category:'TERRITÓRIO IV · INOVAÇÃO',emblem:'✧',title:'Fronteiras da Tecnologia',description:'Uma região dedicada às ferramentas, tendências e possibilidades que conectam o mundo digital.',tone:'tech',topics:[['Hardware e sistemas','Componentes, arquitetura e sistemas operacionais.'],['Redes e conectividade','Comunicação, protocolos e infraestrutura.'],['Inovação e ferramentas','Tecnologias emergentes e soluções digitais.']],subject:null,note:'Este território está mapeado. A trilha de atividades será construída em uma próxima etapa.'}
};
function renderRealmDetail(key){
 const realm=realmData[key]||realmData.programacao;
 document.querySelectorAll('.map-region-node').forEach(node=>node.classList.toggle('active',node.dataset.realm===key));
 $('realm-detail-number').textContent=realm.number;
 $('realm-detail-emblem').textContent=realm.emblem;
 $('realm-detail-emblem').className='realm-detail-emblem tone-'+realm.tone;
 $('realm-detail-category').textContent=realm.category;
 $('realm-detail-title').textContent=realm.title;
 $('realm-detail-description').textContent=realm.description;
 $('realm-detail-count').textContent=String(realm.topics.length).padStart(2,'0')+' ROTAS';
 $('realm-detail-topics').innerHTML=realm.topics.map((topic,index)=>'<article class="realm-topic"><span>0'+(index+1)+'</span><div><b>'+topic[0]+'</b><small>'+topic[1]+'</small></div><i>✧</i></article>').join('');
 $('realm-detail-note').textContent=realm.note;
 const action=$('realm-detail-action');
 if(realm.subject){action.disabled=false;action.textContent='Abrir biblioteca →';action.dataset.subject=realm.subject;}
 else{action.disabled=true;action.textContent='Trilha em preparação';delete action.dataset.subject;}
}


const trainingCategories={
 programacao:{name:'Programação',icon:'⌘',tone:'code'},
 banco:{name:'Banco de Dados',icon:'▤',tone:'data'},
 modelagem:{name:'Modelagem',icon:'◇',tone:'model'},
 geral:{name:'Tecnologia',icon:'✧',tone:'tech'},
 simulado:{name:'Grande Simulado',icon:'♛',tone:'exam'}
};
let trainingSession=null,trainingMode='quiz',trainingBusy=false;
function trainingEscape(value){return escapeText(value);}
function renderTrainingHistory(rows){
 const root=$('training-history');if(!root)return;
 if(!sessionUser){root.innerHTML='<div class="training-history-empty">Entre com Google para salvar e consultar seu histórico.</div>';return;}
 if(!rows?.length){root.innerHTML='<div class="training-history-empty">Nenhum treinamento concluído ainda. Sua primeira vitória começa em uma das trilhas acima.</div>';return;}
 root.innerHTML=rows.map(row=>{const cat=trainingCategories[row.category]||trainingCategories.geral;const pct=Math.round((Number(row.correct||0)/Math.max(1,Number(row.total||0)))*100);return '<article class="training-history-row"><span class="training-history-icon">'+cat.icon+'</span><div><b>'+cat.name+'</b><small>'+new Date(row.created_at).toLocaleDateString('pt-BR')+' · '+row.correct+'/'+row.total+' acertos</small></div><strong>'+pct+'%</strong></article>';}).join('');
}
async function loadTrainingHistory(){
 const root=$('training-history');if(!root)return;
 if(!sessionUser){renderTrainingHistory([]);return;}
 root.innerHTML='<div class="training-history-empty">Carregando seu histórico…</div>';
 const {data,error}=await supabase.from('quiz_attempts').select('id,category,correct,total,created_at').order('created_at',{ascending:false}).limit(8);
 if(error){root.innerHTML='<div class="training-history-empty">Não foi possível carregar o histórico agora.</div>';return;}
 renderTrainingHistory(data||[]);
}
function trainingHomeMessage(message){
 const area=$('training-play-area');area.hidden=false;area.innerHTML='<div class="training-feedback-panel"><span>✧</span><p>'+trainingEscape(message)+'</p><button type="button" data-training-close>Voltar às trilhas</button></div>';
}
async function startTraining(category,mode='quiz'){
 if(trainingBusy)return;
 if(!trainingCategories[category])return;
 trainingBusy=true;trainingMode=mode;
 const area=$('training-play-area');area.hidden=false;area.innerHTML='<div class="training-loading"><span class="training-loader">✧</span><b>Preparando seu desafio…</b><small>Selecionando questões e embaralhando as alternativas.</small></div>';
 area.scrollIntoView({behavior:'smooth',block:'start'});
 try{
  const {data,error}=await supabase.rpc('start_quiz',{p_category:category});
  if(error)throw error;
  trainingSession={id:data.session_id,category,questions:(data.questions||[]).map(q=>({id:q.id,prompt:q.prompt,options:q.options})),index:0,correct:0,streak:0,best:0,answered:false,history:[],boss:mode==='boss'?({programacao:'Sentinela do Código',banco:'Guardião dos Dados',modelagem:'Oráculo UML'}[category]):null};
  if(!trainingSession.questions.length)throw new Error('Nenhuma questão foi disponibilizada para esta trilha.');
  renderTrainingQuestion();
 }catch(error){trainingSession=null;trainingHomeMessage(error.message||'Não foi possível iniciar o treinamento.');}
 finally{trainingBusy=false;}
}
function renderTrainingQuestion(){
 const s=trainingSession;if(!s)return;
 const area=$('training-play-area'),q=s.questions[s.index],total=s.questions.length,pct=Math.round(s.index/total*100);
 const boss=s.boss;
 const options=q.options.map((option,i)=>'<button type="button" class="training-option" data-training-answer="'+i+'" '+(s.answered?'disabled':'')+'><span>'+String.fromCharCode(65+i)+'</span><b>'+trainingEscape(option)+'</b></button>').join('');
 area.innerHTML='<div class="training-quiz-shell '+(boss?'is-boss':'')+'"><div class="training-quiz-top"><div><small>'+(boss?'BATALHA CONTRA O GUARDIÃO': 'SALA DE TREINAMENTO')+'</small><h3>'+(boss?trainingEscape(boss):trainingCategories[s.category].name)+'</h3></div><button type="button" class="training-quit" data-training-close>Encerrar</button></div>'+(boss?'<div class="boss-health"><div><span>ENERGIA DO GUARDIÃO</span><b>'+(total-s.correct)+' / '+total+'</b></div><i><span style="width:'+Math.max(0,100-s.correct/total*100)+'%"></span></i></div>':'')+'<div class="training-progress-meta"><span>QUESTÃO '+(s.index+1)+' DE '+total+'</span><b>'+s.correct+' ACERTOS</b></div><div class="training-progress"><i style="width:'+pct+'%"></i></div><div class="training-question-card"><span class="training-question-number">0'+(s.index+1)+'</span><h4>'+trainingEscape(q.prompt)+'</h4><div class="training-options">'+options+'</div><div id="training-answer-feedback" class="training-answer-feedback" aria-live="polite"></div></div><div class="training-quiz-foot"><span>✧ Uma resposta por etapa · validação segura</span><span>SEQUÊNCIA '+s.streak+'</span></div></div>';
}
async function answerTraining(index){
 const s=trainingSession;if(!s||s.answered||trainingBusy)return;
 const q=s.questions[s.index],selected=q.options[index];if(typeof selected!=='string')return;
 trainingBusy=true;s.answered=true;
 const buttons=[...document.querySelectorAll('[data-training-answer]')];buttons.forEach(b=>b.disabled=true);
 const feedback=$('training-answer-feedback');if(feedback)feedback.innerHTML='<div class="training-answer-wait">Verificando resposta…</div>';
 try{
  const {data,error}=await supabase.rpc('answer_quiz_question',{p_session:s.id,p_question_id:q.id,p_answer:selected});
  if(error)throw error;
  s.correct=Number(data.correct_count||0);s.streak=Number(data.current_streak||0);s.best=Number(data.best_streak||0);s.history.push(!!data.is_correct);
  buttons.forEach((button,i)=>{if(q.options[i]===selected)button.classList.add(data.is_correct?'chosen-correct':'chosen-wrong');});
  if(feedback)feedback.innerHTML='<div class="training-answer-result '+(data.is_correct?'answer-correct':'answer-wrong')+'"><b>'+(data.is_correct?'Resposta correta':'Resposta incorreta')+'</b><p>'+trainingEscape(data.explanation||'Continue avançando para a próxima questão.')+'</p><button type="button" data-training-next>'+(s.index===s.questions.length-1?'Concluir desafio':'Próxima questão')+' <span>→</span></button></div>';
 }catch(error){
  s.answered=false;buttons.forEach(b=>b.disabled=false);
  if(feedback)feedback.innerHTML='<div class="training-answer-result answer-wrong"><b>Não foi possível validar.</b><p>'+trainingEscape(error.message||'Tente novamente.')+'</p></div>';
 }finally{trainingBusy=false;}
}
async function nextTrainingQuestion(){
 const s=trainingSession;if(!s||!s.answered||trainingBusy)return;
 if(s.index<s.questions.length-1){s.index++;s.answered=false;renderTrainingQuestion();return;}
 await finishTraining();
}
async function finishTraining(){
 const s=trainingSession;if(!s||trainingBusy)return;
 trainingBusy=true;
 const area=$('training-play-area');area.innerHTML='<div class="training-loading"><span class="training-loader">✧</span><b>Registrando seu resultado…</b><small>O servidor está validando a conclusão e as recompensas.</small></div>';
 try{
  const {data,error}=await supabase.rpc('finish_quiz',{p_session:s.id});if(error)throw error;
  const total=s.questions.length,correct=Number(data.correct??s.correct),pct=Math.round(correct/total*100),xp=Number(data.xp||0)+Number(data.streak_xp||0);
  const headline=pct>=85?'Desempenho extraordinário!':pct>=60?'Bom trabalho, aventureiro!':'Treino concluído. Continue evoluindo!';
  const rewards=guest?'<p class="training-guest-note">Modo visitante: o resultado foi validado, mas XP e histórico não são salvos. Entre com Google para registrar sua jornada.</p>':(xp?'<div class="training-reward"><b>+'+xp.toLocaleString('pt-BR')+' XP</b><span>Experiência adicionada ao personagem</span></div>':'<p class="training-guest-note">Resultado registrado. A recompensa diária desta categoria pode já ter sido recebida ou o limite diário de XP pode ter sido atingido.</p>');
  const bossWin=s.boss&&pct>=60;
  area.innerHTML='<div class="training-result"><div class="training-result-seal">'+(bossWin?'♜':pct>=85?'✧': '⚔')+'</div><small>'+(s.boss?'BATALHA ENCERRADA':'DESAFIO CONCLUÍDO')+'</small><h3>'+(bossWin?'Guardião derrotado!':headline)+'</h3><p>'+correct+' de '+total+' respostas corretas · '+pct+'% de aproveitamento</p><div class="training-result-bar"><i style="width:'+pct+'%"></i></div><div class="training-result-stats"><div><b>'+correct+'/'+total+'</b><span>ACERTOS</span></div><div><b>'+s.best+'</b><span>MELHOR SEQUÊNCIA</span></div><div><b>'+pct+'%</b><span>APROVEITAMENTO</span></div></div>'+rewards+(Array.isArray(data.achievements)&&data.achievements.length?'<p class="training-achievement-note">Conquistas desbloqueadas: '+data.achievements.map(trainingEscape).join(', ')+'</p>':'')+'<div class="training-result-actions"><button type="button" data-training-retry="'+s.category+'">Treinar novamente</button><button type="button" class="secondary" data-training-close>Voltar à sala</button></div></div>';
  trainingSession=null;
  if(sessionUser){await loadProfile().catch(()=>{});await loadTrainingHistory();}
 }catch(error){area.innerHTML='<div class="training-feedback-panel"><span>!</span><p>Não foi possível finalizar: '+trainingEscape(error.message||'erro inesperado')+'</p><button type="button" data-training-close>Voltar à sala</button></div>';}
 finally{trainingBusy=false;}
}
function closeTraining(){
 if(trainingSession&&!trainingSession.answered){const ok=confirm('Encerrar este desafio? As respostas já enviadas não serão convertidas em recompensa.');if(!ok)return;}
 trainingSession=null;const area=$('training-play-area');area.hidden=true;area.innerHTML='';
}
function handleTrainingClick(target){
 const start=target.closest('[data-training-start]');if(start){startTraining(start.dataset.trainingStart);return true;}
 const boss=target.closest('[data-training-boss]');if(boss){startTraining(boss.dataset.trainingBoss,'boss');return true;}
 const answer=target.closest('[data-training-answer]');if(answer){answerTraining(Number(answer.dataset.trainingAnswer));return true;}
 if(target.closest('[data-training-next]')){nextTrainingQuestion();return true;}
 const retry=target.closest('[data-training-retry]');if(retry){startTraining(retry.dataset.trainingRetry,trainingMode);return true;}
 if(target.closest('[data-training-close]')){closeTraining();return true;}
 return false;
}

function status(message){$('login-status').textContent=message||''}
function notify(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3500)}
function displayName(user){return user?.user_metadata?.full_name||user?.email?.split('@')[0]||'Aventureiro'}
function syncContext(){window.AcademiaCtx={supabase,user:sessionUser,guest,toast:notify,playerClass:profileData?.class||'mago'};}
function levelFromXp(xp){return Math.max(1,Math.floor((1+Math.sqrt(1+Math.max(0,xp)/12.5))/2));}
async function loadProfile(){
 if(!sessionUser||!supabase)return;
 const [profile,wallet]=await Promise.all([
  supabase.from('player_profiles').select('adventurer_name,class,total_xp,appearance').maybeSingle(),
  supabase.from('coin_wallets').select('balance').maybeSingle()
 ]);
 if(profile.error)throw profile.error;
 if(wallet.error)throw wallet.error;
 profileData=profile.data||{};
 const xp=Number(profileData.total_xp||0),coins=Number(wallet.data?.balance||0),level=levelFromXp(xp);
 const name=profileData.adventurer_name||displayName(sessionUser);
 $('sidebar-name').textContent=name;$('home-name').textContent=name;$('home-class').textContent=profileData.class||'Aventureiro da Academia';
 $('character-name').value=profileData.adventurer_name||'';
 $('character-class').value=profileData.class||'mago';
 $('top-level').textContent='NÍVEL '+level;$('top-coins').textContent=coins.toLocaleString('pt-BR')+' COINS';
 $('home-level').textContent='NÍVEL '+level;$('avatar-level').textContent=level;
 $('home-xp').textContent=xp+' XP';$('home-total-xp').textContent=xp.toLocaleString('pt-BR')+' XP';
 $('home-total-coins').textContent=coins.toLocaleString('pt-BR');
 $('home-xp-bar').style.width=Math.min(100,(xp%100))+'%';
 syncContext();
 if(window.AcademiaAvatar&&$('home-avatar'))$('home-avatar').innerHTML=window.AcademiaAvatar.render(profileData.appearance||{},'mini',profileData.class||'mago');
}
function renderCharacterOverview(){
 const root=$('character-visual-preview');if(!root)return;
 const snapshot=window.AcademiaAvatar?.getSnapshot?.();
 const xp=Number(profileData?.total_xp||0),level=levelFromXp(xp),coins=Number(snapshot?.balance??$('home-total-coins')?.textContent?.replace(/\\D/g,'')??0);
 const name=profileData?.adventurer_name||displayName(sessionUser);
 const playerClass=profileData?.class||'mago';
 $('character-display-name').textContent=name;
 $('character-display-class').textContent=playerClass[0].toUpperCase()+playerClass.slice(1)+' · Academia RPG';
 $('character-level-badge').textContent='NÍVEL '+level;
 $('character-stat-level').textContent=level;
 $('character-stat-xp').textContent=xp.toLocaleString('pt-BR');
 $('character-stat-coins').textContent=coins.toLocaleString('pt-BR');
 $('character-xp-label').textContent=xp.toLocaleString('pt-BR')+' XP';
 $('character-xp-fill').style.width=Math.min(100,xp%100)+'%';
 $('character-stat-items').textContent=Number(snapshot?.ownedCount||0).toLocaleString('pt-BR');
 root.innerHTML=window.AcademiaAvatar?.render(snapshot?.appearance||profileData?.appearance||{},'profile',playerClass)||'<span>✧</span>';
 const equipped=$('character-equipped-list');
 const rows=snapshot?.equipped||[];
 equipped.innerHTML=rows.length?rows.map(x=>'<article class="character-equipped-item"><span class="character-equipped-icon">'+escapeText(x.icon||'✦')+'</span><div><b>'+escapeText(x.name)+'</b><small>'+escapeText(x.label)+'</small></div><span class="character-equipped-state">ATIVO</span></article>').join(''):'<div class="character-loadout-empty"><b>Nenhum equipamento especial ativo.</b><span>Visite o Ateliê para montar seu conjunto.</span></div>';
}
window.addEventListener('academia-character-overview-refresh',()=>renderCharacterOverview());
function showApp(user,isGuest=false){
 sessionUser=user;guest=isGuest;
 $('login-screen').hidden=true;$('app-shell').hidden=false;
 const name=isGuest?'Visitante':displayName(user);
 $('sidebar-name').textContent=name;$('sidebar-mode').textContent=isGuest?'Modo visitante':user?.email||'Conta conectada';
 $('user-avatar').textContent=name.slice(0,1).toUpperCase();$('top-initial').textContent=name.slice(0,1).toUpperCase();
 $('home-name').textContent=name;$('home-class').textContent=isGuest?'Explorador convidado':'Aventureiro da Academia';
 syncContext();
 if(user){libraryLoaded=false;loadProfile().catch(error=>{console.error('Perfil Academia RPG:',error);notify('Não foi possível carregar todos os dados do personagem.');});}
 else{libraryLoaded=false;profileData=null;$('top-level').textContent='VISITANTE';$('top-coins').textContent='— COINS';}
}
async function loginGoogle(){
 if(!supabase){status('Não foi possível conectar ao serviço de autenticação.');return;}
 status('Redirecionando para o Google…');
 const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});
 if(error)status('Falha no login: '+error.message);
}
function enterGuest(){showApp(null,true);notify('Você entrou como visitante. O progresso não será sincronizado com sua conta.');}
async function navigate(page){
 const data=titles[page]||titles.inicio;
 document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
 document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
 if(page==='inicio')$('page-inicio').classList.add('active');
 else if(page==='biblioteca'){
  $('page-biblioteca').classList.add('active');
  if(!libraryLoaded)await loadLibrary();else renderLibrary();
 }else if(page==='personagem'){
  $('page-personagem').classList.add('active');
  if(sessionUser){try{await loadProfile();}catch(error){$('character-status').textContent='Não foi possível carregar a ficha: '+error.message;}}
  syncContext();
  if(window.AcademiaAvatar){await window.AcademiaAvatar.openCreator();renderCharacterOverview();}
  else $('rpgView').innerHTML='<div class="identity-status">O criador de personagem ainda está carregando. Tente novamente em instantes.</div>';
 }else if(page==='atelier'){
  $('page-atelier').classList.add('active');
  syncContext();
  if(window.AcademiaAvatar)await window.AcademiaAvatar.open('shop');
  else $('atelierView').innerHTML='<div class="identity-status">O Ateliê Arcano ainda está carregando. Tente novamente em instantes.</div>';
 }else if(page==='treinamento'){
  $('page-treinamento').classList.add('active');
  await loadTrainingHistory();
 }else if(page==='mapa'){
  $('page-mapa').classList.add('active');
  renderRealmDetail(window.selectedAcademyRealm||'programacao');
 }else{
  $('page-generic').classList.add('active');
  $('generic-kicker').textContent='ACADEMIA RPG · 2.0 / '+data[0];
  $('generic-title').textContent=data[1];$('generic-description').textContent=data[2];$('generic-icon').textContent=data[3];
  $('generic-card-title').textContent='Este território está sendo reconstruído.';
  $('generic-card-description').textContent='Esta área será integrada ao novo sistema em uma etapa própria. Sua conta e seus dados atuais permanecem preservados.';
 }
 $('breadcrumb-page').textContent=data[0];$('sidebar').classList.remove('open');
}
document.addEventListener('click',e=>{
 if(handleTrainingClick(e.target))return;
 const region=e.target.closest('[data-realm]');
 if(region){window.selectedAcademyRealm=region.dataset.realm;renderRealmDetail(region.dataset.realm);return;}
 const openLibrary=e.target.closest('#realm-detail-action');
 if(openLibrary&&!openLibrary.disabled){librarySubject=openLibrary.dataset.subject;navigate('biblioteca');return;}
 const nav=e.target.closest('[data-page]');
 if(nav){e.preventDefault();navigate(nav.dataset.page);}
});
$('google-login').addEventListener('click',loginGoogle);
$('guest-login').addEventListener('click',enterGuest);
$('logout').addEventListener('click',async()=>{
 if(guest){guest=false;sessionUser=null;profileData=null;$('app-shell').hidden=true;$('login-screen').hidden=false;syncContext();return;}
 if(supabase)await supabase.auth.signOut();
});
$('profile-button').addEventListener('click',()=>navigate('personagem'));
$('mobile-menu').addEventListener('click',()=>$('sidebar').classList.toggle('open'));
$('save-character').addEventListener('click',async()=>{
 const output=$('character-status');
 if(!sessionUser){output.textContent='Entre com Google para salvar sua ficha.';return;}
 const name=$('character-name').value.trim().replace(/\s+/g,' ');
 const playerClass=$('character-class').value;
 if(!/^[\p{L}\p{N} _-]{3,20}$/u.test(name)){output.textContent='Use um nome de 3 a 20 caracteres, sem símbolos especiais.';return;}
 const button=$('save-character');button.disabled=true;output.textContent='Salvando sua ficha…';
 try{
  const {error}=await supabase.rpc('set_character',{p_name:name,p_class:playerClass});
  if(error)throw error;
  profileData={...(profileData||{}),adventurer_name:name,class:playerClass};
  $('sidebar-name').textContent=name;$('home-name').textContent=name;$('home-class').textContent=playerClass[0].toUpperCase()+playerClass.slice(1);
  syncContext();output.textContent='Ficha salva e sincronizada com sua conta.';
  if(window.AcademiaAvatar){await window.AcademiaAvatar.openCreator();renderCharacterOverview();}
 }catch(error){output.textContent='Não foi possível salvar: '+(error.message||'erro inesperado');}
 finally{button.disabled=false;}
});

let librarySubject='programacao',libraryFiles=[],libraryLoaded=false,libraryBusy=false;
const librarySubjects={
 programacao:['Programação','Projetos, códigos, exercícios e materiais da disciplina.'],
 banco:['Banco de Dados','Scripts SQL, consultas, atividades e anotações.'],
 modelagem:['Modelagem','Diagramas, requisitos e documentação de sistemas.']
};
function formatBytes(bytes){if(!Number.isFinite(Number(bytes))||Number(bytes)<=0)return '0 KB';const units=['B','KB','MB','GB'];let n=Number(bytes),i=0;while(n>=1024&&i<units.length-1){n/=1024;i++;}return n.toLocaleString('pt-BR',{maximumFractionDigits:1})+' '+units[i];}
function escapeText(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fileIcon(name){const ext=String(name).split('.').pop().toLowerCase();return ({pdf:'▤',doc:'W',docx:'W',odt:'W',txt:'≡',md:'≡',sql:'⌘',js:'JS',java:'J',html:'5',css:'3',png:'▧',jpg:'▧',jpeg:'▧',webp:'▧',zip:'▣',ppt:'▥',pptx:'▥',xls:'▦',xlsx:'▦'})[ext]||'▤';}
async function loadLibrary(){
 const root=$('library-file-list');if(!sessionUser){root.innerHTML='<div class="library-empty"><span>◈</span><b>Entre para abrir seu cofre pessoal.</b><p>Faça login com Google para enviar arquivos e acessá-los em outros dispositivos com a mesma conta.</p></div>';$('library-sync-state').textContent='◈ Aguardando conta';return;}
 root.innerHTML='<div class="library-loading">Sincronizando seus arquivos…</div>';$('library-sync-state').textContent='◈ Conectando à nuvem';
 const {data,error}=await supabase.from('study_files').select('id,subject,file_name,object_path,size,mime_type,created_at').order('created_at',{ascending:false});
 if(error){root.innerHTML='<div class="library-empty"><b>Não foi possível abrir a biblioteca.</b><p>'+escapeText(error.message)+'</p><button class="library-retry" id="library-retry">Tentar novamente</button></div>';$('library-sync-state').textContent='◈ Falha na sincronização';return;}
 libraryFiles=data||[];libraryLoaded=true;$('library-total').textContent=libraryFiles.length.toLocaleString('pt-BR');$('library-sync-state').textContent='◈ Sincronizado com segurança';renderLibrary();
}
function renderLibrary(){
 const [name,description]=librarySubjects[librarySubject];$('library-subject-title').textContent=name;$('library-subject-description').textContent=description;
 document.querySelectorAll('.library-subject').forEach(b=>b.classList.toggle('active',b.dataset.subject===librarySubject));
 const q=$('library-search').value.trim().toLocaleLowerCase('pt-BR');
 const rows=libraryFiles.filter(f=>f.subject===librarySubject&&f.file_name.toLocaleLowerCase('pt-BR').includes(q));
 const root=$('library-file-list');
 if(!rows.length){root.innerHTML='<div class="library-empty"><span>✧</span><b>'+(q?'Nenhum arquivo encontrado.':'Este território ainda está vazio.')+'</b><p>'+(q?'Tente outro termo de busca.':'Adicione seus primeiros materiais para construir sua biblioteca de estudos.')+'</p></div>';return;}
 root.innerHTML=rows.map(f=>'<article class="library-file"><span class="library-file-icon">'+fileIcon(f.file_name)+'</span><span class="library-file-meta"><b title="'+escapeText(f.file_name)+'">'+escapeText(f.file_name)+'</b><small>'+formatBytes(f.size)+' · '+new Date(f.created_at).toLocaleDateString('pt-BR')+'</small></span><span class="library-file-actions"><button type="button" data-library-download="'+escapeText(f.id)+'" aria-label="Baixar '+escapeText(f.file_name)+'">↓</button><button type="button" data-library-delete="'+escapeText(f.id)+'" aria-label="Excluir '+escapeText(f.file_name)+'">×</button></span></article>').join('');
}
async function uploadLibraryFiles(list){
 if(!sessionUser){notify('Entre com Google para sincronizar arquivos na nuvem.');return;}
 if(libraryBusy)return;libraryBusy=true;
 let uploaded=0;
 try{
  for(const file of Array.from(list||[])){
   const safeName=file.name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._() -]/g,'_').replace(/\s+/g,'_').slice(-110)||'arquivo';
   const objectPath=sessionUser.id+'/'+librarySubject+'/'+crypto.randomUUID()+'-'+safeName;
   const {error:storageError}=await supabase.storage.from('study-files').upload(objectPath,file,{cacheControl:'3600',upsert:false,contentType:file.type||'application/octet-stream'});
   if(storageError){notify('Falha ao enviar '+file.name+': '+storageError.message);continue;}
   const {error:rowError}=await supabase.from('study_files').insert({owner_id:sessionUser.id,subject:librarySubject,file_name:file.name,object_path:objectPath,size:file.size,mime_type:file.type||null});
   if(rowError){await supabase.storage.from('study-files').remove([objectPath]);notify('Falha ao registrar '+file.name+': '+rowError.message);continue;}
   uploaded++;
  }
 }finally{libraryBusy=false;$('library-upload').value='';}
 await loadLibrary();if(uploaded)notify(uploaded+' arquivo(s) enviado(s) para sua biblioteca.');
}
async function downloadLibraryFile(id){
 const f=libraryFiles.find(x=>String(x.id)===String(id));if(!f||!sessionUser)return;
 const {data,error}=await supabase.storage.from('study-files').download(f.object_path);
 if(error){notify('Não foi possível baixar: '+error.message);return;}
 const url=URL.createObjectURL(data),a=document.createElement('a');a.href=url;a.download=f.file_name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function deleteLibraryFile(id){
 const f=libraryFiles.find(x=>String(x.id)===String(id));if(!f||!sessionUser)return;
 if(!confirm('Excluir "'+f.file_name+'" da sua biblioteca?'))return;
 const {error:storageError}=await supabase.storage.from('study-files').remove([f.object_path]);
 if(storageError){notify('Não foi possível excluir o arquivo: '+storageError.message);return;}
 const {error:rowError}=await supabase.from('study_files').delete().eq('id',f.id).eq('owner_id',sessionUser.id);
 if(rowError){notify('O arquivo foi removido do armazenamento, mas o registro não pôde ser atualizado: '+rowError.message);return;}
 libraryFiles=libraryFiles.filter(x=>String(x.id)!==String(id));$('library-total').textContent=libraryFiles.length.toLocaleString('pt-BR');renderLibrary();notify('Arquivo excluído da biblioteca.');
}
document.querySelectorAll('.library-subject').forEach(b=>b.addEventListener('click',()=>{librarySubject=b.dataset.subject;renderLibrary();}));
$('library-search').addEventListener('input',renderLibrary);
$('library-upload').addEventListener('change',e=>uploadLibraryFiles(e.target.files));
$('library-file-list').addEventListener('click',e=>{
 const retry=e.target.closest('#library-retry');if(retry){libraryLoaded=false;loadLibrary();return;}
 const down=e.target.closest('[data-library-download]');if(down){downloadLibraryFile(down.dataset.libraryDownload);return;}
 const del=e.target.closest('[data-library-delete]');if(del)deleteLibraryFile(del.dataset.libraryDelete);
});

async function init(){
 try{
  supabase=createClient(SUPABASE_URL,SUPABASE_KEY);
  supabase.auth.onAuthStateChange((_event,session)=>{
   if(session?.user)showApp(session.user);
   else if(!guest){sessionUser=null;profileData=null;syncContext();$('app-shell').hidden=true;$('login-screen').hidden=false;}
  });
  const {data,error}=await supabase.auth.getSession();if(error)throw error;
  if(data.session?.user)showApp(data.session.user);
 }catch(error){status('Autenticação indisponível no momento. Você ainda pode explorar como visitante.');console.error('Academia RPG 2.0 auth:',error);}
}
init();
