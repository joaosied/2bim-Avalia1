# Avaliação: GitHub Actions com IA

**Dupla:** João Siedlarczyk e Eduardo Grabowski dos Santos
**Repositório:** https://github.com/joaosied/2bim-Avalia1

## Tarefa 1 — CI a cada commit

- Execução verde: https://github.com/joaosied/2bim-Avalia1/actions/runs/38617015361
- Execução vermelha: https://github.com/joaosied/2bim-Avalia1/actions/runs/38617490636
- Linha do erro: https://github.com/joaosied/2bim-Avalia1/actions/runs/38617490636/job/116036219189#step:4:9

O SQLite foi usado antes do D1 porque o D1 é baseado em SQLite. Assim, erros de sintaxe SQL são encontrados no CI, sem credenciais e sem alterar o banco de produção. O `git grep` exclui o próprio `ci.yml` para não encontrar o texto de exemplo `GOCSPX-` dentro do workflow.

## Tarefa 2 — Proteção da main

A regra da `main` exige pull request e o status check `verificar` aprovado antes do merge.

- PR bloqueado (commit com migração inválida) e depois liberado (commit de correção): https://github.com/joaosied/2bim-Avalia1/pull/1

Saída do `git push` direto na `main`, recusado:

```
$ git push origin main
remote: error: GH013: Repository rule violations found for refs/heads/main.
remote: Review all repository rules at https://github.com/joaosied/2bim-Avalia1/rules?ref=refs%2Fheads%2Fmain
remote:
remote: - Required status check "verificar" is expected.
remote:
To https://github.com/joaosied/2bim-Avalia1.git
 ! [remote rejected] main -> main (push declined due to repository rule violations)
error: failed to push some refs to 'https://github.com/joaosied/2bim-Avalia1.git'
```

## Tarefa 3 — Revisão por IA

O workflow `revisao-ia.yml` usa o `GITHUB_TOKEN` com `contents: read`, `pull-requests: write` e `copilot-requests: write`, monta o prompt com o diff do PR, chama `actions/ai-inference` e publica a resposta como comentário.

No primeiro PR de teste (https://github.com/joaosied/2bim-Avalia1/pull/2) a chamada da IA ainda falhava, e quando ela passou a funcionar o endpoint vulnerável já tinha sido removido. Por isso o teste foi refeito no PR abaixo, com a IA funcionando desde o início.

- PR do teste: https://github.com/joaosied/2bim-Avalia1/pull/5
- Primeiro comentário da IA (endpoint com SQL concatenado): COLE_AQUI_O_COMENTARIO_1
- Segundo comentário da IA (após corrigir com `prepare().bind()`): COLE_AQUI_O_COMENTARIO_2
- Log do erro de permissão (sem `pull-requests: write`): COLE_AQUI_O_ERRO_PERMISSAO

Explicação do erro de permissão: quando o workflow declara `permissions`, tudo o que não está listado fica sem acesso. Ao remover `pull-requests: write`, o `GITHUB_TOKEN` deixou de poder escrever no PR, então o step "Comenta no PR" falhou com `Resource not accessible by integration`. A permissão foi restaurada no commit seguinte.

O endpoint vulnerável foi removido antes do merge, e o workflow voltou ao estado original.

**Crítica à IA (item 4):** no PR #2, a IA classificou como HIGH, com confiança 8/10, a interpolação de `github.base_ref` no shell como injeção de comando. Essa afirmação é exagerada: em um evento `pull_request`, `base_ref` é o nome da branch de destino no repositório base (a `main`), definido pelos mantenedores, e não por quem abre o PR. O valor que o autor do PR controla é o `github.head_ref`. Mover o valor para uma variável de ambiente é uma boa prática, mas não havia uma vulnerabilidade alta nesse caso.

## Tarefa 4 — Migrações D1

- PR com a migração `0002_adiciona_ip.sql` (passou pelo CI e pela revisão da IA): https://github.com/joaosied/2bim-Avalia1/pull/3
- Execução do `migrar.yml` disparada pelo merge: https://github.com/joaosied/2bim-Avalia1/actions/runs/38648948349
- Log do job: https://github.com/joaosied/2bim-Avalia1/actions/runs/38648948349/job/116142695274

A migração contém `ALTER TABLE sessions ADD COLUMN ip TEXT;`. A aplicação foi feita remotamente no banco `oauth-sessions-joao`, e o log confirmou as duas migrações com sucesso:

```
0001_cria_sessions.sql  ✅
0002_adiciona_ip.sql    ✅
```

Saída do `PRAGMA table_info(sessions)` no step "Confirma a estrutura da tabela":

```
cid  name          type     notnull  dflt_value  pk
0    id_hash       TEXT     0        null        1
1    issuer        TEXT     1        null        0
2    subject       TEXT     1        null        0
3    email         TEXT     0        null        0
4    display_name  TEXT     0        null        0
5    expires_at    INTEGER  1        null        0
6    created_at    INTEGER  1        null        0
7    ip            TEXT     0        null        0
```

A coluna `ip` existe na tabela remota `sessions`.

### Segundo merge sem alterar migrations/

- Merge sem mudanças em `migrations/`: https://github.com/joaosied/2bim-Avalia1/pull/5
- Execuções do workflow `migrar`: https://github.com/joaosied/2bim-Avalia1/actions/workflows/migrar.yml

O workflow `migrar` só dispara em push na `main` que altere `migrations/**`. O merge do PR #5 não alterou nada em `migrations/`, e a lista de execuções do `migrar` continua mostrando apenas a execução do merge do PR #3.

## Bônus — resumo automático no GITHUB_STEP_SUMMARY

O workflow prepara o prompt de resumo e chama `actions/ai-inference` para escrever o resultado em `$GITHUB_STEP_SUMMARY`. Na execução real, a migração e o PRAGMA passaram, mas o step do resumo falhou com:

```
Error: Copilot CLI not found (tried to spawn "copilot"). Install it with "npm install -g @github/copilot" and ensure COPILOT_GITHUB_TOKEN is set.
```

Por isso não houve resumo publicado nessa execução. A correção é instalar o Copilot CLI (`npm install -g @github/copilot`) antes do step do resumo.

## Perguntas

**1.** Com um PR aberto, um push na branch dispara o evento `push` e também o `pull_request` (`synchronize`), por isso o `ci.yml` roda duas vezes. O status check que a proteção da `main` considera é o do `pull_request`, porque ele testa o resultado do merge da branch com a `main`, que é o que vai entrar de fato.

**2.** Porque um PR de fork pode alterar o workflow. Se ele recebesse os segredos, um step malicioso poderia imprimir ou enviar o `COPILOT_PAT` para fora (exfiltração de segredo). Por isso o GitHub não repassa secrets a workflows disparados por PR de fork, e o `GITHUB_TOKEN` recebe permissões reduzidas.

**3.** Pelo princípio do menor privilégio: o workflow recebe só o que precisa (leitura do conteúdo, escrita no PR e a permissão de inferência do Copilot). Se uma ação de terceiro ou um conteúdo malicioso no diff tentar abusar do token, o estrago fica limitado a comentar no PR, em vez de alterar o repositório.

**4.** Não. No item 4 da Tarefa 3, a IA classificou como alta uma vulnerabilidade que não era explorável naquele caso (`base_ref` não é controlado por quem abre o PR), ou seja, ela pode errar com confiança alta. O status check da Tarefa 2 é determinístico: o SQL roda ou não roda. A IA apoia a revisão, mas o CI continua sendo a regra objetiva para o merge.
