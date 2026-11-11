-- Academia RPG · Recompensas de conquistas por raridade
-- Comum 15 | Incomum 30 | Raro 60 | Épico 100 | Lendário 200 Coins
-- Conquistas já liberadas recebem, uma única vez, apenas a diferença positiva.

create or replace function public._market_achievement_reward()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_amount integer;
begin
  v_amount := case new.achievement_id
    when 'primeiro' then 15
    when 'quiz-10' then 15
    when 'sequencia' then 15
    when 'simulado' then 15
    when 'colecionador' then 15
    when 'dedicado' then 15
    when 'historia-primeira' then 15
    when 'colecao-inicial' then 15
    when 'nivel5' then 30
    when 'chefe-primeiro' then 30
    when 'guilda' then 30
    when 'quiz-50' then 60
    when 'gabarito' then 60
    when 'explorador' then 60
    when 'xp2500' then 60
    when 'dedicado-7' then 60
    when 'historia-5' then 60
    when 'moedas-5000' then 60
    when 'quiz-100' then 100
    when 'streak-10' then 100
    when 'precision-90' then 100
    when 'nivel10' then 100
    when 'chefe-trinca' then 100
    when 'colecao-10' then 100
    when 'simulado-5' then 200
    when 'xp10000' then 200
    when 'nivel20' then 200
    when 'dedicado-30' then 200
    when 'historia-completa' then 200
    when 'chefe-10' then 200
    when 'item-lendario' then 200
    -- Itens especiais fora do Livro mantêm a recompensa anterior.
    else 40
  end;

  perform public._market_grant_coins(
    new.user_id,
    v_amount,
    'achievement:' || new.achievement_id,
    'Conquista desbloqueada: ' || new.achievement_id || ' · +' || v_amount || ' Coins'
  );
  return new;
end
$function$;

-- Ajuste retroativo idempotente: completa a diferença dos prêmios antigos
-- sem retirar moedas de quem já recebeu 40 por conquistas comuns/incomuns.
do $migration$
declare
  r record;
  v_paid integer;
  v_bonus integer;
begin
  for r in
    select ua.user_id, ua.achievement_id,
      case ua.achievement_id
        when 'primeiro' then 15
        when 'quiz-10' then 15
        when 'sequencia' then 15
        when 'simulado' then 15
        when 'colecionador' then 15
        when 'dedicado' then 15
        when 'historia-primeira' then 15
        when 'colecao-inicial' then 15
        when 'nivel5' then 30
        when 'chefe-primeiro' then 30
        when 'guilda' then 30
        when 'quiz-50' then 60
        when 'gabarito' then 60
        when 'explorador' then 60
        when 'xp2500' then 60
        when 'dedicado-7' then 60
        when 'historia-5' then 60
        when 'moedas-5000' then 60
        when 'quiz-100' then 100
        when 'streak-10' then 100
        when 'precision-90' then 100
        when 'nivel10' then 100
        when 'chefe-trinca' then 100
        when 'colecao-10' then 100
        when 'simulado-5' then 200
        when 'xp10000' then 200
        when 'nivel20' then 200
        when 'dedicado-30' then 200
        when 'historia-completa' then 200
        when 'chefe-10' then 200
        when 'item-lendario' then 200
        else 40
      end as target_reward
    from public.user_achievements ua
  loop
    select coalesce(sum(ct.amount), 0)::integer
      into v_paid
    from public.coin_transactions ct
    where ct.user_id = r.user_id
      and ct.event_key in (
        'achievement:' || r.achievement_id,
        'achievement-rarity-adjustment-v1:' || r.achievement_id
      );

    v_bonus := greatest(0, r.target_reward - v_paid);
    if v_bonus > 0 then
      perform public._market_grant_coins(
        r.user_id,
        v_bonus,
        'achievement-rarity-adjustment-v1:' || r.achievement_id,
        'Ajuste de raridade: ' || r.achievement_id || ' · +' || v_bonus || ' Coins'
      );
    end if;
  end loop;
end
$migration$;
