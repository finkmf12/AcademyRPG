// Academia RPG · Visitação de personagens e espaços pessoais
(() => {
  'use strict';
  const $ = (selector, root=document) => root.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const state = { target:null, data:null, busy:false, observer:null };
  const ctx = () => window.AcademiaCtx;
  const toast = message => ctx()?.toast?.(message);
  const rpc = async (name,args={}) => {
    const c=ctx();
    if(!c?.supabase || !c.user || c.guest) throw new Error('Entre com sua conta Google para usar os espaços pessoais.');
    const {data,error}=await c.supabase.rpc(name,args);
    if(error) throw error;
    return data;
  };
  const number = value => Number(value||0).toLocaleString('pt-BR');
  const date = value => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
  };
  const achievementNames = {
    primeiro:'Primeiro passo',sequencia:'Sequência de fogo',gabarito:'Gabarito',
    explorador:'Explorador',simulado:'Veterano',nivel5:'Nível 5',
    dedicado:'Dedicado',colecionador:'Colecionador'
  };
  const classNames = {guerreiro:'Guerreiro',mago:'Mago',arqueiro:'Arqueiro',assassino:'Assassino'};
  function injectVisitButtons(){
    const root=$('#rpgView');
    if(!root) return;
    if(root.querySelector('.adv-hero') && !root.querySelector('[data-visit-self]')){
      const hero=root.querySelector('.adv-hero');
      if(hero.querySelector('h3')?.textContent.includes('Adicione seus amigos')){
        const button=document.createElement('button');
        button.type='button';button.className='adv-btn adv-btn-soft adv-own-space-button';
        button.dataset.visitSelf='true';button.textContent='✦ Meu espaço';
        hero.append(button);
      }
    }
    root.querySelectorAll('.adv-member[data-player-friend="true"][data-player-id]').forEach(card=>{
      if(card.querySelector('[data-visit-player]')) return;
      const button=document.createElement('button');
      button.type='button';button.className='adv-btn adv-btn-soft adv-visit-button';
      button.dataset.visitPlayer=card.dataset.playerId;button.textContent='Visitar';
      button.setAttribute('aria-label','Visitar espaço de '+(card.querySelector('b')?.textContent||'aventureiro'));
      card.append(button);
    });
  }
  function guestbookMarkup(data){
    const rows=data.guestbook||[];
    if(!rows.length) return '<div class="space-empty">Este mural ainda está em branco. Seja o primeiro a deixar um recado.</div>';
    return rows.map(message=>'<article class="space-message"><span class="space-message-avatar">'+esc(message.author_avatar||'🧙')+'</span><div class="space-message-body"><div class="space-message-meta"><b>'+esc(message.author_name)+'</b><time>'+esc(date(message.created_at))+'</time></div><p>'+esc(message.body)+'</p></div>'+((data.is_owner||message.author_id===ctx()?.user?.id)?'<button type="button" class="space-delete-message" data-space-delete="'+esc(message.id)+'" aria-label="Apagar recado" title="Apagar recado">×</button>':'')+'</article>').join('');
  }
  function renderSpace(data){
    const root=$('#rpgView');if(!root)return;
    const profile=data.profile||{},stats=data.stats||{},owner=!!data.is_owner;
    const avatar=window.AcademiaAvatar?.render?.(profile.appearance||{},'profile',profile.class)||'<div class="space-avatar-fallback">'+esc(profile.avatar||'🧙')+'</div>';
    const guild=data.guild;
    const guildLabel=guild?.tag ? '['+guild.tag+'] '+guild.name : guild?.name || 'Sem guilda';
    const equipped=(data.equipped||[]);
    const achievements=(data.achievements||[]);
    const featured=equipped.slice(0,8).map(item=>'<div class="space-item-card"><span>'+esc(item.icon||'✦')+'</span><b>'+esc(item.name)+'</b><small>'+esc(item.rarity||'Visual equipado')+'</small></div>').join('');
    const achievementCards=achievements.slice(0,8).map(item=>'<span class="space-achievement-chip" title="'+esc(achievementNames[item.id]||item.id)+'">✧ '+esc(achievementNames[item.id]||item.id)+'</span>').join('');
    const settings=data.settings||{visibility:'friends',allow_guestbook:true};
    const visibilityLabel={friends:'Somente amigos',everyone:'Todos os aventureiros',private:'Somente eu'}[settings.visibility]||'Somente amigos';
    const visitorRows=(data.recent_visitors||[]).map(visitor=>'<div class="space-visitor"><span>'+esc(visitor.visitor_avatar||'🧙')+'</span><b>'+esc(visitor.visitor_name)+'</b><time>'+esc(date(visitor.visited_at))+'</time></div>').join('');
    root.innerHTML=
      '<div class="space-toolbar"><button type="button" class="adv-btn adv-btn-soft" data-space-back>← Voltar para amigos</button><span class="space-privacy-indicator">◈ '+esc(visibilityLabel)+'</span></div>'+
      '<section class="space-profile-hero"><div class="space-profile-art"><div class="space-art-orbit"></div><div class="space-character">'+avatar+'</div></div><div class="space-profile-info"><span class="adv-kicker">ESPAÇO DO AVENTUREIRO</span><h2>'+esc(profile.player_name||'Aventureiro')+'</h2><div class="space-profile-tags"><span>'+esc(classNames[profile.class]||'Aventureiro')+'</span><span>'+esc(guildLabel)+'</span></div><p>Um recanto pessoal no reino, onde ficam registradas as conquistas e jornadas deste aventureiro.</p><div class="space-profile-stats"><div><b>'+number(profile.total_xp)+'</b><small>XP total</small></div><div><b>'+number(stats.visits)+'</b><small>Visitas</small></div><div><b>'+number(stats.likes)+'</b><small>Curtidas</small></div><div><b>'+number(stats.messages)+'</b><small>Recados</small></div></div><div class="space-profile-actions">'+(!owner?'<button type="button" class="adv-btn '+(stats.visitor_has_liked?'adv-btn-soft':'')+'" data-space-like>'+ (stats.visitor_has_liked?'♥ Curtido':'♡ Curtir espaço')+'</button>':'<span class="space-owner-note">Este é o seu espaço pessoal</span>')+'</div></div></section>'+
      '<div class="space-content-grid"><section class="adv-panel space-showcase"><div class="space-section-heading"><div><span class="adv-kicker">COLEÇÃO PESSOAL</span><h3>Vitrine de equipamentos</h3><p>Visuais que este aventureiro escolheu exibir.</p></div><span class="space-heading-icon">✧</span></div><div class="space-items-grid">'+(featured||'<div class="space-empty">Nenhum visual equipado para exibição no momento.</div>')+'</div></section>'+
      '<section class="adv-panel space-achievements"><div class="space-section-heading"><div><span class="adv-kicker">JORNADA</span><h3>Conquistas desbloqueadas</h3><p>Marcos registrados no Livro de Conquistas.</p></div><span class="space-heading-icon">♛</span></div><div class="space-achievement-list">'+(achievementCards||'<div class="space-empty">As próximas conquistas aparecerão aqui.</div>')+'</div></section></div>'+
      '<section class="adv-panel space-guestbook"><div class="space-section-heading"><div><span class="adv-kicker">MENSAGENS DA COMUNIDADE</span><h3>Mural de recados</h3><p>Deixe uma mensagem respeitosa para este aventureiro.</p></div><span class="space-heading-icon">✉</span></div>'+
      (!owner&&settings.allow_guestbook?'<form id="spaceGuestbookForm" class="space-guestbook-form"><textarea id="spaceGuestbookText" maxlength="240" minlength="2" required placeholder="Escreva um recado (até 240 caracteres)..."></textarea><div><small>2 a 240 caracteres</small><button type="submit" class="adv-btn">Publicar recado</button></div></form>':'')+
      (!settings.allow_guestbook&&!owner?'<div class="space-empty">O mural está fechado para novos recados.</div>':'')+
      '<div class="space-messages-list">'+guestbookMarkup(data)+'</div></section>'+
      (owner?'<div class="space-owner-grid"><section class="adv-panel space-settings"><div class="space-section-heading"><div><span class="adv-kicker">CONTROLE DO ESPAÇO</span><h3>Privacidade e permissões</h3><p>Escolha quem pode visitar seu espaço e escrever no mural.</p></div><span class="space-heading-icon">⚙</span></div><form id="spaceSettingsForm" class="space-settings-form"><label>Quem pode visitar?<select id="spaceVisibility"><option value="friends" '+(settings.visibility==='friends'?'selected':'')+'>Somente amigos</option><option value="everyone" '+(settings.visibility==='everyone'?'selected':'')+'>Todos os aventureiros</option><option value="private" '+(settings.visibility==='private'?'selected':'')+'>Somente eu</option></select></label><label class="space-toggle-label"><input id="spaceAllowGuestbook" type="checkbox" '+(settings.allow_guestbook?'checked':'')+'> Permitir recados no meu mural</label><button type="submit" class="adv-btn">Salvar preferências</button></form></section><section class="adv-panel space-visitors"><div class="space-section-heading"><div><span class="adv-kicker">MOVIMENTO NO REINO</span><h3>Visitantes recentes</h3><p>Últimos aventureiros que passaram por aqui.</p></div><span class="space-heading-icon">♟</span></div><div class="space-visitors-list">'+(visitorRows||'<div class="space-empty">Seu primeiro visitante aparecerá aqui.</div>')+'</div></section></div>':'');
    const title=$('#pageTitle');const kicker=$('#pageKicker');const sub=$('#pageSub');
    if(title)title.textContent='Espaço de '+(profile.player_name||'Aventureiro');
    if(kicker)kicker.textContent='ENCONTRO ENTRE AVENTUREIROS';
    if(sub)sub.textContent=owner?'Seu espaço pessoal, sua história no reino.':'Conheça a jornada, os visuais e as conquistas deste aventureiro.';
    root.scrollIntoView?.({behavior:'smooth',block:'start'});
  }
  async function openSpace(target){
    if(state.busy)return;
    state.busy=true;state.target=target;
    const root=$('#rpgView');
    if(root)root.innerHTML='<div class="adv-panel space-loading"><span class="adv-spinner"></span><b>Preparando o espaço pessoal...</b><small>Consultando o reino e as permissões de visita.</small></div>';
    try{const data=await rpc('get_player_space',{p_target:target});state.data=data;renderSpace(data);}
    catch(error){if(root)root.innerHTML='<div class="adv-panel space-error"><b>Não foi possível abrir este espaço.</b><p>'+esc(error.message||'Tente novamente.')+'</p><button type="button" class="adv-btn adv-btn-soft" data-space-back>Voltar para amigos</button></div>';toast(error.message||'Não foi possível abrir o espaço.');}
    finally{state.busy=false;}
  }
  async function refreshSpace(){if(!state.target)return;const data=await rpc('get_player_space',{p_target:state.target});state.data=data;renderSpace(data);}
  async function handleClick(event){
    const visit=event.target.closest('[data-visit-player]');
    const self=event.target.closest('[data-visit-self]');
    const back=event.target.closest('[data-space-back]');
    const like=event.target.closest('[data-space-like]');
    const remove=event.target.closest('[data-space-delete]');
    if(visit){event.preventDefault();event.stopPropagation();return openSpace(visit.dataset.visitPlayer);}
    if(self){event.preventDefault();event.stopPropagation();return openSpace(ctx()?.user?.id);}
    if(back){event.preventDefault();event.stopPropagation();state.target=null;const button=$('[data-adventure="friends"]');if(button)button.click();return;}
    if(like){event.preventDefault();if(state.busy||!state.target)return;state.busy=true;like.disabled=true;try{await rpc('toggle_player_space_like',{p_owner_id:state.target});await refreshSpace();}catch(error){toast(error.message||'Não foi possível registrar a curtida.');}finally{state.busy=false;}return;}
    if(remove){event.preventDefault();if(state.busy)return;if(!confirm('Apagar este recado do mural?'))return;state.busy=true;try{const removed=await rpc('delete_player_space_message',{p_message_id:remove.dataset.spaceDelete});if(!removed)throw new Error('O recado não foi encontrado ou você não tem permissão para apagá-lo.');await refreshSpace();toast('Recado removido.');}catch(error){toast(error.message||'Não foi possível apagar o recado.');}finally{state.busy=false;}}
  }
  async function handleSubmit(event){
    if(event.target.id==='spaceGuestbookForm'){
      event.preventDefault();if(state.busy)return;
      const input=$('#spaceGuestbookText');const body=input?.value.trim()||'';
      if(body.length<2||body.length>240){toast('O recado deve ter entre 2 e 240 caracteres.');return;}
      state.busy=true;
      try{await rpc('post_player_space_message',{p_owner_id:state.target,p_body:body});await refreshSpace();toast('Seu recado foi publicado.');}
      catch(error){toast(error.message||'Não foi possível publicar o recado.');}
      finally{state.busy=false;}
    }
    if(event.target.id==='spaceSettingsForm'){
      event.preventDefault();if(state.busy)return;
      state.busy=true;
      try{await rpc('save_player_space_settings',{p_visibility:$('#spaceVisibility').value,p_allow_guestbook:$('#spaceAllowGuestbook').checked});await refreshSpace();toast('Preferências do espaço atualizadas.');}
      catch(error){toast(error.message||'Não foi possível salvar as preferências.');}
      finally{state.busy=false;}
    }
  }
  function initialize(){
    const root=$('#rpgView');
    if(!root){window.setTimeout(initialize,120);return;}
    document.addEventListener('click',handleClick,true);
    document.addEventListener('submit',handleSubmit,true);
    state.observer=new MutationObserver(injectVisitButtons);
    state.observer.observe(root,{childList:true,subtree:true});
    injectVisitButtons();
  }
  initialize();
})();
