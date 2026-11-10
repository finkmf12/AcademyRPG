-- Academia RPG: quizzes verificados no servidor e conquistas protegidas.
-- Aplicar depois de publicar a versão do site que usa start_quiz/answer_quiz_question/finish_quiz.

create table if not exists public.quiz_question_bank (
  id bigint generated always as identity primary key,
  category text not null check (category in ('programacao','banco','modelagem','geral')),
  prompt text not null,
  correct_answer text not null,
  options jsonb not null,
  explanation text not null,
  active boolean not null default true,
  unique(category, prompt)
);

insert into public.quiz_question_bank(category,prompt,correct_answer,options,explanation)
select x.category,x.prompt,x.correct_answer,x.options,x.explanation
from jsonb_to_recordset($questions$[{"category":"programacao","prompt":"Qual estrutura repete um bloco de código enquanto uma condição for verdadeira?","correct_answer":"while","options":["if","switch","return"],"explanation":"O while testa a condição antes de cada repetição."},{"category":"programacao","prompt":"Em Java, qual tipo de dado armazena números inteiros?","correct_answer":"int","options":["String","boolean","double"],"explanation":"int guarda números inteiros; String guarda texto, boolean guarda verdadeiro ou falso e double guarda decimais."},{"category":"programacao","prompt":"Em orientação a objetos, o que é uma classe?","correct_answer":"Um molde que define atributos e comportamentos dos objetos","options":["Um tipo de laço de repetição","Uma variável que guarda só números","Um erro de compilação"],"explanation":"A classe descreve como os objetos serão; cada objeto criado a partir dela é uma instância."},{"category":"programacao","prompt":"Qual é o resultado de 10 % 3 em Java?","correct_answer":"1","options":["3","0","3,33"],"explanation":"O operador % devolve o resto da divisão: 10 = 3 × 3 + 1."},{"category":"programacao","prompt":"Em Portugol, qual comando exibe informações na tela?","correct_answer":"escreva","options":["leia","fimse","inteiro"],"explanation":"escreva mostra dados na tela; leia captura o que o usuário digita."},{"category":"programacao","prompt":"Qual pilar da POO permite que uma classe reaproveite atributos e métodos de outra?","correct_answer":"Herança","options":["Encapsulamento","Compilação","Recursão"],"explanation":"Na herança, a subclasse recebe o que a superclasse define."},{"category":"banco","prompt":"Qual comando SQL é usado para consultar dados de uma tabela?","correct_answer":"SELECT","options":["INSERT","UPDATE","DELETE"],"explanation":"SELECT lê dados; INSERT cria registros, UPDATE altera e DELETE remove."},{"category":"banco","prompt":"Qual comando adiciona um novo registro a uma tabela?","correct_answer":"INSERT INTO","options":["SELECT FROM","ALTER TABLE","DROP TABLE"],"explanation":"INSERT INTO ... VALUES (...) grava uma nova linha na tabela."},{"category":"banco","prompt":"O que acontece ao executar UPDATE alunos SET ativo = 0; sem WHERE?","correct_answer":"Todas as linhas da tabela são alteradas","options":["Nenhuma linha é alterada","Só a primeira linha é alterada","A tabela é apagada"],"explanation":"Sem WHERE, o comando atinge todos os registros."},{"category":"banco","prompt":"Qual JOIN retorna apenas as linhas que têm correspondência nas duas tabelas?","correct_answer":"INNER JOIN","options":["LEFT JOIN","RIGHT JOIN","CROSS JOIN"],"explanation":"INNER JOIN mantém apenas as combinações com correspondência."},{"category":"banco","prompt":"Qual é a função de uma chave primária (PK)?","correct_answer":"Identificar cada registro de forma única","options":["Apagar registros duplicados automaticamente","Ordenar a tabela alfabeticamente","Criptografar os dados"],"explanation":"A PK não pode repetir nem ser nula, então identifica cada linha."},{"category":"banco","prompt":"Para que serve uma chave estrangeira (FK)?","correct_answer":"Relacionar uma tabela à chave primária de outra","options":["Armazenar senhas","Criar cópias de segurança","Substituir a chave primária"],"explanation":"A FK referencia a PK de outra tabela e garante a integridade do relacionamento."},{"category":"modelagem","prompt":"No DER, o que representa uma entidade?","correct_answer":"Algo do mundo real sobre o qual guardamos dados, como Aluno","options":["Uma linha de código","Um botão da tela","Um tipo de servidor"],"explanation":"Entidades são objetos do negócio que normalmente viram tabelas no banco."},{"category":"modelagem","prompt":"Em um diagrama de casos de uso, quem é o ator?","correct_answer":"Quem interage com o sistema, como um usuário ou outro sistema","options":["O banco de dados","A linguagem de programação","O servidor web"],"explanation":"O ator fica fora do sistema e usa suas funcionalidades."},{"category":"modelagem","prompt":"Qual diagrama UML mostra o fluxo de ações de um processo?","correct_answer":"Diagrama de atividades","options":["Diagrama de classes","Diagrama de pacotes","Diagrama de implantação"],"explanation":"O diagrama de atividades representa passos, decisões e caminhos de um processo."},{"category":"modelagem","prompt":"A frase 'O sistema deve responder em até 2 segundos' descreve um requisito…","correct_answer":"não funcional","options":["funcional","de interface apenas","de banco de dados"],"explanation":"Requisitos não funcionais descrevem qualidades, como desempenho e segurança."},{"category":"modelagem","prompt":"Um cliente faz vários pedidos, e cada pedido pertence a um só cliente. Qual é a cardinalidade?","correct_answer":"1:N (um para muitos)","options":["1:1 (um para um)","N:N (muitos para muitos)","Herança"],"explanation":"Um cliente pode se relacionar com muitos pedidos; cada pedido pertence a um cliente."},{"category":"modelagem","prompt":"Qual diagrama UML mostra classes, atributos e métodos?","correct_answer":"Diagrama de classes","options":["Diagrama de sequência","Diagrama de casos de uso","Diagrama de atividades"],"explanation":"O diagrama de classes descreve a estrutura estática do sistema."},{"category":"geral","prompt":"Qual componente funciona como a memória temporária de trabalho do computador?","correct_answer":"Memória RAM","options":["HD","Fonte de alimentação","Placa de vídeo"],"explanation":"A RAM guarda dados e programas em uso e é esvaziada quando o computador desliga."},{"category":"geral","prompt":"Qual protocolo transfere páginas da web de forma criptografada?","correct_answer":"HTTPS","options":["FTP","SMTP","DHCP"],"explanation":"HTTPS é HTTP com TLS, que protege os dados em trânsito."},{"category":"geral","prompt":"Qual é a principal função de um sistema operacional?","correct_answer":"Gerenciar o hardware e os recursos para os programas","options":["Apenas proteger contra vírus","Criar sites","Fabricar peças do computador"],"explanation":"Ele controla processador, memória, arquivos e dispositivos."},{"category":"geral","prompt":"O que um endereço IP identifica?","correct_answer":"Um dispositivo em uma rede","options":["O fabricante do computador","A velocidade da internet","O tamanho do disco"],"explanation":"O IP funciona como endereço do dispositivo na rede."},{"category":"geral","prompt":"Quantos bits formam 1 byte?","correct_answer":"8","options":["4","16","10"],"explanation":"Um byte é formado por 8 bits."},{"category":"geral","prompt":"Qual dispositivo conecta redes diferentes e encaminha pacotes entre elas?","correct_answer":"Roteador","options":["Teclado","Placa-mãe","Monitor"],"explanation":"O roteador encaminha pacotes entre redes diferentes."}]$questions$::jsonb)
as x(category text,prompt text,correct_answer text,options jsonb,explanation text)
on conflict(category,prompt) do update set
  correct_answer=excluded.correct_answer, options=excluded.options,
  explanation=excluded.explanation, active=true;

create table if not exists public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  category text not null check (category in ('programacao','banco','modelagem','geral','simulado')),
  question_ids bigint[] not null,
  current_index integer not null default 1,
  correct integer not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  status text not null default 'active' check (status in ('active','completed','abandoned')),
  awarded_xp integer not null default 0,
  streak_xp integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists quiz_sessions_user_started_idx on public.quiz_sessions(user_id,started_at desc);
alter table public.quiz_question_bank enable row level security;
alter table public.quiz_sessions enable row level security;
revoke all on public.quiz_question_bank from anon, authenticated;
revoke all on public.quiz_sessions from anon, authenticated;

create or replace function public._grant(p_uid uuid,p_source text,p_key text,p_extra text default null)
returns integer language plpgsql security definer set search_path=public as $$
declare v_xp integer; v_label text; v_today integer;
begin
  if p_uid is null then return 0; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_uid::text,0));
  select xp,label into v_xp,v_label from public.xp_rules where source=p_source;
  if v_xp is null then return 0; end if;
  insert into public.player_profiles(user_id) values(p_uid) on conflict do nothing;
  select coalesce(sum(xp),0) into v_today from public.xp_events
   where user_id=p_uid and created_at >= (date_trunc('day',now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo');
  if v_today+v_xp>1000 then return 0; end if;
  insert into public.xp_events(user_id,source,event_key,xp,description)
  values(p_uid,p_source,p_key,v_xp,v_label||coalesce(' · '||p_extra,''))
  on conflict(user_id,event_key) do nothing;
  if not found then return 0; end if;
  update public.player_profiles set total_xp=total_xp+v_xp where user_id=p_uid;
  return v_xp;
end $$;

create or replace function public._grant_eligible_achievements(p_uid uuid)
returns text[] language plpgsql security definer set search_path=public as $$
declare v_new text[] := array[]::text[]; v_count integer; v_xp integer;
begin
  select count(*) into v_count from public.quiz_attempts where user_id=p_uid;
  if v_count>=1 then
    insert into public.user_achievements(user_id,achievement_id) values(p_uid,'primeiro') on conflict do nothing;
    if found then v_new:=array_append(v_new,'primeiro'); end if;
  end if;
  if exists(select 1 from public.quiz_attempts where user_id=p_uid and best_streak>=5) then
    insert into public.user_achievements(user_id,achievement_id) values(p_uid,'sequencia') on conflict do nothing;
    if found then v_new:=array_append(v_new,'sequencia'); end if;
  end if;
  if exists(select 1 from public.quiz_attempts where user_id=p_uid and correct=total) then
    insert into public.user_achievements(user_id,achievement_id) values(p_uid,'gabarito') on conflict do nothing;
    if found then v_new:=array_append(v_new,'gabarito'); end if;
  end if;
  if (select count(distinct category) from public.quiz_attempts where user_id=p_uid and category in ('programacao','banco','modelagem','geral'))=4 then
    insert into public.user_achievements(user_id,achievement_id) values(p_uid,'explorador') on conflict do nothing;
    if found then v_new:=array_append(v_new,'explorador'); end if;
  end if;
  if exists(select 1 from public.quiz_attempts where user_id=p_uid and category='simulado') then
    insert into public.user_achievements(user_id,achievement_id) values(p_uid,'simulado') on conflict do nothing;
    if found then v_new:=array_append(v_new,'simulado'); end if;
  end if;
  select total_xp into v_xp from public.player_profiles where user_id=p_uid;
  if coalesce(v_xp,0)>=1000 then
    insert into public.user_achievements(user_id,achievement_id) values(p_uid,'nivel5') on conflict do nothing;
    if found then v_new:=array_append(v_new,'nivel5'); end if;
  end if;
  if coalesce(v_xp,0)>=500 then
    insert into public.user_achievements(user_id,achievement_id) values(p_uid,'colecionador') on conflict do nothing;
    if found then v_new:=array_append(v_new,'colecionador'); end if;
  end if;
  select count(distinct (created_at at time zone 'America/Sao_Paulo')::date) into v_count
  from public.xp_events where user_id=p_uid and source='daily';
  if v_count>=3 then
    insert into public.user_achievements(user_id,achievement_id) values(p_uid,'dedicado') on conflict do nothing;
    if found then v_new:=array_append(v_new,'dedicado'); end if;
  end if;
  return v_new;
end $$;

create or replace function public.start_quiz(p_category text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid(); v_n integer; v_ids bigint[]; v_session uuid; v_questions jsonb:='[]'::jsonb;
  v_q record; v_options jsonb; v_id bigint;
begin
  if p_category not in ('programacao','banco','modelagem','geral','simulado') then raise exception 'Categoria inválida'; end if;
  if v_uid is not null and (
    select count(*) from public.quiz_sessions where user_id=v_uid and started_at>now()-interval '24 hours'
  )>=12 then raise exception 'Limite de 12 quizzes iniciados nas últimas 24 horas. Tente novamente amanhã.'; end if;
  v_n:=case when p_category='simulado' then 10 else 6 end;
  if p_category='simulado' then
    select array_agg(id) into v_ids from (select id from public.quiz_question_bank where active order by random() limit v_n) q;
  else
    select array_agg(id) into v_ids from (select id from public.quiz_question_bank where active and category=p_category order by random() limit v_n) q;
  end if;
  if coalesce(cardinality(v_ids),0)<>v_n then raise exception 'Banco de questões incompleto para esta categoria.'; end if;
  insert into public.quiz_sessions(user_id,category,question_ids) values(v_uid,p_category,v_ids) returning id into v_session;
  foreach v_id in array v_ids loop
    select * into v_q from public.quiz_question_bank where id=v_id;
    select jsonb_agg(value order by random()) into v_options
    from jsonb_array_elements_text(v_q.options||jsonb_build_array(v_q.correct_answer)) as e(value);
    v_questions:=v_questions||jsonb_build_array(jsonb_build_object('id',v_q.id,'prompt',v_q.prompt,'options',v_options));
  end loop;
  return jsonb_build_object('session_id',v_session,'questions',v_questions);
end $$;

create or replace function public.answer_quiz_question(p_session uuid,p_question_id bigint,p_answer text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_s public.quiz_sessions%rowtype; v_q public.quiz_question_bank%rowtype; v_ok boolean;
  v_streak integer; v_correct integer; v_best integer;
begin
  select * into v_s from public.quiz_sessions where id=p_session for update;
  if not found or (v_s.user_id is not null and v_s.user_id is distinct from auth.uid()) then raise exception 'Sessão inválida'; end if;
  if v_s.status<>'active' or v_s.current_index>cardinality(v_s.question_ids) then raise exception 'Questão já respondida ou sessão encerrada'; end if;
  if v_s.question_ids[v_s.current_index]<>p_question_id then raise exception 'Ordem de questão inválida'; end if;
  select * into v_q from public.quiz_question_bank where id=p_question_id and active;
  if not found then raise exception 'Questão indisponível'; end if;
  if p_answer is null or (not exists(select 1 from jsonb_array_elements_text(v_q.options) x(value) where value=p_answer)
     and p_answer<>v_q.correct_answer) then raise exception 'Alternativa inválida'; end if;
  v_ok:=p_answer=v_q.correct_answer;
  v_correct:=v_s.correct+case when v_ok then 1 else 0 end;
  v_streak:=case when v_ok then v_s.current_streak+1 else 0 end;
  v_best:=greatest(v_s.best_streak,v_streak);
  update public.quiz_sessions set correct=v_correct,current_streak=v_streak,best_streak=v_best,current_index=current_index+1
   where id=p_session;
  return jsonb_build_object('is_correct',v_ok,'explanation',v_q.explanation,'correct_count',v_correct,
    'current_streak',v_streak,'best_streak',v_best,'finished',v_s.current_index=cardinality(v_s.question_ids));
end $$;

create or replace function public.finish_quiz(p_session uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_s public.quiz_sessions%rowtype; v_xp integer:=0; v_streak_xp integer:=0;
  v_ach text[]:=array[]::text[]; v_key text; v_total integer;
begin
  select * into v_s from public.quiz_sessions where id=p_session for update;
  if not found or (v_s.user_id is not null and v_s.user_id is distinct from auth.uid()) then raise exception 'Sessão inválida'; end if;
  if v_s.status='completed' then
    return jsonb_build_object('xp',v_s.awarded_xp,'streak_xp',v_s.streak_xp,'correct',v_s.correct,
      'total',cardinality(v_s.question_ids),'best_streak',v_s.best_streak,'achievements',v_ach,'duplicate',true);
  end if;
  if v_s.status<>'active' or v_s.current_index<=cardinality(v_s.question_ids) then raise exception 'Responda todas as questões antes de finalizar'; end if;
  update public.quiz_sessions set status='completed',finished_at=now() where id=p_session;
  v_total:=cardinality(v_s.question_ids);
  if v_s.user_id is not null then
    insert into public.quiz_attempts(id,user_id,category,correct,total,best_streak)
    values(v_s.id,v_s.user_id,v_s.category,v_s.correct,v_total,v_s.best_streak);
    v_key:=case when v_s.category='simulado' then 'simulado:' else 'quiz:'||v_s.category||':' end
      ||to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM-DD');
    v_xp:=public._grant(v_s.user_id,case when v_s.category='simulado' then 'simulado' else 'quiz' end,v_key,v_s.category);
    if v_s.best_streak>=5 then
      v_streak_xp:=public._grant(v_s.user_id,'streak5','streak5:'||to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM-DD'));
    end if;
    v_ach:=public._grant_eligible_achievements(v_s.user_id);
  end if;
  update public.quiz_sessions set awarded_xp=v_xp,streak_xp=v_streak_xp where id=p_session;
  return jsonb_build_object('xp',v_xp,'streak_xp',v_streak_xp,'correct',v_s.correct,'total',v_total,
    'best_streak',v_s.best_streak,'achievements',v_ach,'duplicate',false);
end $$;

-- As funções abaixo só podem ser chamadas pelo site; tabelas e respostas ficam no servidor.
revoke all on function public._grant(uuid,text,text,text) from public,anon,authenticated;
revoke all on function public._grant_eligible_achievements(uuid) from public,anon,authenticated;
revoke all on function public.start_quiz(text) from public;
revoke all on function public.answer_quiz_question(uuid,bigint,text) from public;
revoke all on function public.finish_quiz(uuid) from public;
grant execute on function public.start_quiz(text) to anon,authenticated;
grant execute on function public.answer_quiz_question(uuid,bigint,text) to anon,authenticated;
grant execute on function public.finish_quiz(uuid) to anon,authenticated;

-- Desativa as antigas rotas que aceitavam pontuação e conquistas informadas pelo navegador.
revoke all on function public.record_quiz(uuid,text,integer,integer,integer) from public,anon,authenticated;
revoke all on function public.award_mission(text) from public,anon,authenticated;
revoke all on function public.unlock_achievement(text) from public,anon,authenticated;
