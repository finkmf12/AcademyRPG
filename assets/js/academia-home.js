// Academia RPG · painel lendário, ranking, missões e mapa do reino
(() => {
  'use strict';
  const $=id=>document.getElementById(id), C=()=>window.AcademiaCtx;
  const need=l=>50*l*(l-1);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>Number(v||0).toLocaleString('pt-BR');
  const classNames={guerreiro:'Guerreiro',mago:'Mago',arqueiro:'Arqueiro',assassino:'Assassino'};
  let request=0;
  function renderAvatar(profile){
    const node=$('homeAvatarRender');if(!node)return;
    const api=window.AcademiaAvatar,appearance=profile.appearance||{};
    if(api?.render){node.innerHTML=api.render(appearance,'profile',profile.class||'mago');node.classList.add('is-rendered');}
    else {node.textContent=profile.avatar||'⚔';node.classList.remove('is-rendered');}
    const title=$('homePlayerTitle');
    if(title){
      const markup=api?.titleMarkup?.(appearance,'profile');
      if(markup){title.innerHTML=markup;title.hidden=false;}
      else if(appearance.title==='title-owner'){title.innerHTML='<span class="home-owner-title">✦ DONO ✦</span>';title.hidden=false;}
      else {title.innerHTML='';title.hidden=true;}
    }
    const mark=$('homeClassMark');if(mark)mark.textContent=({guerreiro:'⚔',mago:'✧',arqueiro:'➶',assassino:'◈'}[profile.class]||'✦');
  }
  function renderRanking(result){
    const target=$('homeRankingPreview');if(!target)return;
    const rows=(result?.entries||[]).slice(0,3);
    if(!rows.length){target.innerHTML='<div class="home-world-empty">Ainda não há campeões registrados. Seja o primeiro a entrar para a história.</div>';return;}
    target.innerHTML=rows.map((e,i)=>{
      const avatar=window.AcademiaAvatar?.render?window.AcademiaAvatar.render(e.appearance||{},'rank',e.class||'mago'):'<span class="home-rank-fallback">⚔</span>';
      const name=window.AcademiaAvatar?.nameMarkup?.(e.name,e.appearance||{})||esc(e.name);
      const title=window.AcademiaAvatar?.titleMarkup?.(e.appearance||{},'rank')||'';
      return '<div class="home-rank-row rank-'+(i+1)+'"><span class="home-rank-medal">'+(['♛','Ⅱ','Ⅲ'][i]||String(i+1))+'</span><span class="home-rank-avatar">'+avatar+'</span><span class="home-rank-person"><b>'+name+'</b>'+title+'<small>'+esc(e.class||'Aventureiro')+' · Nível '+fmt(e.level)+'</small></span><strong>'+fmt(e.xp)+' <small>XP</small></strong></div>';
    }).join('');
  }
  function renderMissions(items){
    const target=$('homeMissionPreview');if(!target)return;
    const rows=(items||[]).slice(0,3);
    if(!rows.length){target.innerHTML='<div class="home-world-empty">Nenhum contrato ativo no momento. Volte em breve, aventureiro.</div>';return;}
    target.innerHTML=rows.map(m=>{
      const progress=Number(m.progress||0),goal=Number(m.target||0),pct=goal?Math.max(0,Math.min(100,Math.round(progress/goal*100))):0;
      const status=m.claimed?'Resgatada':progress>=goal?'Pronta para resgate':'Em andamento';
      return '<div class="home-mission-row"><span class="home-mission-sigil">'+(m.claimed?'✓':'✦')+'</span><div class="home-mission-copy"><b>'+esc(m.title)+'</b><small>'+esc(status)+' · '+fmt(progress)+' / '+fmt(goal)+'</small><span class="home-mission-track"><i style="width:'+pct+'%"></i></span></div><strong>+'+fmt(m.coin_reward)+' <small>Coins</small></strong></div>';
    }).join('');
  }
  async function update(){
    const c=C();if(!c||$('app')?.style.display!=='block')return;
    const run=++request;
    const name=$('homePlayerName'),level=$('homePlayerLevel'),xpText=$('homeXpText'),coinValue=$('homeCoinValue'),bar=$('homeXpBar'),avatar=$('homeAvatarRender');
    if(!name||!level)return;
    if(c.guest||!c.user||!c.supabase){
      name.textContent='Aventureiro convidado';level.textContent='Entre com sua conta para registrar sua lenda';xpText.textContent='XP: —';if(coinValue)coinValue.textContent='— Coins';if(bar)bar.style.width='0%';
      if(avatar){avatar.textContent='⚔';avatar.classList.remove('is-rendered');}
      const title=$('homePlayerTitle');if(title){title.hidden=true;title.innerHTML='';}
      renderRanking(null);renderMissions([]);
      return;
    }
    name.textContent=c.user.user_metadata?.full_name||c.user.email?.split('@')[0]||'Aventureiro';
    level.textContent='Consultando sua jornada...';
    try{
      const [p,w,ranking,missions]=await Promise.all([
        c.supabase.from('player_profiles').select('adventurer_name,total_xp,class,avatar,appearance').eq('user_id',c.user.id).maybeSingle(),
        c.supabase.from('coin_wallets').select('balance').eq('user_id',c.user.id).maybeSingle(),
        c.supabase.rpc('get_leaderboard',{p_period:'all'}),
        c.supabase.rpc('get_weekly_missions')
      ]);
      if(run!==request)return;
      if(p.error)throw p.error;
      const profile=p.data||{},xp=Number(profile.total_xp||0),coins=Number(w.data?.balance||0);
      let lv=1;while(xp>=need(lv+1)&&lv<999)lv++;
      const pct=Math.max(0,Math.min(100,Math.round((xp-need(lv))/(need(lv+1)-need(lv))*100)));
      name.textContent=profile.adventurer_name||profile.display_name||name.textContent;
      level.textContent='Nível '+lv+' · '+(classNames[profile.class]||'Aventureiro');
      xpText.textContent=fmt(xp)+' XP';
      if(coinValue)coinValue.textContent=fmt(coins)+' Coins';
      if(bar)bar.style.width=pct+'%';
      renderAvatar(profile);
      if(!ranking.error)renderRanking(ranking.data);else renderRanking(null);
      if(!missions.error)renderMissions(missions.data);else renderMissions([]);
    }catch(e){
      if(run!==request)return;
      level.textContent='Seu perfil está pronto para novas conquistas.';
      xpText.textContent='XP: consulte seu perfil';
      if(coinValue)coinValue.textContent='Coins no Mercado';
      renderRanking(null);renderMissions([]);
      console.warn('Painel da Academia:',e.message);
    }
  }
  const observer=new MutationObserver(()=>{if($('app')?.style.display==='block')update();});
  const syncPageVisibility=()=>{
    const app=$('app');
    if(app)app.classList.toggle('is-page-hidden',document.hidden);
  };
  const start=()=>{
    const app=$('app');
    if(app)observer.observe(app,{attributes:true,attributeFilter:['style']});
    syncPageVisibility();
    update();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  document.addEventListener('visibilitychange',syncPageVisibility);
  document.addEventListener('academia-avatar-changed',update);
  window.addEventListener('focus',()=>{if($('app')?.style.display==='block')update();});
})();
