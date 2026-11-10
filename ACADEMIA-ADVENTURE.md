# Academia RPG — Expansão da Aventura

Esta entrega adiciona quatro sistemas de jogo e um painel de gestão docente ao site.

## Módulos do aventureiro

- **Missões semanais:** metas de quizzes, respostas corretas, XP e vitórias contra chefes. As missões reiniciam na semana (segunda-feira, fuso de São Paulo). O aluno só recebe a recompensa uma vez por missão/semana.
- **Ranking:** classificação geral, semanal e mensal. Exibe apenas nome de aventureiro, avatar, classe, nível e XP; não expõe e-mails.
- **Arena dos Chefes:** três chefes iniciais para Programação, Banco de Dados e Modelagem. Cada batalha utiliza seis perguntas do banco já existente. Respostas, resultado e recompensas são confirmados pelo Supabase; a recompensa de cada chefe é limitada a uma vitória por semana.
- **Guildas:** criação, diretório, entrada por código e saída. Cada aventureiro só pode estar em uma guilda por vez; cada guilda comporta até seis membros. Se o líder sair, a liderança passa para o membro mais antigo; uma guilda sem membros é encerrada.
- **Bandeiras de guilda:** estúdio com nove cores, sete padrões, dez símbolos e lema de até 48 caracteres. A bandeira fica salva no banco e aparece no diretório e para todos os membros; apenas o líder atual pode alterá-la.

## Painel do Professor

A conta autorizada vê uma área exclusiva com indicadores da turma, tabela de alunos (XP, quizzes, acertos, Coins e guilda), configuração/pausa de missões, configuração/pausa de chefes e moderação de guildas.

A permissão docente fica em `public.academy_teachers`; ela não pode ser concedida pelo navegador. Para autorizar outra conta, um administrador do projeto deve inserir o UUID de autenticação diretamente no banco, com a conta responsável em `granted_by`. Não conceda essa função a alunos comuns.

## Persistência e segurança

O projeto usa as RPCs autenticadas `get_weekly_missions`, `claim_weekly_mission`, `get_leaderboard`, `get_boss_catalog`, `start_boss_battle`, `finish_boss_battle`, `list_guilds`, `get_my_guild`, `create_guild`, `join_guild`, `leave_guild` e as RPCs `teacher_*`.

As tabelas internas possuem RLS habilitado e não concedem escrita direta ao cliente. Recompensas usam o ledger de XP/Coins existente, com limites e chaves idempotentes. O modo convidado não pode resgatar recompensas, criar guildas ou iniciar batalhas.

## Limites iniciais de jogo

- Missões: 100–150 XP e 30–50 Coins, conforme objetivo.
- Chefes: 120–140 XP e 40–45 Coins.
- Chefes iniciais: quatro acertos em seis questões para vencer.
- Guildas: seis membros, incluindo o líder.

## Arquivos

- `academia-adventure.js`: navegação, renderização e interação dos módulos.
- `academia-adventure.css`: estilos da expansão.
- `index.html`: inclusão do CSS e do módulo JS.
- Banco Supabase: migrações `academy_adventure_suite` e `academy_adventure_query_and_index_fixes`, aplicadas em 10/11/2026.

As migrações estão aplicadas no projeto Supabase conectado. Este documento registra a arquitetura; ele não contém chaves, tokens ou identificadores privados de usuários.
