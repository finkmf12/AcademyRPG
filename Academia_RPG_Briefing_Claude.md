# Academia RPG — Documento de visão, requisitos e plano de desenvolvimento

**Responsável pelo projeto:** Yuri Donegá  
**Objetivo deste documento:** servir como briefing para outra IA (Claude) ajudar a desenvolver o Academia RPG sem perder o contexto, as decisões já tomadas e o estado atual do projeto.

---

## 1. Orientação principal para quem for programar

Você está ajudando a desenvolver um projeto real chamado **Academia RPG**. O responsável é um estudante iniciante de Análise e Desenvolvimento de Sistemas (ADS), então explique as mudanças de forma simples e ensine o processo.

**Regras importantes:**

1. Não reconstrua o site do zero.
2. Não substitua o layout atual sem autorização.
3. Preserve todas as funções que já estão funcionando.
4. Antes de editar, analise o código atual e identifique como o projeto está organizado.
5. Faça alterações pequenas, organizadas e testáveis, uma etapa por vez.
6. Explique exatamente quais arquivos precisam ser alterados e forneça o código completo de cada arquivo alterado, ou um patch claro. Evite instruções vagas.
7. Não invente que algo foi testado ou implementado. Diferencie claramente o que está pronto, o que foi testado e o que ainda é planejamento.
8. Antes de mudanças grandes, recomende fazer uma cópia de segurança/commit no GitHub.
9. Não peça ao usuário para enviar senhas, tokens secretos ou a chave `service_role` do Supabase.
10. Nunca coloque chaves secretas no HTML ou JavaScript do navegador.
11. Não faça mudanças no banco de dados sem explicar o que será criado e por quê.
12. Se faltar informação, faça uma pergunta objetiva antes de presumir.

O usuário prefere instruções passo a passo: onde clicar, o que copiar, onde colar, como salvar, testar e publicar.

---

## 2. Visão geral do projeto

A **Academia RPG** será uma plataforma de estudos gamificada com tema de fantasia medieval. A ideia é transformar o aprendizado em uma aventura: o estudante cria uma conta, escolhe um personagem, explora reinos de conhecimento, realiza missões, responde quizzes, ganha experiência e evolui.

O público será **qualquer estudante que criar uma conta**. Não é um sistema exclusivo de uma turma ou instituição.

O projeto também deve ser apresentável como portfólio de desenvolvimento, demonstrando conhecimentos de:
- HTML, CSS e JavaScript;
- autenticação de usuários;
- banco de dados e SQL;
- armazenamento de arquivos;
- segurança e controle de acesso;
- lógica de programação;
- experiência e interface do usuário.

**Autoria exibida no site:** “Desenvolvido por Yuri Donegá”, de maneira discreta.

### Identidade visual
- Fantasia medieval, academia de magia e conhecimento.
- Interface escura, com detalhes dourados e azuis.
- Elementos visuais como castelos, pergaminhos, livros, mapas, runas e reinos.
- Animações suaves, sem prejudicar desempenho ou acessibilidade.
- Visual organizado e moderno, sem excesso de informação.
- Manter o layout que já existe e evoluí-lo gradualmente.

---

## 3. Tecnologias e infraestrutura atuais

O projeto já utiliza:
- **HTML, CSS e JavaScript** no frontend;
- **GitHub** para armazenar o código;
- **Vercel** para hospedagem;
- **Supabase** para autenticação, banco de dados e Storage.

O arquivo principal conhecido é `index.html`. Antes de propor uma estrutura nova, confira os arquivos reais do repositório.

### Estado técnico já confirmado
- O projeto foi publicado na Vercel.
- O repositório está no GitHub.
- O Supabase já está conectado ao site.
- O login com Google foi configurado e, após corrigir uma linha duplicada de declaração da URL, voltou a funcionar.
- O usuário confirmou que o login Google funciona.
- O armazenamento de arquivos também foi testado e os arquivos permanecem salvos.
- O bucket privado do Supabase se chama `study-files`.
- Existe uma tabela chamada `study_files`.
- As políticas RLS iniciais para a biblioteca foram criadas.
- O usuário tem uma opção de **entrar como convidado**.
- A biblioteca atual é individual e os arquivos de cada usuário devem permanecer privados e sincronizados entre computadores.
- O usuário publica/atualiza o projeto manualmente pelo GitHub; a integração GitHub/Vercel também foi iniciada.

**Atenção:** o login, a biblioteca e o upload foram confirmados como funcionais no estado anterior do projeto. Não os quebre ao implementar novas funções.

### Segurança das chaves
A URL do projeto Supabase e a chave pública `publishable` podem ser usadas no frontend, desde que as políticas de segurança estejam corretas. Nunca colocar no frontend:
- `service_role`;
- secret keys;
- senhas;
- tokens privados.

A proteção dos dados precisa ser feita com políticas RLS no Supabase e, quando necessário, funções seguras no servidor/banco. Esconder um botão no frontend não é controle de segurança.

O usuário já perguntou sobre deixar o repositório privado. Ainda não há confirmação registrada de que isso foi feito. Verificar com ele antes de assumir. A integração com a Vercel pode funcionar com repositório privado se a Vercel tiver permissão de acesso.

---

## 4. Estrutura principal do site

Menu planejado:

1. Início
2. Meu personagem
3. Mapa dos reinos
4. Sala de treinamento
5. Missões
6. Biblioteca
7. Ranking
8. Guildas
9. Calendário
10. Painel administrativo — somente para administradores

As telas devem compartilhar o mesmo padrão visual e funcionar bem em desktop e celular.

---

## 5. Os quatro reinos do conhecimento

### Reino da Programação
Conteúdos:
- lógica de programação;
- algoritmos;
- Portugol;
- Java;
- programação orientada a objetos (POO);
- estruturas de repetição;
- vetores e matrizes;
- funções e métodos.

### Reino do Banco de Dados
Conteúdos:
- conceitos de banco de dados;
- SQL;
- SELECT, INSERT, UPDATE e DELETE;
- WHERE, ORDER BY e GROUP BY;
- JOIN;
- chave primária (PK) e chave estrangeira (FK);
- relacionamentos;
- modelagem de dados.

### Reino da Modelagem
Conteúdos:
- levantamento de requisitos;
- regras de negócio;
- requisitos funcionais e não funcionais;
- DER;
- UML;
- diagramas de caso de uso;
- diagramas de atividades;
- entidades, atributos e relacionamentos.

### Reino da Tecnologia
Conteúdos:
- hardware;
- componentes de computadores;
- redes;
- sistemas operacionais;
- segurança da informação;
- computação em nuvem;
- conceitos gerais de tecnologia.

A estrutura deve permitir adicionar novos assuntos e perguntas sem precisar reprogramar toda a plataforma.

---

## 6. Sistema de personagem, experiência e evolução

Cada usuário autenticado deve ter um personagem próprio.

### Informações do personagem
- nome de aventureiro;
- avatar;
- classe;
- nível;
- XP atual;
- barra de progresso até o próximo nível;
- conquistas;
- histórico de atividades.

### Classes sugeridas
- Guerreiro;
- Mago;
- Arqueiro;
- Assassino.

Inicialmente, as classes são principalmente visuais. Não criar vantagens competitivas injustas entre elas.

### Ideia inicial de XP
Valores sugeridos para balanceamento inicial:
- concluir um quiz: +50 XP;
- cinco respostas corretas consecutivas: +30 XP;
- concluir uma missão: +100 XP;
- concluir um simulado: +150 XP;
- sequência de sete dias estudando: +200 XP.

Esses valores são propostas, não regras já implementadas. Podem ser ajustados após testes.

### Segurança do XP
Não confiar no JavaScript do navegador para conceder XP. Um usuário poderia alterar o código pelo console. O registro e a validação de XP devem acontecer de forma segura, por exemplo usando função RPC protegida no Supabase ou lógica server-side, com validação de:
- usuário autenticado;
- atividade realmente concluída;
- recompensa permitida;
- prevenção de recompensas duplicadas;
- limites e regras de frequência.

Manter um histórico de eventos de XP, para auditoria.

### Conquistas/medalhas sugeridas
- Primeiro quiz concluído;
- responder 20 questões de SQL;
- concluir 10 desafios de programação;
- visitar os quatro reinos;
- alcançar o nível 20.

As conquistas devem ser persistentes e concedidas com validação segura.

---

## 7. Sala de treinamento

É uma das funcionalidades centrais do projeto.

### Quizzes
- perguntas de múltipla escolha;
- alternativas A, B, C e D;
- correção automática;
- indicação de resposta correta/incorreta;
- explicação da resposta após responder;
- resultado final;
- XP concedido após validação;
- cronômetro opcional.

### Modos de treinamento
- treino livre por assunto;
- desafios de dificuldade crescente;
- simulados de 10, 20 ou 30 questões;
- histórico de tentativas;
- desempenho por disciplina;
- percentual de acertos;
- assuntos em que o estudante precisa melhorar.

### Batalhas contra chefes
Exemplo: **Dragão do SQL**.
- O estudante enfrenta uma sequência de perguntas.
- Cada resposta correta causa dano ao chefe.
- Respostas erradas podem reduzir a vida do personagem ou consumir uma tentativa.
- Ao vencer, o estudante recebe uma recompensa definida no banco.
- A dificuldade deve acompanhar o nível ou a categoria escolhida.

Uma demonstração de “Dragão do SQL” criada anteriormente em conversa era apenas um mockup ilustrativo. **Ela ainda não foi implementada no site nem conectada ao banco.**

### Conteúdo das perguntas
As perguntas devem ser cadastráveis pelo painel administrativo, com:
- enunciado;
- alternativas;
- alternativa correta;
- explicação;
- disciplina/reino;
- assunto;
- dificuldade;
- status de publicação.

Não deixar as respostas corretas expostas em dados públicos antes de o usuário responder. Avaliar uma arquitetura segura para correção.

---

## 8. Missões e mapa dos reinos

### Mapa
Criar uma tela visual em que o estudante possa acessar os quatro reinos. Cada reino mostra:
- descrição;
- assuntos disponíveis;
- progresso;
- missões;
- desafios desbloqueados.

### Missões
Exemplos:
- concluir o primeiro quiz de lógica;
- acertar 8 de 10 questões de SQL;
- estudar um assunto por determinado período;
- concluir um simulado;
- vencer um chefe.

Cada missão deve ter:
- título;
- descrição;
- reino/assunto;
- condição de conclusão;
- recompensa;
- período ou prazo, se aplicável;
- status do usuário.

O sistema deve impedir que a mesma missão gere recompensa repetidamente quando não for permitido.

---

## 9. Ranking

Criar ranking com opções:
- geral;
- semanal;
- talvez por reino/disciplina.

Mostrar somente dados que o usuário autorizou como públicos, por exemplo:
- nome de aventureiro;
- avatar;
- nível;
- XP ou pontuação.

Não expor e-mail, identificadores privados ou outros dados pessoais. Prever opção para o usuário não aparecer no ranking.

Evitar que o ranking seja manipulável por alterações feitas no navegador. Usar XP validado no banco.

---

## 10. Guildas e comunidade

Funcionalidades planejadas:
- criar guilda;
- entrar por código ou convite;
- listar membros;
- desafios coletivos;
- ranking entre guildas;
- perfil público de aventureiro;
- configurações de privacidade.

Como o cadastro é público, planejar também:
- denúncias;
- bloqueio de usuários;
- moderação de nomes e conteúdos;
- prevenção de spam;
- limites de criação de guildas e convites.

Não implementar a comunidade antes de definir regras de segurança e moderação.

---

## 11. Biblioteca de arquivos

A biblioteca já existe e é uma funcionalidade importante. Preservar seu funcionamento.

### O que já funciona
- login de usuários;
- upload/armazenamento no bucket privado `study-files`;
- tabela `study_files`;
- arquivos persistentes;
- biblioteca individual por usuário.

### Melhorias futuras
- pastas por reino/disciplina;
- busca de arquivos;
- favoritos;
- visualização de PDF;
- anotações;
- filtros por tipo de arquivo;
- organização por data.

### Separação de conteúdo
Manter separados:
1. arquivos privados enviados pelo próprio estudante;
2. materiais públicos publicados pelo administrador para todos.

Um usuário não pode acessar, editar ou excluir arquivos privados de outro usuário. Conferir as políticas RLS e as regras do Storage antes de expandir.

---

## 12. Painel administrativo

Somente administradores autorizados podem acessar e executar ações administrativas.

Funções planejadas:
- criar, editar e excluir perguntas;
- organizar disciplinas, assuntos e dificuldades;
- cadastrar missões;
- cadastrar simulados e desafios;
- publicar materiais de estudo;
- gerenciar usuários;
- consultar estatísticas;
- moderar guildas e conteúdos;
- gerenciar conquistas e recompensas.

**Segurança:** a autorização administrativa deve ser validada no banco/servidor. Não basta esconder o botão ou a página no frontend. Usuários comuns não podem promover a própria conta a administrador.

---

## 13. Modelo de dados sugerido

A estrutura abaixo é uma proposta inicial. Antes de criar tabelas, analisar o banco existente para evitar duplicações e incompatibilidades.

| Tabela sugerida | Finalidade |
|---|---|
| `profiles` | Perfil público/privado do usuário, personagem, classe, nível e preferências |
| `xp_events` | Histórico de XP concedido e motivo |
| `achievements` | Catálogo de conquistas |
| `user_achievements` | Conquistas obtidas por cada usuário |
| `quizzes` | Cadastro de quizzes e simulados |
| `questions` | Perguntas, alternativas, respostas e explicações |
| `quiz_attempts` | Tentativas, resultados e histórico |
| `missions` | Catálogo de missões |
| `user_missions` | Progresso e conclusão das missões por usuário |
| `guilds` | Guildas criadas |
| `guild_members` | Participantes de cada guilda |

Pode ser necessário criar tabelas adicionais, como respostas individuais, convites, denúncias, configurações de perfil e conteúdo público. Só criar quando houver necessidade clara.

### Regras de banco e segurança
- Usar UUID e relações coerentes quando apropriado.
- Definir PK, FK, `NOT NULL`, `UNIQUE` e `CHECK` conforme as regras.
- Ativar RLS nas tabelas que contenham dados de usuários.
- Usuários comuns só podem alterar os próprios dados permitidos.
- Dados públicos devem expor apenas os campos necessários.
- Nunca expor e-mail ou informações privadas por meio de consultas públicas.
- XP, conquistas e recompensas precisam de validação segura.
- Funções administrativas devem verificar a autorização no banco.
- Testar com pelo menos duas contas diferentes.
- Testar o modo convidado separadamente, sem misturar os dados com uma conta autenticada.

---

## 14. Modo convidado

O site já possui uma opção para entrar como convidado. Preservar essa funcionalidade.

Definir claramente o comportamento:
- convidado pode explorar a interface e fazer atividades de demonstração;
- dados de convidado podem ficar temporariamente no navegador, se essa for a implementação atual;
- não misturar dados de convidado com a biblioteca de uma conta autenticada;
- não permitir que o convidado acesse arquivos privados de usuários;
- informar quando uma ação exige cadastro/login para salvar o progresso na nuvem.

Antes de alterar o modo convidado, entender como ele está implementado atualmente.

---

## 15. Plano recomendado de implementação

Desenvolver por etapas. Não tentar implementar tudo de uma vez.

### Etapa 0 — Preparação e segurança
1. Conferir o estado atual do repositório e os arquivos.
2. Fazer backup/commit no GitHub.
3. Verificar se o repositório está privado ou público e orientar o usuário.
4. Conferir login Google e login normal, se houver.
5. Conferir biblioteca, upload e download.
6. Revisar RLS da tabela `study_files` e do bucket `study-files`.
7. Registrar o que já funciona antes de modificar.

### Etapa 1 — Personagem e XP
1. Criar ou adaptar `profiles`.
2. Criar personagem para cada usuário.
3. Permitir escolher nome, avatar e classe.
4. Criar sistema de nível e barra de XP.
5. Criar histórico seguro de XP.
6. Criar conquistas básicas.
7. Testar persistência ao sair e entrar novamente.

### Etapa 2 — Sala de treinamento
1. Criar estrutura de quizzes e perguntas.
2. Criar tela de seleção de reino/assunto.
3. Implementar questões de múltipla escolha.
4. Corrigir respostas e mostrar explicações.
5. Salvar tentativas.
6. Conceder XP com validação segura.
7. Criar simulados e histórico de desempenho.

### Etapa 3 — Mundo RPG
1. Criar mapa dos quatro reinos.
2. Exibir progresso por reino.
3. Implementar missões.
4. Implementar batalhas contra chefes.
5. Conectar recompensas às regras seguras de XP.

### Etapa 4 — Ranking e comunidade
1. Criar ranking geral e semanal.
2. Implementar preferências de privacidade.
3. Criar guildas e convites.
4. Implementar desafios coletivos.
5. Adicionar moderação e denúncias.

### Etapa 5 — Administração
1. Criar permissões administrativas seguras.
2. Criar painel para cadastrar perguntas e missões.
3. Criar gerenciamento de materiais.
4. Criar estatísticas e moderação.

### Etapa 6 — Acabamento e lançamento
1. Testar desktop e celular.
2. Testar com várias contas.
3. Testar permissões e tentativas de acesso indevido.
4. Corrigir erros e melhorar acessibilidade.
5. Documentar o projeto para apresentação no SENAI/portfólio.

**Prioridade recomendada para a primeira versão:** personagem, XP, conquistas básicas e Sala de Treinamento. Depois expandir para mapa, missões, chefes e comunidade.

---

## 16. Como orientar o responsável pelo projeto

O responsável é iniciante em ADS e quer aprender enquanto desenvolve. Ao propor uma alteração:
1. Explique primeiro o objetivo em linguagem simples.
2. Informe quais arquivos e tabelas serão afetados.
3. Explique os riscos e o que deve ser salvo antes.
4. Dê instruções numeradas e claras.
5. Mostre exatamente o código ou SQL necessário.
6. Diga onde inserir/executar.
7. Peça para testar uma coisa por vez.
8. Só avance depois de confirmar o resultado.

Evite entregar dezenas de mudanças de uma vez. Não suponha que o usuário saiba usar terminal, Git, SQL avançado ou ferramentas de deploy.

---

## 17. Primeira mensagem sugerida para iniciar o trabalho no Claude

> Quero continuar o desenvolvimento do meu projeto Academia RPG usando este documento como briefing. Primeiro, não programe nada ainda: analise o código atual que vou enviar, identifique a estrutura dos arquivos e faça um diagnóstico do que já está funcionando e do que falta. Preserve o layout e todas as funções existentes, especialmente login Google, modo convidado e biblioteca Supabase. Depois, proponha a primeira etapa pequena e segura para implementar personagem e XP. Explique tudo de forma simples, pois sou iniciante em ADS. Não invente funcionalidades implementadas e não solicite chaves secretas. Antes de alterar qualquer coisa, peça os arquivos ou informações que realmente forem necessários.

---

## 18. Observação sobre o estado do projeto

Este documento reúne a visão e as ideias planejadas para o Academia RPG, além do estado técnico que foi confirmado anteriormente. **Nem todas as funcionalidades descritas estão implementadas.** Personagem, XP, conquistas, quizzes, chefes, missões, ranking, guildas e painel administrativo são, em sua maioria, planejamento para as próximas etapas.

O que foi confirmado como funcionando no estado anterior: hospedagem na Vercel, conexão com Supabase, login Google e biblioteca individual com armazenamento persistente. O código atual deve ser inspecionado antes de qualquer alteração.
