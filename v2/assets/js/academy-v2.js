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
 if(window.AcademiaAvatar&&$('home-avatar'))$('home-avatar').innerHTML=window.AcademiaAvatar.render(profileData.appearance||{},'mini',profileData.class||'mago');
}
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
   const safeName=file.name.normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-zA-Z0-9._() -]/g,'_').replace(/\\s+/g,'_').slice(-110)||'arquivo';
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
