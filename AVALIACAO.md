# Avaliação: GitHub Actions com IA

**Dupla:** João Siedlarczyk e Eduardo Grabowski dos Santos  
**Repositório:** https://github.com/joaosied/2bim-Avalia1

## Tarefa 1 — CI a cada commit

- Execução verde: https://github.com/joaosied/2bim-Avalia1/actions/runs/38617015361
- Execução vermelha: https://github.com/joaosied/2bim-Avalia1/actions/runs/38617490636
- Linha do erro: https://github.com/joaosied/2bim-Avalia1/actions/runs/38617490636/job/116036219189#step:4:9

O SQLite foi usado antes do D1 porque o D1 é baseado em SQLite. Assim, erros de sintaxe SQL são encontrados no CI, sem credenciais e sem alterar o banco de produção. O git grep exclui o próprio ci.yml para não encontrar o texto de exemplo GOCSPX- dentro do workflow.

## Tarefa 2 — Proteção da main

A regra da main exige pull request e o status check verificar aprovado.  
PR bloqueado e liberado: https://github.com/joaosied/2bim-Avalia1/pull/1

A tentativa direta de push foi recusada por GH013 porque o check obrigatório verificar era esperado:

    remote: - Required status check "verificar" is expected.

## Tarefa 3 — Revisão por IA

PR: https://github.com/joaosied/2bim-Avalia1/pull/2

O workflow final usa o GITHUB_TOKEN oficial, com contents: read, pull-requests: write e copilot-requests: write. Não foi necessário expor nem criar um PAT.

- Falha de permissão registrada: https://github.com/joaosied/2bim-Avalia1/actions/runs/38641250408
- Execução da revisão corrigida: https://github.com/joaosied/2bim-Avalia1/actions/runs/38644741783
- CI correspondente: https://github.com/joaosied/2bim-Avalia1/actions/runs/38644741812
- Primeiro comentário real da IA: https://github.com/joaosied/2bim-Avalia1/pull/2#issuecomment-6179443538
- Segundo comentário real da IA: https://github.com/joaosied/2bim-Avalia1/pull/2#issuecomment-6179477610
- Merge autorizado: commit https://github.com/joaosied/2bim-Avalia1/commit/54ccdfb

Na primeira revisão, a IA apontou como alto risco a interpolação direta de github.base_ref em Bash, com possibilidade de injeção de comando. O workflow foi ajustado para receber BASE_REF por env. Na segunda revisão, a IA registrou que não encontrou vulnerabilidades acionáveis. O endpoint de teste vulnerável foi removido no commit https://github.com/joaosied/2bim-Avalia1/commit/95c87ce9b6b334feb55e4fe1b4df9f2902410523.

A crítica à IA é que a primeira análise atribuiu confiança alta a um risco potencial do workflow, mas não encontrou uma exploração concreta no caso executado; ainda assim, o alerta era relevante porque a interpolação de dados controlados pelo evento em shell é uma prática insegura. A segunda revisão foi mais adequada ao estado corrigido.

## Tarefa 4 — Migrações D1

PR: https://github.com/joaosied/2bim-Avalia1/pull/3

Os arquivos foram corrigidos e publicados nos caminhos exatos:

- https://github.com/joaosied/2bim-Avalia1/blob/main/.github/workflows/migrar.yml
- https://github.com/joaosied/2bim-Avalia1/blob/main/migrations/0002_adiciona_ip.sql

A migração contém ALTER TABLE sessions ADD COLUMN ip TEXT;. Os dois caminhos duplicados criados anteriormente foram excluídos nos commits:

- https://github.com/joaosied/2bim-Avalia1/commit/ee54aaede93c195ab65b3cfb6b92a26559c8751b
- https://github.com/joaosied/2bim-Avalia1/commit/9181a678db40437402e805b12907ea51d715e91c

O CI do PR #3 passou nos dois eventos:

- push: https://github.com/joaosied/2bim-Avalia1/actions/runs/38646550120
- pull_request: https://github.com/joaosied/2bim-Avalia1/actions/runs/38646556212

### Merge e execução remota real

O PR #3 foi mergeado com autorização explícita no commit https://github.com/joaosied/2bim-Avalia1/commit/701704ac0db52caa59ad800aa082ac97fce5918e.

- Execução real do migrar.yml: https://github.com/joaosied/2bim-Avalia1/actions/runs/38648948349
- Log do job: https://github.com/joaosied/2bim-Avalia1/actions/runs/38648948349/job/116142695274

A aplicação foi feita remotamente no banco oauth-sessions-joao, identificado pelo workflow como 55f38b4d-853d-4125-b48f-41aa5d4b1b76. O log confirmou as duas migrações com status de sucesso:

    0001_cria_sessions.sql  ✅
    0002_adiciona_ip.sql    ✅

### Saída real do PRAGMA table_info(sessions)

O step “Confirma a estrutura da tabela” executou remotamente PRAGMA table_info(sessions); e retornou, entre outras propriedades:

    cid  name          type     notnull  dflt_value  pk
    0    id_hash       TEXT     0        null        1
    1    issuer        TEXT     1        null        0
    2    subject       TEXT     1        null        0
    3    email         TEXT     0        null        0
    4    display_name  TEXT     0        null        0
    5    expires_at    INTEGER  1        null        0
    6    created_at    INTEGER  1        null        0
    7    ip            TEXT     0        null        0

O JSON real do resultado informou "success": true. Portanto, a coluna ip existe na tabela remota sessions, com cid: 7, tipo TEXT e notnull: 0.

## Bônus — resumo automático no GITHUB_STEP_SUMMARY

O workflow prepara migration-summary.txt, chama actions/ai-inference@v3 e possui o passo que publica a resposta e o PRAGMA em GITHUB_STEP_SUMMARY.

Na execução real acima, a migração e o PRAGMA passaram, mas o bônus de IA falhou no passo “Resume a migração com IA”. O log real foi:

    Error: Copilot CLI not found (tried to spawn "copilot"). Install it with "npm install -g @github/copilot" and ensure COPILOT_GITHUB_TOKEN is set.

Por causa dessa falha, não houve resumo de IA publicado nessa execução. Esta avaliação registra a ausência real do resumo e não inventa conteúdo. A correção segura identificada é instalar o Copilot CLI antes de actions/ai-inference@v3 e executar uma nova revisão do workflow.

## Perguntas

1. Com um PR aberto, um push na branch dispara push e pull_request/synchronize. O check usado pela proteção da main é o do pull_request, pois ele testa o merge da branch com a main.

2. Um PR de fork não recebe secrets porque o autor poderia alterar o workflow para imprimir ou exfiltrar um segredo. Isso impede o vazamento do token.

3. permissions aplica o princípio do menor privilégio: o workflow recebe somente leitura do conteúdo, escrita no PR e a permissão de inferência necessária.

4. A revisão da IA não substitui o status check determinístico. A IA apoia a revisão, mas pode errar; o CI continua sendo a regra objetiva para o merge.

## Estado da entrega

- PR #2: mergeado com autorização, commit 54ccdfb.
- PR #3: mergeado com autorização, commit 701704a.
- PR #4: aberto, branch entrega → main: https://github.com/joaosied/2bim-Avalia1/pull/4
- O merge final do PR #4 ainda não foi realizado.
- O arquivo está no caminho correto da branch entrega: https://github.com/joaosied/2bim-Avalia1/blob/entrega/AVALIACAO.md
