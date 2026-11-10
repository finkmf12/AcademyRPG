// Academia RPG · XP, níveis, conquistas e Sala de Treinamento.
// Arquivo novo: usa o Supabase e o login já existentes via window.AcademiaCtx. Todo XP é gravado por funções do banco (supabase-xp.sql).
const $ = id => document.getElementById(id), C = () => window.AcademiaCtx;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sh = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
const need = L => 50 * L * (L - 1);                       // XP acumulado para chegar ao nível L (nível 2 = 100, 3 = 300, 4 = 600...)
const levelOf = xp => { let L = 1; while (xp >= need(L + 1)) L++; return L; };
const AVATARS = ['🧙', '⚔️', '🏹', '🛡️', '🐉', '🦉', '🧝', '🧪'];
const CLASSES = {
  guerreiro: { name: 'Guerreiro', icon: '⚔️', desc: 'Resistente e persistente.' },
  mago: { name: 'Mago', icon: '🔮', desc: 'Curioso e estudioso.' },
  arqueiro: { name: 'Arqueiro', icon: '🏹', desc: 'Preciso e focado.' },
  assassino: { name: 'Assassino', icon: '🗡️', desc: 'Rápido e estratégico.' }
};
const ALL = ['programacao', 'banco', 'modelagem', 'geral'], SIM_N = 10;
const CATS = {
  programacao: { name: 'Programação', icon: '⌘', desc: 'Lógica, Java, Portugol, variáveis, loops e orientação a objetos.' },
  banco: { name: 'Banco de Dados', icon: '▤', desc: 'SQL, SELECT, INSERT, UPDATE, DELETE, JOIN, PK e FK.' },
  modelagem: { name: 'Modelagem', icon: '◇', desc: 'DER, UML, casos de uso, atividades e requisitos.' },
  geral: { name: 'Conhecimentos gerais', icon: '✦', desc: 'Hardware, redes, sistemas operacionais e tecnologia.' },
  simulado: { name: 'Simulado', icon: '🏆', desc: `${SIM_N} questões sorteadas de todas as categorias.` }
};
// Para adicionar questões: [enunciado, alternativa CORRETA, errada, errada, errada, explicação]. As alternativas são embaralhadas (A–D) a cada quiz.
const Q = {
  programacao: [
    ['Qual estrutura repete um bloco de código enquanto uma condição for verdadeira?', 'while', 'if', 'switch', 'return', 'O while testa a condição antes de cada repetição. O if decide uma única vez e o switch escolhe entre vários casos.'],
    ['Em Java, qual tipo de dado armazena números inteiros?', 'int', 'String', 'boolean', 'double', 'int guarda inteiros. String guarda texto, boolean guarda verdadeiro/falso e double guarda números decimais.'],
    ['Em orientação a objetos, o que é uma classe?', 'Um molde que define atributos e comportamentos dos objetos', 'Um tipo de laço de repetição', 'Uma variável que guarda só números', 'Um erro de compilação', 'A classe descreve como os objetos serão; cada objeto criado a partir dela é uma instância.'],
    ['Qual é o resultado de 10 % 3 em Java?', '1', '3', '0', '3,33', 'O operador % devolve o resto da divisão: 10 = 3 × 3 + 1.'],
    ['Em Portugol, qual comando exibe informações na tela?', 'escreva', 'leia', 'fimse', 'inteiro', 'escreva mostra dados na tela; leia captura o que o usuário digita.'],
    ['Qual pilar da POO permite que uma classe reaproveite atributos e métodos de outra?', 'Herança', 'Encapsulamento', 'Compilação', 'Recursão', 'Na herança, a subclasse recebe o que a superclasse define e pode acrescentar ou alterar comportamentos.']
  ],
  banco: [
    ['Qual comando SQL é usado para consultar dados de uma tabela?', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'SELECT lê dados. INSERT cria registros, UPDATE altera e DELETE remove.'],
    ['Qual comando adiciona um novo registro a uma tabela?', 'INSERT INTO', 'SELECT FROM', 'ALTER TABLE', 'DROP TABLE', 'INSERT INTO ... VALUES (...) grava uma nova linha na tabela.'],
    ['O que acontece ao executar UPDATE alunos SET ativo = 0; sem WHERE?', 'Todas as linhas da tabela são alteradas', 'Nenhuma linha é alterada', 'Só a primeira linha é alterada', 'A tabela é apagada', 'Sem WHERE o comando atinge todos os registros. O mesmo cuidado vale para o DELETE.'],
    ['Qual JOIN retorna apenas as linhas que têm correspondência nas duas tabelas?', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CROSS JOIN', 'O INNER JOIN mantém só as combinações com correspondência; LEFT e RIGHT também trazem linhas sem par.'],
    ['Qual é a função de uma chave primária (PK)?', 'Identificar cada registro de forma única', 'Apagar registros duplicados automaticamente', 'Ordenar a tabela alfabeticamente', 'Criptografar os dados', 'A PK não pode repetir nem ser nula, então identifica cada linha com exclusividade.'],
    ['Para que serve uma chave estrangeira (FK)?', 'Relacionar uma tabela à chave primária de outra', 'Armazenar senhas', 'Criar cópias de segurança', 'Substituir a chave primária', 'A FK referencia a PK de outra tabela e garante a integridade do relacionamento.']
  ],
  modelagem: [
    ['No DER, o que representa uma entidade?', 'Algo do mundo real sobre o qual guardamos dados, como Aluno', 'Uma linha de código', 'Um botão da tela', 'Um tipo de servidor', 'Entidades são os "objetos" do negócio (Aluno, Pedido, Produto) que normalmente viram tabelas no banco.'],
    ['Em um diagrama de casos de uso, quem é o ator?', 'Quem interage com o sistema, como um usuário ou outro sistema', 'O banco de dados', 'A linguagem de programação', 'O servidor web', 'O ator fica fora do sistema e usa suas funcionalidades.'],
    ['Qual diagrama UML mostra o fluxo de ações de um processo?', 'Diagrama de atividades', 'Diagrama de classes', 'Diagrama de pacotes', 'Diagrama de implantação', 'O diagrama de atividades representa passos, decisões e caminhos de um processo.'],
    ['"O sistema deve responder em até 2 segundos" é um requisito…', 'não funcional', 'funcional', 'de interface apenas', 'de banco de dados', 'Requisitos não funcionais descrevem qualidades (desempenho, segurança). Os funcionais descrevem o que o sistema faz.'],
    ['"Um cliente faz vários pedidos, e cada pedido pertence a um só cliente" é uma cardinalidade…', '1:N (um para muitos)', '1:1 (um para um)', 'N:N (muitos para muitos)', 'de herança', 'Um lado se relaciona com muitos itens do outro; o outro lado, com apenas um.'],
    ['Qual diagrama UML mostra classes, atributos e métodos?', 'Diagrama de classes', 'Diagrama de sequência', 'Diagrama de casos de uso', 'Diagrama de atividades', 'O diagrama de classes descreve a estrutura estática do sistema e as relações entre as classes.']
  ],
  geral: [
    ['Qual componente funciona como a memória temporária de trabalho do computador?', 'Memória RAM', 'HD', 'Fonte de alimentação', 'Placa de vídeo', 'A RAM guarda dados e programas em uso e é esvaziada quando o computador desliga.'],
    ['Qual protocolo transfere páginas da web de forma criptografada?', 'HTTPS', 'FTP', 'SMTP', 'DHCP', 'O HTTPS é o HTTP com uma camada de segurança (TLS) que protege os dados em trânsito.'],
    ['Qual é a principal função de um sistema operacional?', 'Gerenciar o hardware e os recursos para os programas', 'Apenas proteger contra vírus', 'Criar sites', 'Fabricar peças do computador', 'Ele controla processador, memória, arquivos e dispositivos, servindo de base para os aplicativos.'],
    ['O que um endereço IP identifica?', 'Um dispositivo em uma rede', 'O fabricante do computador', 'A velocidade da internet', 'O tamanho do disco', 'Funciona como o "endereço" do dispositivo, permitindo que os dados cheguem ao destino certo.'],
    ['Quantos bits formam 1 byte?', '8', '4', '16', '10', '1 byte = 8 bits, a unidade básica para medir capacidade de armazenamento.'],
    ['Qual dispositivo conecta redes diferentes e encaminha pacotes entre elas?', 'Roteador', 'Teclado', 'Placa-mãe', 'Monitor', 'O roteador escolhe o melhor caminho para os pacotes, ligando, por exemplo, sua rede local à internet.']
  ]
};
// Conquistas: [ícone, nome, descrição, condição]. Os ids precisam existir na tabela public.achievements (supabase-xp.sql).
const ACH = {
  primeiro: ['🎯', 'Primeiro passo', 'Complete seu primeiro quiz', s => s.attempts.length >= 1],
  sequencia: ['🔥', 'Sequência de fogo', 'Acerte 5 questões seguidas', s => s.attempts.some(a => a.best_streak >= 5)],
  gabarito: ['💎', 'Gabarito', 'Acerte 100% de um quiz', s => s.attempts.some(a => a.correct === a.total)],
  explorador: ['🧭', 'Explorador', 'Complete um quiz de cada categoria', s => ALL.every(c => s.attempts.some(a => a.category === c))],
  simulado: ['🏆', 'Veterano', 'Complete um simulado', s => s.attempts.some(a => a.category === 'simulado')],
  nivel5: ['⭐', 'Nível 5', 'Alcance o nível 5', s => levelOf(s.xp) >= 5],
  dedicado: ['📅', 'Dedicado', 'Acesse em 3 dias diferentes', s => s.days >= 3],
  colecionador: ['💰', 'Colecionador', 'Acumule 500 XP', s => s.xp >= 500]
};
const HEAD = {
  sala: ['TREINAMENTO', 'Sala de Treinamento', 'Teste seus conhecimentos, ganhe XP e evolua de nível.'],
  perfil: ['JOGADOR', 'Perfil do Jogador', 'Acompanhe seu nível, suas conquistas e o histórico de XP.']
};
let S = null, quiz = null, resultHtml = null, view = 'sala', tab = 'conquistas', err = null, lastKey = null, isOpen = false, editing = false, pickClass = null;

const info = () => { const xp = S.p.total_xp, L = levelOf(xp), a = need(L), b = need(L + 1); return { xp, L, a, b, pct: Math.round((xp - a) / (b - a) * 100) }; };
const box = t => `<div class="panel"><div class="empty">${t}</div></div>`;

function mini() {
  const el = $('xpMini'); if (!S) { el.innerHTML = ''; return; }
  const i = info();
  el.innerHTML = `<div class="xm-top"><span class="xm-av">${esc(S.p.avatar)}</span><div><b>${esc(S.p.adventurer_name || 'Aventureiro')}</b>Nível ${i.L}${CLASSES[S.p.class] ? ' · ' + CLASSES[S.p.class].name : ''}</div></div><div class="bar"><i style="width:${i.pct}%"></i></div>${i.xp} XP · faltam ${i.b - i.xp} para o nível ${i.L + 1}`;
}

async function fetchAll() {
  const sb = C().supabase;
  const r = await Promise.all([
    sb.from('player_profiles').select('*').maybeSingle(),
    sb.from('xp_events').select('*').order('created_at', { ascending: false }).limit(50),
    sb.from('quiz_attempts').select('*').order('created_at', { ascending: false }).limit(200),
    sb.from('user_achievements').select('achievement_id'),
    sb.from('xp_events').select('id', { count: 'exact', head: true }).eq('source', 'daily')
  ]);
  const bad = r.find(x => x.error); if (bad) throw bad.error;
  if (!r[0].data) throw new Error('Perfil não encontrado.');
  S = { p: r[0].data, events: r[1].data, attempts: r[2].data, unlocked: new Set(r[3].data.map(x => x.achievement_id)), days: r[4].count || 0 };
}

async function checkAch() { return []; }

async function init() {
  const c = C(); S = null; err = null; mini();
  if (c.guest) { if (isOpen) render(); return; }
  try {
    const sb = c.supabase, u = c.user;
    let r = await sb.rpc('ensure_profile', { p_name: u.user_metadata?.full_name || u.email }); if (r.error) throw r.error;
    r = await sb.rpc('claim_daily'); if (r.error) throw r.error;
    await fetchAll();
    const n = await checkAch(), msgs = [];
    if (r.data > 0) msgs.push(`+${r.data} XP · primeiro acesso do dia!`);
    n.forEach(id => msgs.push(`🏅 Conquista: ${ACH[id][1]}`));
    if (msgs.length) c.toast(msgs.join('  ·  '));
  } catch (e) { err = e.message || String(e); S = null; }
  mini(); if (isOpen) render();
}

function openRpg(v) {
  view = v; isOpen = true;
  $('home').style.display = 'none'; $('library').style.display = 'none'; $('rpgView').style.display = 'block';
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.rpgnav button').forEach(b => b.classList.toggle('active', b.dataset.rpg === v));
  $('pageKicker').textContent = HEAD[v][0]; $('pageTitle').textContent = HEAD[v][1]; $('pageSub').textContent = HEAD[v][2];
  render();
}
function closeRpg() {
  isOpen = false; $('rpgView').style.display = 'none';
  document.querySelectorAll('.rpgnav button').forEach(b => b.classList.remove('active'));
}

function render() {
  if (view === 'perfil') renderPerfil();
  else if (quiz) renderQuiz();
  else if (resultHtml) $('rpgView').innerHTML = resultHtml;
  else renderSala();
}

function renderSala() {
  const g = C().guest, on = !!S, i = on ? info() : null;
  const note = g ? '<div class="rpg-note">Modo convidado: você pode treinar, mas o XP só é ganho e salvo quando você entra com a conta Google.</div>'
    : err ? `<div class="rpg-note">O XP está indisponível: execute o arquivo supabase-xp.sql no Supabase. Você ainda pode treinar.<br><small>${esc(err)}</small></div>` : '';
  const st = [['Nível', on ? i.L : '—'], ['XP total', on ? i.xp : '—'], ['Quizzes feitos', on ? S.attempts.length : '—']]
    .map(([k, v]) => `<div class="stat"><small>${k}</small><strong>${v}</strong></div>`).join('');
  const cards = [...ALL, 'simulado'].map(k => `<article class="subject-card rpg-card"><div class="subject-icon">${CATS[k].icon}</div><h4>${CATS[k].name}</h4><p>${CATS[k].desc}</p><span class="xp-chip">+${k === 'simulado' ? 150 : 50} XP</span><button data-act="start" data-cat="${k}">INICIAR →</button></article>`).join('');
  $('rpgView').innerHTML = `${note}<div class="stats">${st}</div><div class="section-head"><h3>Escolha uma categoria</h3></div><div class="cards">${cards}</div>`;
}

async function start(cat) {
  resultHtml = null; quiz = null;
  $('rpgView').innerHTML = '<div class="panel"><div class="empty"><b>Preparando seu desafio...</b></div></div>';
  try {
    const { data, error } = await C().supabase.rpc('start_quiz', { p_category: cat });
    if (error) throw error;
    quiz = {
      cat, id: data.session_id, i: 0, correct: 0, streak: 0, best: 0, ans: false,
      qs: data.questions.map(q => ({ id: q.id, t: q.prompt, o: q.options.map(t => ({ t, ok: false })) })),
      results: []
    };
    render();
  } catch (e) {
    $('rpgView').innerHTML = box('Não foi possível iniciar o quiz: ' + esc(e.message || e));
  }
}

function renderQuiz() {
  const q = quiz.qs[quiz.i], n = quiz.qs.length;
  $('rpgView').innerHTML = `<div class="panel"><div class="qz-top"><span>${CATS[quiz.cat].name} · Questão ${quiz.i + 1} de ${n}</span><span id="qzStreak">🔥 ${quiz.streak} seguidas</span><button class="qz-exit" data-act="exit">Sair do quiz</button></div>
  <div class="bar"><i style="width:${quiz.i / n * 100}%"></i></div><h3 class="qz-q">${esc(q.t)}</h3>
  <div class="qz-opts">${q.o.map((o, i) => `<button class="qz-opt" data-act="ans" data-i="${i}"><b>${'ABCD'[i]}</b>${esc(o.t)}</button>`).join('')}</div><div id="qzFb"></div></div>`;
}

async function answer(i) {
  if (!quiz || quiz.ans) return;
  const q = quiz.qs[quiz.i], selected = q.o[i];
  if (!selected) return;
  quiz.ans = true;
  document.querySelectorAll('.qz-opt').forEach(b => b.disabled = true);
  $('qzFb').innerHTML = '<div class="qz-exp">Verificando sua resposta...</div>';
  try {
    const { data, error } = await C().supabase.rpc('answer_quiz_question', {
      p_session: quiz.id, p_question_id: q.id, p_answer: selected.t
    });
    if (error) throw error;
    quiz.correct = data.correct_count;
    quiz.streak = data.current_streak;
    quiz.best = data.best_streak;
    quiz.results.push(data.is_correct);
    document.querySelectorAll('.qz-opt').forEach((b, j) => {
      b.classList.toggle('ok', data.is_correct && j === i);
      b.classList.toggle('bad', !data.is_correct && j === i);
    });
    $('qzStreak').textContent = `🔥 ${quiz.streak} seguidas`;
    $('qzFb').innerHTML = `<div class="qz-exp ${data.is_correct ? 'ok' : 'bad'}"><b>${data.is_correct ? '✔ Resposta correta!' : '✘ Resposta incorreta.'}</b> ${esc(data.explanation)}</div><button class="primary" data-act="next">${quiz.i === quiz.qs.length - 1 ? 'Ver resultado' : 'Próxima questão'}</button>`;
  } catch (e) {
    quiz.ans = false;
    document.querySelectorAll('.qz-opt').forEach(b => b.disabled = false);
    $('qzFb').innerHTML = `<div class="rpg-note">Não foi possível validar a resposta: ${esc(e.message || e)}. Tente novamente.</div>`;
  }
}

function next() {
  if (!quiz || !quiz.ans) return;
  if (quiz.i < quiz.qs.length - 1) { quiz.i++; quiz.ans = false; renderQuiz(); } else finish();
}

async async function finish() {
  const z = quiz;
  $('rpgView').innerHTML = '<div class="panel"><div class="empty"><b>Validando resultado e calculando XP...</b></div></div>';
  let xpHtml = '';
  try {
    const before = S ? levelOf(S.p.total_xp) : 1;
    const { data, error } = await C().supabase.rpc('finish_quiz', { p_session: z.id });
    if (error) throw error;
    if (!C().guest) {
      await fetchAll();
      const after = levelOf(S.p.total_xp);
      mini();
      const total = (data.xp || 0) + (data.streak_xp || 0);
      xpHtml = total > 0
        ? `<div class="res-xp">+${total} XP</div><p class="sub">${z.cat === 'simulado' ? 'Simulado' : 'Quiz'} +${data.xp || 0}${data.streak_xp ? ` · Sequência de 5 acertos +${data.streak_xp}` : ''}</p>`
        : '<div class="rpg-note">Resultado validado. Nenhum XP novo desta vez: você já recebeu a recompensa desta categoria hoje ou atingiu o limite diário.</div>';
      if (after > before) xpHtml += `<p><b>Você subiu para o nível ${after}!</b></p>`;
      (data.achievements || []).forEach(id => { if (ACH[id]) xpHtml += `<p>🏅 Nova conquista: <b>${ACH[id][1]}</b></p>`; });
    } else {
      xpHtml = '<div class="rpg-note">Resultado validado. Entre com Google para salvar XP e conquistas no seu perfil.</div>';
    }
  } catch (e) {
    xpHtml = `<div class="rpg-note">Não foi possível finalizar o quiz: ${esc(e.message || e)}</div>`;
  }
  const n = z.qs.length, correct = z.correct, pct = Math.round(correct / n * 100);
  const perf = pct >= 85 ? ['🏆', 'Excelente desempenho!'] : pct >= 60 ? ['👍', 'Bom desempenho'] : ['📚', 'Continue treinando'];
  quiz = null;
  resultHtml = `<div class="panel res"><div class="big">${perf[0]}</div><h3>${perf[1]}</h3><p class="sub">${correct} de ${n} acertos (${pct}%) · melhor sequência: ${z.best}</p><div class="bar big"><i style="width:${pct}%"></i></div>${xpHtml}
  <button class="primary" data-act="start" data-cat="${z.cat}">Tentar novamente</button><button class="secondary" data-act="exit">Voltar à Sala</button></div>`;
  render();
}

function renderPerfil() {
  const el = $('rpgView');
  if (C().guest) { el.innerHTML = box('<b>Perfil disponível com conta Google.</b>Entre com o Google para ter perfil, XP e conquistas salvos na nuvem.'); return; }
  if (err) { el.innerHTML = box(`<b>O sistema de XP ainda não está ativo no Supabase.</b>Execute o arquivo supabase-xp.sql no SQL Editor.<br><small>${esc(err)}</small>`); return; }
  if (!S) { el.innerHTML = box('Carregando seu perfil...'); return; }
  const i = info(), at = S.attempts, tot = at.reduce((s, a) => s + a.total, 0), ok = at.reduce((s, a) => s + a.correct, 0), best = at.reduce((m, a) => Math.max(m, a.best_streak), 0);
  const stats = [['Nível', i.L], ['XP total', i.xp], ['Quizzes feitos', at.length], ['Precisão', tot ? Math.round(ok / tot * 100) + '%' : '—'], ['Melhor sequência', best]]
    .map(([k, v]) => `<div class="stat"><small>${k}</small><strong>${v}</strong></div>`).join('');
  const body = tab === 'conquistas'
    ? `<div class="ach-grid">${Object.entries(ACH).map(([id, a]) => `<div class="ach ${S.unlocked.has(id) ? '' : 'lock'}"><span>${a[0]}</span><div><b>${a[1]}</b><small>${a[2]}</small></div></div>`).join('')}</div>`
    : `<div class="file-list">${S.events.length ? S.events.map(ev => `<div class="file-row"><div class="file-icon">✨</div><div class="file-info"><strong>${esc(ev.description || ev.source)}</strong><small>${new Date(ev.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</small></div><span class="xp-plus">+${ev.xp} XP</span></div>`).join('') : '<div class="empty"><b>Nenhum XP ganho ainda.</b>Complete um quiz na Sala de Treinamento para começar.</div>'}</div>`;
  el.innerHTML = `${S.p.adventurer_name && !editing ? '' : charForm()}<div class="panel pf"><div class="pf-av">${esc(S.p.avatar)}</div><div class="pf-info"><h3>${esc(S.p.adventurer_name || 'Aventureiro sem nome')}</h3><div class="sub">${CLASSES[S.p.class] ? CLASSES[S.p.class].icon + ' ' + CLASSES[S.p.class].name + ' · ' : ''}Nível ${i.L} · ${i.xp} XP</div>${S.p.adventurer_name && !editing ? '<button class="secondary" data-act="editchar" style="width:auto;margin:8px 0 0;padding:7px 14px">Editar personagem</button>' : ''}
  <div class="bar big"><i style="width:${i.pct}%"></i></div><small class="sub">${i.xp - i.a} de ${i.b - i.a} XP neste nível · faltam ${i.b - i.xp} para o nível ${i.L + 1}</small>
  <div class="av-pick">${AVATARS.map(a => `<button data-act="avatar" data-v="${a}" class="${a === S.p.avatar ? 'on' : ''}" aria-label="Avatar ${a}">${a}</button>`).join('')}</div></div></div>
  <div class="rpg-stats">${stats}</div>
  <div class="rpg-tabs"><button data-tab="conquistas" class="${tab === 'conquistas' ? 'on' : ''}">Conquistas (${S.unlocked.size}/${Object.keys(ACH).length})</button><button data-tab="historico" class="${tab === 'historico' ? 'on' : ''}">Histórico de XP</button></div>${body}`;
}

function charForm() {
  pickClass = pickClass || S.p.class || 'guerreiro';
  const has = !!S.p.adventurer_name;
  return `<div class="panel cf"><h3>${has ? 'Editar personagem' : 'Crie seu personagem'}</h3>
  <label class="sub" for="advName">Nome de aventureiro (3 a 20 caracteres: letras, números, espaço, _ ou -). Ele poderá aparecer no ranking: não use seu nome completo.</label>
  <input class="search" id="advName" maxlength="20" value="${esc(S.p.adventurer_name || '')}" placeholder="Ex.: Aprendiz do Norte">
  <div class="cls-grid">${Object.entries(CLASSES).map(([k, c]) => `<button type="button" class="cls ${k === pickClass ? 'on' : ''}" data-act="class" data-v="${k}"><span>${c.icon}</span><b>${c.name}</b><small>${c.desc}</small></button>`).join('')}</div>
  <small class="sub">As classes são só visuais: nenhuma dá vantagem de XP.</small>
  <button class="primary" data-act="savechar">Salvar personagem</button>${has ? '<button class="secondary" data-act="cancelchar">Cancelar</button>' : ''}</div>`;
}

async function saveChar() {
  const name = $('advName').value.trim().replace(/\s+/g, ' ');
  if (!/^[\p{L}\p{N} _-]{3,20}$/u.test(name)) { C().toast('Nome inválido: use de 3 a 20 caracteres (letras, números, espaço, _ ou -).'); return; }
  const r = await C().supabase.rpc('set_character', { p_name: name, p_class: pickClass });
  if (r.error) { C().toast(/set_character/.test(r.error.message) ? 'Execute o arquivo supabase-personagem.sql no Supabase.' : `Não foi possível salvar: ${r.error.message}`); return; }
  S.p.adventurer_name = name; S.p.class = pickClass; editing = false; mini(); render(); C().toast('Personagem salvo!');
}

async function setAvatar(v) {
  const r = await C().supabase.rpc('set_avatar', { p_avatar: v });
  if (r.error) { C().toast(`Não foi possível trocar o avatar: ${r.error.message}`); return; }
  S.p.avatar = v; mini(); render();
}

$('rpgView').addEventListener('click', e => {
  const b = e.target.closest('[data-act],[data-tab]'); if (!b) return;
  if (b.dataset.tab) { tab = b.dataset.tab; render(); return; }
  const a = b.dataset.act;
  if (a === 'start') start(b.dataset.cat);
  else if (a === 'ans') answer(+b.dataset.i);
  else if (a === 'next') next();
  else if (a === 'exit') { quiz = null; resultHtml = null; render(); }
  else if (a === 'avatar') setAvatar(b.dataset.v);
  else if (a === 'class') { pickClass = b.dataset.v; document.querySelectorAll('.cls').forEach(x => x.classList.toggle('on', x === b)); }
  else if (a === 'editchar') { editing = true; pickClass = S.p.class; render(); }
  else if (a === 'cancelchar') { editing = false; render(); }
  else if (a === 'savechar') saveChar();
});
document.addEventListener('click', e => { const b = e.target.closest('[data-rpg]'); if (b) openRpg(b.dataset.rpg); });
// Ao clicar em qualquer item do menu/cards antigos, esta área é escondida e o site funciona como antes.
document.querySelectorAll('.nav button,[data-open]').forEach(b => b.addEventListener('click', closeRpg));

// Detecta entrada/saída do app (Google ou convidado) sem alterar o código de login existente.
function check() {
  const c = C(); if (!c) return;
  if ($('app').style.display !== 'block') {
    if (lastKey) { lastKey = null; S = null; quiz = null; resultHtml = null; err = null; editing = false; pickClass = null; closeRpg(); mini(); }
    return;
  }
  const key = c.guest ? 'guest' : c.user?.id;
  if (key && key !== lastKey) { lastKey = key; init(); }
}
new MutationObserver(check).observe($('app'), { attributes: true, attributeFilter: ['style'] });
check();
