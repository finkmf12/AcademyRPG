import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const SUPABASE_URL='https://bvsxvcvuiorvwxxlqrmy.supabase.co';
const SUPABASE_KEY='sb_publishable_qBKPW3YTNn8k9p4_SMg_MQ_mAkAU_L6';
const $=id=>document.getElementById(id);
let supabase,sessionUser=null,guest=false,toastTimer,profileData=null;
const titles={
 inicio:['VISÃO GERAL','O Reino aguarda por você.','Acompanhe sua jornada e escolha seu próximo destino.','✧'],
 personagem:['PERSONAGEM','Seu herói, suas escolhas.','Defina sua identidade e construa a aparência do seu aventureiro.','♙'],
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
}
function showApp(user,isGuest=false){
 sessionUser=user;guest=isGuest;
 $('login-screen').hidden=true;$('app-shell').hidden=false;
 const name=isGuest?'Visitante':displayName(user);
 $('sidebar-name').textContent=name;$('sidebar-mode').textContent=isGuest?'Modo visitante':user?.email||'Conta conectada';
 $('user-avatar').textContent=name.slice(0,1).toUpperCase();$('top-initial').textContent=name.slice(0,1).toUpperCase();
 $('home-name').textContent=name;$('home-class').textContent=isGuest?'Explorador convidado':'Aventureiro da Academia';
 syncContext();
 if(user)loadProfile().catch(error=>{console.error('Perfil Academia RPG:',error);notify('Não foi possível carregar todos os dados do personagem.');});
 else{profileData=null;$('top-level').textContent='VISITANTE';$('top-coins').textContent='— COINS';}
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
 else if(page==='personagem'){
  $('page-personagem').classList.add('active');
  if(sessionUser){try{await loadProfile();}catch(error){$('character-status').textContent='Não foi possível carregar a ficha: '+error.message;}}
  syncContext();
  if(window.AcademiaAvatar)window.AcademiaAvatar.openCreator();
  else $('rpgView').innerHTML='<div class="identity-status">O ateliê ainda está carregando. Tente novamente em instantes.</div>';
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
  if(window.AcademiaAvatar)await window.AcademiaAvatar.openCreator();
 }catch(error){output.textContent='Não foi possível salvar: '+(error.message||'erro inesperado');}
 finally{button.disabled=false;}
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
