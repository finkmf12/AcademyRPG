// Academia RPG · painel dinâmico da página inicial
(() => {
  'use strict';
  const $=id=>document.getElementById(id), C=()=>window.AcademiaCtx;
  const need=l=>50*l*(l-1);
  async function update(){
    const c=C(); if(!c||$('app')?.style.display!=='block')return;
    const name=$('homePlayerName'),level=$('homePlayerLevel'),xpText=$('homeXpText'),coinText=$('homeCoinText'),bar=$('homeXpBar'),avatar=$('homePlayerCard')?.querySelector('.home-player-avatar');
    if(!name||!level)return;
    if(c.guest){name.textContent='Aventureiro convidado';level.textContent='Modo convidado · entre com Google para salvar sua evolução';xpText.textContent='XP: —';coinText.textContent='◉ Coins: —';bar.style.width='0%';avatar.textContent='🧙';return;}
    if(!c.user||!c.supabase)return;
    name.textContent=c.user.user_metadata?.full_name||c.user.email?.split('@')[0]||'Aventureiro';
    level.textContent='Consultando sua jornada...';
    try{
      const [p,w]=await Promise.all([
        c.supabase.from('player_profiles').select('adventurer_name,total_xp,class,avatar').maybeSingle(),
        c.supabase.from('coin_wallets').select('balance').maybeSingle()
      ]);
      if(p.error)throw p.error;
      const profile=p.data||{},xp=Number(profile.total_xp||0),coins=Number(w.data?.balance||0);
      let lv=1;while(xp>=need(lv+1))lv++;
      const pct=Math.max(0,Math.min(100,Math.round((xp-need(lv))/(need(lv+1)-need(lv))*100)));
      name.textContent=profile.adventurer_name||name.textContent;
      level.textContent='Nível '+lv+' · '+(profile.class?({guerreiro:'Guerreiro',mago:'Mago',arqueiro:'Arqueiro',assassino:'Assassino'}[profile.class]||'Aventureiro'):'Aventureiro');
      xpText.textContent=xp.toLocaleString('pt-BR')+' XP';
      coinText.textContent='◉ '+coins.toLocaleString('pt-BR')+' Coins';
      bar.style.width=pct+'%';
      if(avatar)avatar.textContent=profile.avatar||'⚔️';
    }catch(e){level.textContent='Seu perfil está pronto para novas conquistas.';xpText.textContent='XP: consulte seu perfil';coinText.textContent='◉ Coins no Mercado';}
  }
  const observer=new MutationObserver(()=>{if($('app')?.style.display==='block')update();});
  const start=()=>{const app=$('app');if(app)observer.observe(app,{attributes:true,attributeFilter:['style']});update();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  document.addEventListener('academia-avatar-changed',update);
})();
