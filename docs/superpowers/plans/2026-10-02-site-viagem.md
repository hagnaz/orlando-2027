# Plano de Implementação do Site da Viagem Orlando 2027

> **Para trabalhadores agênticos:** SUB-SKILL OBRIGATÓRIA: Use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. As etapas usam sintaxe de checkbox (`- [ ]`) para rastreamento.

**Objetivo:** Site responsivo (GitHub Pages) com Hoje, Roteiro, Pendências e Reservas protegidas por código, lendo uma planilha via Apps Script, com cache offline.

**Arquitetura:** HTML/CSS/JS puros sem dado nenhum no repo. Apps Script como única porta da planilha: ação `publico` (roteiro, pendências, marcos), `privado` (reservas e contatos, exige código) e `marcar` (status de pendência). Lógica pura separada em arquivos JS testáveis no navegador; o código de I/O (SpreadsheetApp, fetch, DOM) fica fino em volta.

**Stack Técnica:** HTML5, CSS (custom properties, grid), JS ES2017 sem build, Google Apps Script (V8), Google Sheets, GitHub Pages. Testes: página `tests/testes.html` com mini-harness de asserções, servida por `python -m http.server` e lida via Claude in Chrome.

**Spec:** `docs/superpowers/specs/2026-10-02-site-viagem-design.md`

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `apps-script/Logica.js` | Funções puras do servidor: linhas da planilha para objetos, filtros, montagem das respostas, validação de marcação e de código. Colado no Apps Script como arquivo `Logica`. |
| `apps-script/Codigo.js` | `doGet`/`doPost`, acesso à planilha, `configurar()` que cria a planilha e as abas, funções `teste*`. Colado como `Codigo`. |
| `apps-script/Seed.js` | Dados públicos iniciais (roteiro, pendências, marcos). Sem nada sensível. |
| `apps-script/SeedPrivado.local.js` | Reservas, contatos e código do grupo. **No `.gitignore`**, nunca vai pro repo. |
| `logica.js` | Funções puras do site: estado da viagem, dia N, ordenação de pendências, próximo marco, formatação de datas. |
| `api.js` | `fetch` com timeout, cache no `localStorage`, código e "quem sou eu". |
| `app.js` | Renderização das 4 telas e eventos. |
| `index.html`, `style.css` | Casca e visual responsivo. |
| `tests/testes.html`, `tests/testes.js` | Harness e casos de teste das duas lógicas. |
| `README.md`, `.gitignore` | Publicação e edição da planilha. |

Interfaces compartilhadas (nomes fixos, usados em todas as tarefas):

- Objeto roteiro: `{data:"2027-01-11", titulo, tipo, horarios, notas, restaurante}`
- Objeto pendência: `{id, item, responsavel, prazo, status, feita_por, feita_em}`
- Objeto reserva: `{ordem, tipo, titulo, quando, codigo, detalhes, endereco, link}`
- Marco: `{data, texto}`; contato: `{nome, valor}`
- `L.linhasParaObjetos(valores)`: primeira linha = cabeçalho
- `L.montarPublico(abas, agoraIso)` → `{ok:true, atualizadoEm, inicio, fim, roteiro, pendencias, marcos}`
- `L.montarPrivado(abas, codigo)` → `{ok:true, reservas, contatos}` ou `{ok:false, erro:"codigo"}`
- `L.validarMarcacao(pendencias, id, status, quem)` → `{ok:true, indice}` ou `{ok:false, erro}`
- `S.estadoViagem(hojeIso, inicio, fim)` → `"antes" | "durante" | "depois"`
- `S.diaDaViagem(hojeIso, inicio)` → número (1 = inicio)
- `S.diasAte(hojeIso, alvoIso)` → inteiro
- `S.ordenarPendencias(lista)` → `{abertas, feitas}` (abertas por prazo, sem prazo no fim)
- `S.proximoMarco(marcos, hojeIso)` → marco ou `null`
- `S.formatarData(iso)` → `"seg, 11/01"`

`abas` = `{roteiro:[[...]], pendencias:[[...]], reservas:[[...]], config:[[...]]}` (matrizes cruas de `getValues()`, valores já convertidos para texto).

---

### Tarefa 1: Esqueleto do repo e harness de teste

**Arquivos:** criar `.gitignore`, `tests/testes.html`, `tests/testes.js` (vazio de casos), `logica.js` e `apps-script/Logica.js` vazios com o namespace.

- [ ] `.gitignore` com `*.local.js`.
- [ ] `tests/testes.html` carrega `../apps-script/Logica.js`, `../logica.js`, `testes.js`; harness `teste(nome, fn)`, `igual(a, b)` (compara via JSON), imprime cada resultado e um resumo `#resumo` com `"N passaram, M falharam"`.
- [ ] Rodar `python -m http.server 8765` na raiz e abrir `http://localhost:8765/tests/testes.html`. Esperado: `0 passaram, 0 falharam`.
- [ ] Commit.

### Tarefa 2: Lógica do servidor (TDD)

**Arquivos:** `apps-script/Logica.js`, `tests/testes.js`.

Casos de teste (escrever primeiro, ver falhar):
- `linhasParaObjetos` com cabeçalho e 2 linhas; linha totalmente vazia descartada.
- `montarPublico`: roteiro sem `data` é ignorado; roteiro ordenado por data; pendência sem `id` ou `item` ignorada; `marcos` vem de `config.marcos` em formato `"2026-11-23;texto|2026-12-11;texto"`; **resposta não contém `codigo_grupo`, `reservas` nem `contato_`** (checar `JSON.stringify`).
- `montarPrivado`: código certo com espaços e maiúsculas diferentes passa; código errado devolve `{ok:false, erro:"codigo"}` sem `reservas`; código vazio na config nunca libera; reservas sem `titulo` ignoradas e ordenadas por `ordem`; contatos vêm das chaves `contato_*` (nome = resto da chave com `_` virando espaço).
- `validarMarcacao`: id inexistente, status fora de `feita/aberta`, `quem` fora da lista → erro; válido → índice correto.

- [ ] Escrever casos, rodar, ver falhar.
- [ ] Implementar `var L = (function(){...})()` com as funções acima. `QUEM_VALIDOS = ["Vinicius","Aline","Daniel","Cris","Bia","Valen"]`.
- [ ] Rodar, ver passar. Commit.

### Tarefa 3: Lógica do site (TDD)

**Arquivos:** `logica.js`, `tests/testes.js`.

Casos: `estadoViagem` em 2026-10-02 / 2027-01-10 / 2027-01-26 / 2027-01-27; `diaDaViagem("2027-01-11","2027-01-10") = 2`; `diasAte("2026-10-02","2027-01-10") = 100`; `ordenarPendencias` com prazo misturado e vazio; `proximoMarco` ignora marcos passados e devolve o mais próximo; `formatarData("2027-01-11") = "seg, 11/01"`. Todas as datas tratadas como texto AAAA-MM-DD, aritmética em UTC (sem fuso).

- [ ] Casos, falhar, implementar `var S = (function(){...})()`, passar. Commit.

### Tarefa 4: Apps Script (I/O) e seed

**Arquivos:** `apps-script/Codigo.js`, `apps-script/Seed.js`, `apps-script/SeedPrivado.local.js`.

- [ ] `Codigo.js`: `PLANILHA_NOME = "Orlando 2027 - Site"`; ID guardado em `PropertiesService.getScriptProperties()` (`PLANILHA_ID`). `lerAbas_()` lê as 4 abas com `getDisplayValues()`. `doGet(e)`: `acao=publico` → `L.montarPublico`; `acao=privado&codigo=` → `L.montarPrivado`. `doPost(e)`: corpo JSON `{acao:"marcar", id, status, quem}` → `L.validarMarcacao` e escreve `status`, `feita_por`, `feita_em` (vazios quando volta a `aberta`), dentro de `LockService`. Toda resposta via `json_()`; exceção → `{ok:false, erro:String(err)}`.
- [ ] `configurar()`: cria a planilha se não houver ID, cria as 4 abas com cabeçalhos e popula com `SEED_PUBLICO` e `SEED_PRIVADO` (se definido). Idempotente: se a aba já tem dados, não sobrescreve.
- [ ] `testePublico()`, `testePrivadoErrado()`, `testeMarcarIdaVolta()` com `Logger.log`.
- [ ] `Seed.js`: roteiro dos 17 dias (revisão 2 do calendário macro, ajustada: 1 carro; 25/01 livre/checkout a definir; 26/01 partida 12:55 de SFB), pendências levantadas em 02/10/2026, marcos (23/11 Cinderella, 11/12 limite cancelamento grátis Airbnb, fim de out reserva carro).
- [ ] `SeedPrivado.local.js`: voos, Airbnb, carro (cotação), contatos, código do grupo.
- [ ] Testar `L.montarPublico` com o `SEED_PUBLICO` real dentro de `testes.js` (caso "seed público não contém dados sensíveis": comparar com cada código, endereço e número de bilhete de `SEED_PRIVADO`, carregado só localmente).
- [ ] Commit (sem o `.local.js`).

### Tarefa 5: api.js

- [ ] `API.url` (constante `APPS_SCRIPT_URL`, placeholder `"__APPS_SCRIPT_URL__"` até o deploy).
- [ ] `API.buscarPublico()` / `API.buscarPrivado(codigo)`: `fetch` GET com `AbortController` 10s; sucesso grava `localStorage["o27_publico"|"o27_privado"] = {salvoEm, dados}`; falha devolve cache com `{offline:true, salvoEm}` ou lança erro `"sem-cache"`. `localStorage` sempre em `try/catch`.
- [ ] `API.marcar(id, status, quem)`: POST `text/plain` com JSON; sem fallback de fingir sucesso.
- [ ] `API.codigo()`/`salvarCodigo`/`esquecerCodigo`, `API.quem()`/`salvarQuem`.
- [ ] Commit.

### Tarefa 6: Casca, visual e telas

**Arquivos:** `index.html`, `style.css`, `app.js`.

- [ ] `index.html`: `<title>Orlando 2027</title>`, viewport, `main#conteudo`, `nav` com 4 botões (Hoje, Roteiro, Pendências, Reservas 🔒), faixa `#aviso` para offline/erros, diálogo "quem é você?" e formulário de código.
- [ ] `style.css`: tokens claro/escuro (`prefers-color-scheme`), mobile first, nav fixa embaixo com `env(safe-area-inset-bottom)`; `@media (min-width: 700px)` nav lateral, grades de 2-3 colunas; `max-width: 1100px`.
- [ ] `app.js`: roteamento por hash (`#hoje`, `#roteiro`, `#pendencias`, `#reservas`); renderizadores das 4 telas conforme a spec usando `S.*`; copiar código (`navigator.clipboard.writeText`, com fallback de selecionar texto); link do Maps `https://www.google.com/maps/search/?api=1&query=`; marcar pendência com estado otimista revertido em falha; textos sempre via `textContent` (nunca `innerHTML` com dado da planilha).
- [ ] Testar localmente com dados fake: `?demo=1` faz `api.js` usar `SEED` embutido em `tests/demo.js` (dados fictícios, não os reais). Conferir em 400px e 1280px. Commit.

### Tarefa 7: Publicação e verificação

- [ ] Criar repo `hagnaz/orlando-2027` (público) e push; ativar Pages (`gh api`).
- [ ] Vinicius: colar `Logica`, `Codigo`, `Seed`, `SeedPrivado` no Apps Script, rodar `configurar()`, implantar como app da Web (Eu / Qualquer pessoa), mandar a URL `/exec`.
- [ ] Injetar a URL em `api.js`, commit, push.
- [ ] Verificar: JSON de `?acao=publico` sem dados sensíveis; `?acao=privado&codigo=errado` sem dados; site publicado em 400px e 1280px; código errado/certo; marcar e desmarcar pendência e conferir na planilha.
- [ ] README final, memória e nota da vault atualizadas.
