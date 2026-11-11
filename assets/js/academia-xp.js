// Academia RPG · XP, níveis, conquistas e Sala de Treinamento.
// Arquivo novo: usa o Supabase e o login já existentes via window.AcademiaCtx. Todo XP é gravado por funções do banco (supabase-xp.sql).
const $ = id => document.getElementById(id), C = () => window.AcademiaCtx;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = value => Number(value || 0).toLocaleString('pt-BR');
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
  perfil: ['JOGADOR', 'Perfil do Jogador', 'Acompanhe seu nível, suas conquistas e o histórico de XP.'],
  conquistas: ['LIVRO DO AVENTUREIRO', 'Livro de Conquistas', 'Registre suas vitórias, acompanhe metas e desbloqueie recompensas.'],
  market: ['TESOUROS', 'Mercado Arcano', 'Conquiste Coins, personalize seu personagem e equipe suas relíquias.'],
  atelier: ['PERSONAGEM', 'Ateliê Arcano', 'Monte seu visual, experimente equipamentos e equipe suas recompensas.']
};
const achievementReward = id => window.AcademiaAchievements?.rewardForId?.(id) ?? 40;
const MARKET_DEMO_ITEMS = [
  {id:'title-apprentice',name:'Aprendiz Arcano',category:'titles',price:50,rarity:'Comum',icon:'📜',description:'O primeiro passo de uma grande jornada.'},
  {id:'title-coder',name:'Mestre do Código',category:'titles',price:200,rarity:'Raro',icon:'⌘',description:'Para quem domina os enigmas da lógica.'},
  {id:'title-dragon',name:'Caçador de Dragões',category:'titles',price:400,rarity:'Épico',icon:'🐉',description:'Uma honra conquistada em grandes batalhas.'},
  {id:'nick-arcane',name:'Aura Arcana',category:'nick',price:100,rarity:'Incomum',icon:'✨',description:'Um brilho sutil envolve seu nome.'},
  {id:'nick-flame',name:'Chama Dourada',category:'nick',price:400,rarity:'Épico',icon:'🔥',description:'Seu nome arde com energia lendária.'},
  {id:'frame-silver',name:'Moldura Prateada',category:'frames',price:100,rarity:'Incomum',icon:'🛡️',description:'Um acabamento elegante para seu avatar.'},
  {id:'frame-royal',name:'Brasão Real',category:'frames',price:800,rarity:'Lendário',icon:'👑',description:'Uma moldura digna de uma lenda.'},
  {id:'bg-forest',name:'Floresta Encantada',category:'backgrounds',price:200,rarity:'Raro',icon:'🌲',description:'Uma paisagem envolta em mistério.'},
  {id:'bg-celestial',name:'Observatório Celeste',category:'backgrounds',price:550,rarity:'Épico',icon:'🌌',description:'Um céu profundo, constelações e a luz de um astro distante.'},
  {id:'bg-library',name:'Biblioteca Arcana',category:'backgrounds',price:350,rarity:'Raro',icon:'📚',description:'Arcos antigos, estantes encantadas e relíquias de conhecimento.'},
  {id:'bg-frost',name:'Cidadela Glacial',category:'backgrounds',price:600,rarity:'Épico',icon:'❄️',description:'Montanhas de cristal sob o brilho da aurora boreal.'},
  {id:'bg-volcano',name:'Forja Vulcânica',category:'backgrounds',price:500,rarity:'Épico',icon:'🌋',description:'Rios de lava iluminam uma terra forjada pelo fogo.'},
  {id:'bg-emerald',name:'Ruínas Esmeralda',category:'backgrounds',price:400,rarity:'Raro',icon:'🌿',description:'Um templo esquecido tomado pela floresta e pela magia.'},
  {id:'bg-royal',name:'Castelo Imperial',category:'backgrounds',price:850,rarity:'Lendário',icon:'🏰',description:'Uma fortaleza majestosa iluminada por ouro e tradição.'},
  {id:'bg-abyss',name:'Abismo Oceânico',category:'backgrounds',price:750,rarity:'Lendário',icon:'🌊',description:'Ruínas submersas em águas profundas e misteriosas.'},
  {id:'bg-cherry',name:'Jardim das Cerejeiras',category:'backgrounds',price:450,rarity:'Épico',icon:'🌸',description:'Um refúgio sereno entre pétalas e luz rosada.'},
  {id:'bg-desert',name:'Templo do Deserto',category:'backgrounds',price:350,rarity:'Raro',icon:'🏜️',description:'Dunas ancestrais guardam os segredos de um reino perdido.'},
  {id:'bg-moonlit-ruins',name:'Ruínas do Eclipse',category:'backgrounds',price:1250,rarity:'Épico',icon:'🌘',description:'Templo antigo sob um eclipse violeta, com runas que pulsam e estrelas cadentes.'},
  {id:'bg-dragon-peaks',name:'Trono dos Dragões',category:'backgrounds',price:1800,rarity:'Épico',icon:'🐉',description:'Picos vulcânicos, brasas ascendentes e a silhueta de um dragão ancestral.'},
  {id:'bg-aurora-falls',name:'Cataratas da Aurora',category:'backgrounds',price:2100,rarity:'Épico',icon:'🌌',description:'Cachoeiras luminosas sob cortinas de aurora verde e azul em movimento.'},
  {id:'bg-crystal-cavern',name:'Catedral de Cristal',category:'backgrounds',price:2600,rarity:'Lendário',icon:'💎',description:'Uma caverna monumental de cristais facetados, reflexos cianos e partículas brilhantes.'},
  {id:'bg-storm-citadel',name:'Fortaleza da Tempestade',category:'backgrounds',price:2900,rarity:'Lendário',icon:'⚡',description:'Uma fortaleza suspensa entre nuvens negras, relâmpagos e energia elétrica.'},
  {id:'bg-astral-garden',name:'Jardim Astral',category:'backgrounds',price:3200,rarity:'Lendário',icon:'✨',description:'Jardins celestes com flores de luz, pequenas órbitas e poeira estelar.'},
  {id:'bg-shadow-realm',name:'Domínio das Sombras',category:'backgrounds',price:3900,rarity:'Lendário',icon:'🌑',description:'Um reino sombrio com portal espectral, névoa violeta e fragmentos flutuantes.'},
  {id:'bg-solar-sanctum',name:'Santuário do Sol Eterno',category:'backgrounds',price:4800,rarity:'Lendário',icon:'☀️',description:'Um santuário dourado banhado por luz solar, sigilos radiantes e partículas de ouro.'},
  {id:'badge-scholar',name:'Selo do Conhecimento',category:'badges',price:50,rarity:'Comum',icon:'🏅',description:'Celebre sua dedicação aos estudos.'}
];
const MARKET_CATEGORIES = [
  ['Todos','Todos'],['titles','Títulos'],['nick','Efeitos de Nick'],['frames','Molduras'],['backgrounds','Fundos'],['badges','Insígnias'],['guild','Guildas']
];
let M = null, marketCategory = 'Todos', marketQuery = '';
let S = null, quiz = null, resultHtml = null, view = 'sala', tab = 'visao', err = null, lastKey = null, isOpen = false, editing = false, pickClass = null;

const info = () => { const xp = S.p.total_xp, L = levelOf(xp), a = need(L), b = need(L + 1); return { xp, L, a, b, pct: Math.round((xp - a) / (b - a) * 100) }; };
const box = t => `<div class="panel"><div class="empty">${t}</div></div>`;
const epic = (type, title, message, icon) => window.AcademiaNotifications?.notify({ type, title, message, icon });

function mini() {
  const el = $('xpMini'); if (!S) { el.innerHTML = ''; return; }
  const i = info();
  const avatar = window.AcademiaAvatar ? window.AcademiaAvatar.render(S.p.appearance || {}, 'mini', S.p.class) : esc(S.p.avatar);
  el.innerHTML = `<div class="xm-top"><span class="xm-av">${avatar}</span><div><b>${window.AcademiaAvatar?.nameMarkup(S.p.adventurer_name || 'Aventureiro',S.p.appearance||{})||esc(S.p.adventurer_name||'Aventureiro')}</b>Nível ${i.L}${CLASSES[S.p.class] ? ' · ' + CLASSES[S.p.class].name : ''}</div></div><div class="bar"><i style="width:${i.pct}%"></i></div>${i.xp} XP · faltam ${i.b - i.xp} para o nível ${i.L + 1}`;
}

async function fetchAll() {
  const sb = C().supabase;
  const r = await Promise.all([
    sb.from('player_profiles').select('*').maybeSingle(),
    sb.from('xp_events').select('*').order('created_at', { ascending: false }).limit(50),
    sb.from('quiz_attempts').select('*').order('created_at', { ascending: false }).limit(200),
    sb.from('user_achievements').select('achievement_id'),
    sb.from('xp_events').select('id', { count: 'exact', head: true }).eq('source', 'daily'),
    sb.from('coin_wallets').select('balance').maybeSingle(),
    sb.from('user_cosmetics').select('item_id').eq('equipped',true).like('item_id','bg-%').limit(1)
  ]);
  const bad = r.find(x => x.error); if (bad) throw bad.error;
  if (!r[0].data) throw new Error('Perfil não encontrado.');
  S = { p: r[0].data, events: r[1].data, attempts: r[2].data, unlocked: new Set(r[3].data.map(x => x.achievement_id)), days: r[4].count || 0, wallet: Number(r[5].data?.balance || 0), background: r[6].data?.[0]?.item_id || null };
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
    const n = await checkAch();
    if (r.data > 0) {
      if (window.AcademiaNotifications) epic('reward', 'Presente diário recebido', `Você ganhou ${r.data} XP por entrar na Academia hoje.`, '🎁');
      else c.toast(`+${r.data} XP · primeiro acesso do dia!`);
    }
    n.forEach(id => { if (ACH[id]) epic('achievement', 'Nova conquista', ACH[id][1], ACH[id][0]); });
  } catch (e) { err = e.message || String(e); S = null; }
  mini(); if (isOpen) render();
}

function openRpg(v) {
  view = v; isOpen = true;
  if (v === 'perfil') tab = 'visao';
  $('home').style.display = 'none'; $('library').style.display = 'none'; $('rpgView').style.display = 'block';
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.rpgnav button').forEach(b => b.classList.toggle('active', b.dataset.rpg === v));
  $('pageKicker').textContent = HEAD[v][0]; $('pageTitle').textContent = HEAD[v][1]; $('pageSub').textContent = HEAD[v][2];
  if (v === 'market') {
    M = null; $('rpgView').innerHTML = '<div class="panel"><div class="empty">Abrindo o Mercado Arcano...</div></div>';
    loadMarket().then(() => { if (isOpen && view === 'market') render(); })
      .catch(e => { M = { error: e.message || String(e) }; if (isOpen && view === 'market') render(); });
    return;
  }
  if (v === 'atelier') {
    if (window.AcademiaAvatar) window.AcademiaAvatar.open();
    else $('rpgView').innerHTML = '<div class="panel"><div class="empty">O Ateliê Arcano não foi carregado. Atualize a página.</div></div>';
    return;
  }
  if (v === 'conquistas') {
    if (window.AcademiaAchievements) window.AcademiaAchievements.open();
    else $('rpgView').innerHTML = '<div class="panel"><div class="empty">O Livro de Conquistas ainda não foi carregado. Atualize a página.</div></div>';
    return;
  }
  render();
}
function closeRpg() {
  isOpen = false; $('rpgView').style.display = 'none';
  document.querySelectorAll('.rpgnav button').forEach(b => b.classList.remove('active'));
}

function render() {
  if (view === 'market') renderMarket();
  else if (view === 'atelier') window.AcademiaAvatar?.renderAtelier();
  else if (view === 'perfil') renderPerfil();
  else if (view === 'conquistas') window.AcademiaAchievements?.render();
  else if (quiz) renderQuiz();
  else if (resultHtml) $('rpgView').innerHTML = resultHtml;
  else renderSala();
}


async function loadMarket() {
  if (C().guest) {
    M = { guest:true, balance:0, items:MARKET_DEMO_ITEMS, inventory:[], transactions:[], dailyAvailable:false, notice:null };
    return;
  }
  const sb = C().supabase;
  const [daily,wallet,items,inventory,transactions] = await Promise.all([
    sb.rpc('market_daily_status'),
    sb.from('coin_wallets').select('balance').maybeSingle(),
    sb.from('market_items').select('*').eq('active',true).order('price'),
    sb.from('user_cosmetics').select('item_id,equipped,purchased_at').order('purchased_at',{ascending:false}),
    sb.from('coin_transactions').select('id,amount,event_key,description,created_at').order('created_at',{ascending:false}).limit(30)
  ]);
  const bad=[daily,wallet,items,inventory,transactions].find(r=>r.error);
  if(bad) throw bad.error;
  M={guest:false,balance:wallet.data?.balance||0,items:items.data||[],inventory:inventory.data||[],
    transactions:transactions.data||[],dailyAvailable:daily.data===true,notice:null};
}

function marketItemCard(item) {
  const owned=(M.inventory||[]).some(x=>x.item_id===item.id);
  const cat=MARKET_CATEGORIES.find(x=>x[0]===item.category)?.[1]||'Relíquia';
  const notice=M.notice?.id===item.id?'<div class="mk-buy-alert" role="alert"><b>Coins insuficientes</b><span>Este item custa '+item.price+' Coins. Você tem '+M.balance+' Coins e precisa de mais '+Math.max(0,item.price-M.balance)+'.</span></div>':'';
  const art=item.category==='backgrounds'?(window.AcademiaAvatar?.backgroundMarkup(item.id,'card')||'<span class="mk-icon">'+esc(item.icon)+'</span>'):'<span class="mk-icon">'+esc(item.icon)+'</span>';
  return `<article class="mk-item ${item.category==='guild'?'mk-item-guild':''} ${item.category==='backgrounds'?'mk-item-background':''}">
    <div class="mk-art ${item.category==='backgrounds'?'mk-art-background':''}">${art}<span class="mk-rarity">${esc(item.rarity)}</span></div>
    <div class="mk-itembody"><div class="mk-itemtitle"><div><h4>${esc(item.name)}</h4><small>${esc(cat)}</small></div><strong>${item.price} C</strong></div>
    <p>${esc(item.description)}</p>
    ${notice}
    <button class="mk-buy ${owned?'owned':''}" data-market-act="buy" data-id="${esc(item.id)}" ${owned||M.guest?'disabled':''}>${owned?'✓ No inventário':M.guest?'Entre para adquirir':'Adquirir item'}</button></div>
  </article>`;
}

function renderMarket() {
  const el=$('rpgView');
  if(!M){el.innerHTML='<div class="panel"><div class="empty">Carregando sua carteira e seus tesouros...</div></div>';return;}
  if(M.error){el.innerHTML=box('<b>Não foi possível carregar o Mercado Arcano.</b><br>'+esc(M.error));return;}
  const g=M.guest;
  const query=marketQuery.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  const filtered=M.items.filter(x=>(marketCategory==='Todos'||x.category===marketCategory)&&
    (x.name+' '+x.description).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').includes(query));
  const inv=M.inventory.map(c=>({...c,item:M.items.find(x=>x.id===c.item_id)})).filter(x=>x.item);
  const equipped=inv.filter(x=>x.equipped).length;
  const title=inv.find(x=>x.equipped&&x.item.category==='titles')?.item;
  const nick=inv.find(x=>x.equipped&&x.item.category==='nick')?.item;
  const frame=inv.find(x=>x.equipped&&x.item.category==='frames')?.item;
  const background=inv.find(x=>x.equipped&&x.item.category==='backgrounds')?.item;
  const avatar=window.AcademiaAvatar?window.AcademiaAvatar.render(S?.p?.appearance||{},'profile',S?.p?.class||'mago'):esc(S?.p?.avatar||'🧙');
  const backgroundMarkup=window.AcademiaAvatar?.backgroundMarkup(background?.id,'market')||'';
  const name=S?.p?.adventurer_name||'Aventureiro';
  const catButtons=MARKET_CATEGORIES.map(([key,label])=>`<button class="mk-filter ${marketCategory===key?'active':''}" data-market-cat="${key}">${label}</button>`).join('');
  const inventoryHtml=inv.length?inv.map(x=>x.item.category==='guild'
    ? `<div class="mk-inv mk-inv-guild"><span>${esc(x.item.icon)}</span><div class="mk-inv-info"><b>${esc(x.item.name)}</b><small>Comprado · disponível na aba Guildas para o líder aplicar</small></div></div>`
    : `<div class="mk-inv"><span>${esc(x.item.icon)}</span><div class="mk-inv-info"><b>${esc(x.item.name)}</b><small>${x.item.category==='backgrounds'?(x.equipped?'Aplicado à ficha do aventureiro':'Pronto para decorar sua ficha'):x.equipped?'Equipado':'Disponível'}</small></div><button data-market-act="equip" data-id="${esc(x.item.id)}" data-equipped="${x.equipped}">${x.equipped?'Desequipar':'Equipar'}</button></div>`).join(''):'<div class="mk-empty">Seu inventário ainda está vazio. Escolha um tesouro no catálogo.</div>';
  const history=M.transactions.length?M.transactions.slice(0,12).map(t=>`<div class="mk-history-row"><span>${esc(t.description)}</span><b class="${t.amount>0?'plus':'minus'}">${t.amount>0?'+':''}${t.amount} Coins</b></div>`).join(''):'<div class="mk-empty">Suas movimentações aparecerão aqui.</div>';
  el.innerHTML=`
    ${g?'<div class="rpg-note">Modo convidado: você pode conhecer os tesouros, mas precisa entrar com Google para ganhar, comprar e salvar Coins no seu perfil.</div>':''}
    <section class="mk-hero"><div><span class="mk-eyebrow">✦ A feira dos aventureiros ✦</span><h3>Seu personagem. Suas escolhas.</h3><p>Conquiste moedas estudando e personalize sua identidade nos reinos da Academia.</p><div class="mk-rewards"><span>Quiz <b>+150</b></span><span>Sequência de 5 <b>+75</b></span><span>Conquista <b>+15 a +200</b></span><span>Missão diária <b>+2.500</b></span></div></div><button class="mk-atelier-cta" data-act="atelier">✦ Abrir o Ateliê Arcano</button><div class="mk-wallet"><span class="coin-symbol coin-symbol-wallet" aria-hidden="true"></span><small>SUA CARTEIRA</small><strong>${g?'—':M.balance.toLocaleString('pt-BR')+' Coins'}</strong></div></section>
    <div class="mk-metrics"><div><small>Itens no inventário</small><b>${g?'—':inv.length}</b></div><div><small>Itens equipados</small><b>${g?'—':equipped}</b></div><div><small>Próxima raridade</small><b>Épica</b></div></div>
    <section class="mk-daily"><div><b>📜 Missão diária</b><small>Resgate sua recompensa uma vez por dia.</small></div><button data-market-act="daily" ${g||!M.dailyAvailable?'disabled':''}>${g?'Entre para resgatar':M.dailyAvailable?'Resgatar +2.500 Coins':'Concluída hoje'}</button></section>
    <div class="mk-toolbar"><h3>Catálogo de tesouros</h3><input class="search" id="marketSearch" value="${esc(marketQuery)}" placeholder="Buscar item..." aria-label="Buscar item"></div>
    <div class="mk-filters">${catButtons}</div><div class="mk-grid" id="marketCatalog">${filtered.map(marketItemCard).join('')||'<div class="mk-empty">Nenhum tesouro encontrado.</div>'}</div>
    <section class="panel mk-panel" id="marketInventory"><h3>Seu inventário</h3><div class="mk-inventory">${g?'<div class="mk-empty">Entre com Google para visualizar seu inventário pessoal.</div>':inventoryHtml}</div><small class="mk-note">Itens comprados ficam disponíveis para equipar e desequipar sem custo adicional.</small></section>
    <section class="panel mk-panel"><h3>Prévia do perfil</h3><div class="mk-profile"><div class="mk-avatar ${frame?'has-frame':''} ${background?'has-background':''}">${backgroundMarkup}<div class="mk-avatar-character">${avatar}</div></div><div><h4>${esc(name)} ${nick?'<span class="mk-nick">✦ '+esc(nick.name)+'</span>':''}</h4><p>${esc(title?.name||'Aventureiro')} · Nível ${S?levelOf(S.p.total_xp):'—'}</p><small>Os cosméticos equipados serão exibidos no perfil do jogador.</small></div></div></section>
    <section class="panel mk-panel"><h3>Histórico de Coins</h3><div class="mk-history">${g?'<div class="mk-empty">O histórico fica salvo na conta Google.</div>':history}</div></section>
    <p class="mk-note">Coins são pontos virtuais do jogo. Não podem ser transferidas entre contas e não envolvem compras com dinheiro real. Chefes podem render até 2.000 Coins por vitória; a campanha também entrega grandes recompensas na primeira conclusão.</p>`;
}

async function marketAction(button) {
  if(!button||M?.guest){C().toast('Entre com Google para usar sua carteira e seu inventário.');return;}
  const action=button.dataset.marketAct, id=button.dataset.id;
  button.disabled=true;
  try{
    if(action==='daily'){
      const {data,error}=await C().supabase.rpc('market_claim_daily');
      if(error)throw error;
      C().toast(data>0?'Baú diário aberto: +2.500 Coins!':'Você já resgatou o baú diário de hoje.');
    }else if(action==='buy'){
      const item=M.items.find(x=>x.id===id);
      const {data,error}=await C().supabase.rpc('market_buy_item',{p_item_id:id});
      if(error)throw error;
      if(!data.ok){
        if(data.reason==='owned'){
          M.notice={id,message:'Você já possui este item.'};
          C().toast('Você já possui este item.');
        }else if(['insufficient','insufficient_funds','insufficient_balance'].includes(data.reason)){
          const missing=Math.max(0,(item?.price||0)-M.balance);
          M.notice={id};
          C().toast(`Coins insuficientes: este item custa ${item?.price||0}, você tem ${M.balance} e faltam ${missing} Coins.`);
        }else{
          M.notice={id,message:'Não foi possível concluir a compra. Tente novamente.'};
          C().toast('Não foi possível concluir a compra. Tente novamente.');
        }
      }else{
        M.notice=null;
        C().toast('Tesouro adquirido e adicionado ao inventário!');
      }
    }else if(action==='equip'){
      const equipped=button.dataset.equipped==='true';
      const {error}=await C().supabase.rpc('market_equip_item',{p_item_id:id,p_equipped:!equipped});
      if(error)throw error;
      C().toast(equipped?'Item desequipado.':'Item equipado no seu perfil!');
    }
    const notice=M?.notice||null;
    await loadMarket();
    M.notice=notice;
    if(action==='equip'){
      await fetchAll();
      document.dispatchEvent(new CustomEvent('academia-background-changed',{detail:{background:S?.background||null}}));
    }
    renderMarket();
  }catch(e){C().toast('Não foi possível concluir a ação: '+(e.message||e));button.disabled=false;}
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

async function finish() {
  const z = quiz;
  $('rpgView').innerHTML = '<div class="panel"><div class="empty"><b>Validando resultado e calculando XP...</b></div></div>';
  let xpHtml = '';
  try {
    const before = S ? levelOf(S.p.total_xp) : 1;
    const { data, error } = await C().supabase.rpc('finish_quiz', { p_session: z.id });
    if (error) throw error;
    if (!C().guest) {
      await fetchAll();
      await loadMarket();
      const after = levelOf(S.p.total_xp);
      mini();
      const total = (data.xp || 0) + (data.streak_xp || 0);
      const coinTotal = data.duplicate ? 0 : (M?.transactions || [])
        .filter(t => t.event_key === 'quiz:' + z.id || t.event_key === 'quiz-streak:' + z.id)
        .reduce((sum, t) => sum + Math.max(0, t.amount), 0);
      xpHtml = total > 0
        ? `<div class="res-xp">+${total} XP</div><p class="sub">${z.cat === 'simulado' ? 'Simulado' : 'Quiz'} +${data.xp || 0}${data.streak_xp ? ` · Sequência de 5 acertos +${data.streak_xp}` : ''}</p>`
        : '<div class="rpg-note">Resultado validado. Nenhum XP novo desta vez: você já recebeu a recompensa desta categoria hoje ou atingiu o limite diário.</div>';
      if (coinTotal > 0) xpHtml += `<p class="mk-earned"><span class="coin-symbol" aria-hidden="true"></span> +${coinTotal} Coins adicionadas à sua carteira.</p>`;
      if (after > before) xpHtml += `<p><b>Você subiu para o nível ${after}!</b></p>`;
      (data.achievements || []).forEach(id => { if (ACH[id]) xpHtml += `<p>🏅 Nova conquista: <b>${ACH[id][1]}</b> · +${fmt(achievementReward(id))} Coins</p>`; });
      if (total > 0 || coinTotal > 0) epic('reward', 'Recompensa do treinamento', (total > 0 ? '+' + fmt(total) + ' XP' : '') + (total > 0 && coinTotal > 0 ? ' · ' : '') + (coinTotal > 0 ? '+' + fmt(coinTotal) + ' Coins' : '') + ' adicionados à sua jornada.', '🎁');
      if (after > before) epic('level', 'Novo nível alcançado!', 'Você evoluiu para o nível ' + after + '. Continue avançando, aventureiro.', '⬆');
      (data.achievements || []).forEach(id => { if (ACH[id]) epic('achievement', 'Conquista desbloqueada', ACH[id][1], ACH[id][0]); });
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
  if (err) { el.innerHTML = box('<b>O sistema de XP ainda não está ativo no Supabase.</b>Execute o arquivo supabase-xp.sql no SQL Editor.<br><small>' + esc(err) + '</small>'); return; }
  if (!S) { el.innerHTML = box('Carregando seu perfil...'); return; }

  const i = info(), at = S.attempts || [];
  const tot = at.reduce((sum, a) => sum + Number(a.total || 0), 0);
  const ok = at.reduce((sum, a) => sum + Number(a.correct || 0), 0);
  const best = at.reduce((max, a) => Math.max(max, Number(a.best_streak || 0)), 0);
  const totalAchievements = Object.keys(ACH).length;
  const unlocked = Object.entries(ACH).filter(([id]) => S.unlocked.has(id));
  const precision = tot ? Math.round(ok / tot * 100) + '%' : '—';
  const displayName = S.p.adventurer_name || 'Aventureiro sem nome';
  const classInfo = CLASSES[S.p.class] || { name: 'Aventureiro', icon: '✦' };
  const appearance = S.p.appearance || {};
  const avatar = window.AcademiaAvatar
    ? window.AcademiaAvatar.render(appearance, 'profile', S.p.class)
    : esc(S.p.avatar || '⚔');
  const nameMarkup = window.AcademiaAvatar?.nameMarkup(displayName, appearance) || esc(displayName);
  const titleMarkup = window.AcademiaAvatar?.titleMarkup(appearance, 'profile') || '';
  const backgroundMarkup = window.AcademiaAvatar?.backgroundMarkup(S.background, 'profile') || '';
  const recentEvents = S.events.slice(0, 5).map(ev => {
    const when = new Date(ev.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    return '<div class="pf-overview-row"><span>⚡</span><div><b>' + esc(ev.description || ev.source || 'Atividade concluída') + '</b><small>' + esc(when) + '</small></div><strong class="xp-plus">+' + fmt(ev.xp) + ' XP</strong></div>';
  }).join('');
  const achievementRows = unlocked.slice(0, 5).map(([id, a]) =>
    '<div class="pf-overview-row"><span>' + a[0] + '</span><div><b>' + esc(a[1]) + '</b><small>' + esc(a[2]) + '</small></div></div>'
  ).join('');
  const statData = [
    ['✦', 'Nível atual', fmt(i.L)],
    ['⚡', 'Experiência total', fmt(i.xp) + ' XP'],
    ['coin', 'Carteira de Coins', fmt(S.wallet)],
    ['🏅', 'Conquistas', unlocked.length + ' / ' + totalAchievements],
    ['🎯', 'Precisão', precision],
    ['🔥', 'Melhor sequência', fmt(best) + ' acertos']
  ];
  const stats = statData.map(([icon, label, value]) =>
    '<article class="pf-stat-card"><span>' + (icon === 'coin' ? '<span class="coin-symbol coin-symbol-wallet" aria-hidden="true"></span>' : icon) +
    '</span><small>' + label + '</small><strong>' + value + '</strong></article>'
  ).join('');

  let body = '';
  if (tab === 'conquistas') {
    body = '<div class="ach-grid">' + Object.entries(ACH).map(([id, a]) =>
      '<div class="ach ' + (S.unlocked.has(id) ? '' : 'lock') + '"><span>' + a[0] + '</span><div><b>' + esc(a[1]) + '</b><small>' + esc(a[2]) + '</small></div></div>'
    ).join('') + '</div>';
  } else if (tab === 'historico') {
    body = '<div class="file-list">' + (S.events.length
      ? S.events.map(ev => '<div class="file-row"><div class="file-icon">✨</div><div class="file-info"><strong>' + esc(ev.description || ev.source) +
        '</strong><small>' + esc(new Date(ev.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })) +
        '</small></div><span class="xp-plus">+' + fmt(ev.xp) + ' XP</span></div>').join('')
      : '<div class="empty"><b>Nenhum XP ganho ainda.</b>Complete um quiz na Sala de Treinamento para começar.</div>') + '</div>';
  } else {
    body = '<div class="pf-overview-grid"><section class="pf-overview-panel"><h4>Atividades recentes</h4><div class="pf-overview-list">' +
      (recentEvents || '<div class="pf-overview-empty">Suas primeiras atividades e recompensas aparecerão aqui.</div>') +
      '</div></section><section class="pf-overview-panel"><h4>Conquistas desbloqueadas <span class="pf-achievement-count">(' + unlocked.length + ')</span></h4><div class="pf-overview-list">' +
      (achievementRows || '<div class="pf-overview-empty">Complete missões e treinamentos para registrar suas primeiras conquistas.</div>') +
      '</div></section></div>';
  }

  const editForm = S.p.adventurer_name && !editing ? '' : charForm();
  const editButton = S.p.adventurer_name && !editing
    ? '<button class="secondary" data-act="editchar">Editar nome e classe</button>'
    : '';
  el.innerHTML = editForm +
    '<section class="pf-legend'+(S.background?' pf-legend-has-bg':'')+'">' + backgroundMarkup +
      '<div class="pf-legend-main"><div class="pf-legend-portrait">' + avatar + '</div>' +
        '<div class="pf-legend-info"><small class="pf-legend-kicker">FICHA LENDÁRIA DO AVENTUREIRO</small>' +
          '<h3>' + nameMarkup + '</h3><div class="pf-legend-title">' + titleMarkup + '</div>' +
          '<div class="pf-legend-meta">' + classInfo.icon + ' ' + esc(classInfo.name) + ' · Nível ' + fmt(i.L) +
          '<br>' + fmt(i.xp) + ' XP acumulados · ' + fmt(S.wallet) + ' Coins</div>' +
          '<div class="pf-legend-actions"><button class="secondary" data-act="atelier">Personalizar visual</button>' + editButton + '</div>' +
        '</div></div>' +
      '<aside class="pf-legend-side"><small>PROGRESSO PARA O PRÓXIMO NÍVEL</small>' +
        '<div class="pf-level-numbers"><span>Nível ' + fmt(i.L) + '</span><strong>' + i.pct + '%</strong><span>Nível ' + fmt(i.L + 1) + '</span></div>' +
        '<div class="pf-level-track" role="progressbar" aria-label="Progresso de experiência" aria-valuenow="' + i.pct + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + i.pct + '%"></i></div>' +
        '<div class="pf-next-level">' + fmt(i.xp - i.a) + ' / ' + fmt(i.b - i.a) + ' XP neste nível. Faltam ' + fmt(i.b - i.xp) + ' XP para evoluir.</div>' +
      '</aside>' +
    '</section>' +
    '<div class="pf-stat-grid">' + stats + '</div>' +
    '<div class="rpg-tabs pf-tabs"><button data-tab="visao" class="' + (tab === 'visao' ? 'on' : '') + '">Visão geral</button>' +
      '<button data-tab="conquistas" class="' + (tab === 'conquistas' ? 'on' : '') + '">Conquistas (' + unlocked.length + '/' + totalAchievements + ')</button>' +
      '<button data-tab="historico" class="' + (tab === 'historico' ? 'on' : '') + '">Histórico de XP</button></div>' + body;
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

document.addEventListener('academia-avatar-changed',e=>{if(S?.p){S.p.appearance=e.detail?.appearance||{};mini();if(isOpen&&view==='perfil')renderPerfil();}});
$('rpgView').addEventListener('click', e => {
  const marketButton=e.target.closest('[data-market-act]');
  if(marketButton){marketAction(marketButton);return;}
  const categoryButton=e.target.closest('[data-market-cat]');
  if(categoryButton){marketCategory=categoryButton.dataset.marketCat;renderMarket();return;}
  const b = e.target.closest('[data-act],[data-tab]'); if (!b) return;
  if (b.dataset.tab) { tab = b.dataset.tab; render(); return; }
  const a = b.dataset.act;
  if (a === 'start') start(b.dataset.cat);
  else if (a === 'ans') answer(+b.dataset.i);
  else if (a === 'next') next();
  else if (a === 'exit') { quiz = null; resultHtml = null; render(); }
  else if (a === 'atelier') openRpg('atelier');
  else if (a === 'avatar') setAvatar(b.dataset.v);
  else if (a === 'class') { pickClass = b.dataset.v; document.querySelectorAll('.cls').forEach(x => x.classList.toggle('on', x === b)); }
  else if (a === 'editchar') { editing = true; pickClass = S.p.class; render(); }
  else if (a === 'cancelchar') { editing = false; render(); }
  else if (a === 'savechar') saveChar();
});
$('rpgView').addEventListener('input',e=>{
  if(e.target.id==='marketSearch'){
    marketQuery=e.target.value;
    const q=marketQuery.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
    const list=(M?.items||[]).filter(x=>(marketCategory==='Todos'||x.category===marketCategory)&&
      (x.name+' '+x.description).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').includes(q));
    const target=$('marketCatalog'); if(target) target.innerHTML=list.map(marketItemCard).join('')||'<div class="mk-empty">Nenhum tesouro encontrado.</div>';
  }
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
