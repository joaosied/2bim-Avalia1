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

Na primeira revisão, a IA apontou como alto risco a interpolação direta de github.base_ref em Bash, com possibilidade de injeção de comando. O workflow foi ajustado para receber BASE_REF por env. Na segunda revisão, a IA registrou que não encontrou vulnerabilidades acionáveis. O endpoint de teste vulnerável foi removido no commit https://github.com/joaosied/2bim-Avalia1/commit/95c87ce9b6b334feb55e4fe1b4df9f2902410523.

A crítica à IA é que a primeira análise atribuiu confiança alta a um risco potencial do workflow, mas não encontrou uma exploração concreta no caso executado; ainda assim, o alerta era relevante porque a interpolação de dados controlados pelo evento em shell é uma prática insegura. A segunda revisão foi mais adequada ao estado corrigido.

## Tarefa 4 — Migrações D1

PR: https://github.com/joaosied/2bim-Avalia1/pull/3

Os arquivos foram corrigidos e publicados nos caminhos exatos:

- https://github.com/joaosied/2bim-Avalia1/blob/migracao-0002/.github/workflows/migrar.yml
- https://github.com/joaosied/2bim-Avalia1/blob/migracao-0002/migrations/0002_adiciona_ip.sql

A migração contém ALTER TABLE sessions ADD COLUMN ip TEXT;. Os dois caminhos duplicados criados anteriormente foram excluídos nos commits:

- https://github.com/joaosied/2bim-Avalia1/commit/ee54aaede93c195ab65b3cfb6b92a26559c8751b
- https://github.com/joaosied/2bim-Avalia1/commit/9181a678db40437402e805b12907ea51d715e91c

O CI do PR #3 passou nos dois eventos:

- push: https://github.com/joaosied/2bim-Avalia1/actions/runs/38646550120
- pull_request: https://github.com/joaosied/2bim-Avalia1/actions/runs/38646556212

A workflow migrar está configurada para push na main com paths migrations/** e também workflow_dispatch. Por isso ela não executa no PR nem nos pushes da branch migracao-0002. Nos 12 runs dessa branch, o único workflow foi ci; não houve run migrar.

A execução remota no Cloudflare D1 ainda não foi feita: o PR não foi mergeado na main, conforme autorização solicitada, e a página de segredos do repositório informa que não há segredos cadastrados. Portanto, não há resultado real de PRAGMA table_info(sessions) a registrar e nenhum resultado foi inventado. Para concluir essa parte, João precisa cadastrar CLOUDFLARE_API_TOKEN e CLOUDFLARE_ACCOUNT_ID e autorizar o merge na main.

## Bônus

O workflow já prepara migration-summary.txt, chama actions/ai-inference@v3 e publica o resumo e a saída do PRAGMA em GITHUB_STEP_SUMMARY. A evidência de execução do bônus depende da execução remota após o merge e da configuração dos segredos Cloudflare; ela ainda não existe.

## Perguntas

1. Com um PR aberto, um push na branch dispara push e pull_request/synchronize. O check usado pela proteção da main é o do pull_request, pois ele testa o merge da branch com a main.

2. Um PR de fork não recebe secrets porque o autor poderia alterar o workflow para imprimir ou exfiltrar um segredo. Isso impede o vazamento do token.

3. permissions aplica o princípio do menor privilégio: o workflow recebe somente leitura do conteúdo, escrita no PR e a permissão de inferência necessária.

4. A revisão da IA não substitui o status check determinístico. A IA apoia a revisão, mas pode errar; o CI continua sendo a regra objetiva para o merge.

## Estado da entrega

A branch main permaneceu sem alterações e com SHA 581fd26308e3dcd96edd721db04ba762947a34b5. Os PRs #2 e #3 permanecem abertos e nenhum merge foi realizado sem autorização.
