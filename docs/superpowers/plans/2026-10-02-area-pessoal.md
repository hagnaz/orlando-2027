# Área pessoal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cada uma das 6 pessoas entra no site com um código pessoal e tem checklist + notas próprios, vendo (só leitura) as áreas que a regra de visibilidade permite.

**Architecture:** Três abas novas na planilha (`pessoas`, `itens`, `notas`). Lógica pura e testável em `apps-script/Logica.js` (`L.montarPessoal`, `L.validarGravacao`); o `Codigo.js` só lê/grava a planilha. O site troca "Reservas" por "Área restrita", com sub-abas Grupo / Minha área / pessoas visíveis.

**Tech Stack:** HTML/CSS/JS ES2017 sem build, Google Apps Script V8, Google Sheets, GitHub Pages. Testes em `tests/testes.html` (mini-harness `teste/igual/verdade`), servidos por `python -m http.server 8765 --bind 127.0.0.1` e lidos pelo Claude in Chrome.

**Spec:** `docs/superpowers/specs/2026-10-02-area-pessoal-design.md`

## Global Constraints

- Visibilidade: Vinicius ↔ Aline; Daniel ↔ Cris; Daniel e Cris veem Bia e Valen; Bia e Valen só a própria.
- Edição só na própria área; `ve` nunca dá escrita.
- Offline: lê cache, edição desabilitada.
- Limites: item 1 a 200 caracteres, categoria até 40, nota até 5.000.
- Código: comparação sem maiúsculas e sem espaços nas pontas; código vazio nunca libera.
- `codigo_grupo` continua aceito enquanto existir na aba `config`.
- Nenhum código pessoal no git (`*.local.js` já está no `.gitignore`).
- Todo texto da planilha entra na tela por `textContent` (função `el`), nunca `innerHTML`.
- Nada de `alert/confirm/prompt`; confirmação de apagar é por dois toques.

## Review Focus

1. Item digitado começando com `=` ou `+` (ex.: "=comprar dólar") deve ficar texto literal na planilha, não fórmula. Coberto: toda escrita do `Codigo.js` aplica `setNumberFormat("@")` antes de gravar (Task 2).
2. Pessoa digitando a nota e marcando um item antes de salvar não pode perder o texto. Coberto: rascunho em `estado.rascunhos` (Task 4).
3. Planilha editada à mão com `feito` = "SIM", "x", "TRUE": conta como feito. Teste em Task 1.
4. Nome errado ou a própria pessoa na coluna `ve` ("Bea", "Cris" na linha da Cris): ignorado, sem quebrar nem duplicar. Teste em Task 1.
5. Item apagado na planilha enquanto a tela está aberta: servidor responde `erro:"id"` e o site recarrega a área. Teste do `erro:"id"` em Task 1; recarga em Task 4.

---

### Task 1: Lógica pura do servidor (L) e do site (S)

**Files:**
- Modify: `apps-script/Logica.js`
- Modify: `logica.js`
- Test: `tests/testes.js`

**Interfaces:**
- Produces:
  - `L.lerPessoas(valores) -> [{pessoa, codigo, ve: string[]}]`
  - `L.montarPessoal(abas, codigo) -> {ok:true, eu, reservas, contatos, areas:[{pessoa, editavel, itens:[{id,categoria,texto,feito:boolean,ordem:number}], nota:{texto, salvo_em}}]} | {ok:false, erro:"codigo"}` (abas: roteiro, pendencias, reservas, config, pessoas, itens, notas como matrizes)
  - `L.validarGravacao(pessoas, itensLinhas, corpo) -> {ok:true, pessoa, ...} | {ok:false, erro:"codigo"|"acao"|"tamanho"|"permissao"|"id"}`; `itensLinhas` = objetos de TODAS as linhas da aba itens abaixo do cabeçalho (sem descartar vazias; índice i = linha i+2). Retorno ok: nota → `{texto}`; item_novo → `{texto, categoria}`; item_marcar/item_apagar → `{indice, feito}`.
  - `L.proximaOrdem(itensLinhas, pessoa) -> number`
  - `S.agruparItens(itens) -> [{categoria, itens, feitos}]` na ordem de primeira aparição por `ordem`.

- [ ] **Step 1: Escrever os testes que falham** (acrescentar ao fim de `tests/testes.js`)

```js
// ---------- Área pessoal ----------
function abasPessoais() {
  var a = abasFixture();
  a.pessoas = [
    ["pessoa", "codigo", "ve"],
    ["Vinicius", "v-111", "Aline"],
    ["Aline", "a-222", "Vinicius"],
    ["Daniel", "d-333", "Cris, Bia, Valen"],
    ["Cris", "c-444", "Daniel, Bia, Valen, Cris, Bea"],
    ["Bia", "b-555", ""],
    ["Valen", "", ""]
  ];
  a.itens = [
    ["id", "pessoa", "categoria", "texto", "feito", "ordem"],
    ["s1-02", "Vinicius", "Saúde", "Remédios", "", "2"],
    ["s1-01", "Vinicius", "Documentos", "Passaporte", "SIM", "1"],
    ["s1-03", "Vinicius", "Documentos", "Visto", "x", "3"],
    ["", "", "", "", "", ""],
    ["s2-01", "Aline", "Documentos", "Passaporte", "", "1"],
    ["s5-01", "Bia", "Documentos", "Autorização", "TRUE", "1"]
  ];
  a.notas = [["pessoa", "texto", "salvo_em"], ["Vinicius", "levar casaco", "2026-10-02 21:00"]];
  return a;
}
function linhasItens(a) { return a.itens.slice(1).map(function (l) { return L.linhaParaObjeto(a.itens[0], l); }); }

teste("L.montarPessoal: cada pessoa vê exatamente quem deveria", function () {
  var a = abasPessoais();
  function quem(c) { return L.montarPessoal(a, c).areas.map(function (x) { return x.pessoa; }); }
  igual(quem("v-111"), ["Vinicius", "Aline"]);
  igual(quem("a-222"), ["Aline", "Vinicius"]);
  igual(quem("d-333"), ["Daniel", "Cris", "Bia", "Valen"]);
  igual(quem("c-444"), ["Cris", "Daniel", "Bia", "Valen"], "ignora a própria e nome inexistente");
  igual(quem("b-555"), ["Bia"]);
});

teste("L.montarPessoal: só a própria área é editável", function () {
  var r = L.montarPessoal(abasPessoais(), "d-333");
  igual(r.eu, "Daniel");
  igual(r.areas.map(function (x) { return x.editavel; }), [true, false, false, false]);
});

teste("L.montarPessoal: código com espaço e caixa diferente; vazio e errado recusados", function () {
  var a = abasPessoais();
  igual(L.montarPessoal(a, "  V-111 ").eu, "Vinicius");
  igual(L.montarPessoal(a, "nada"), { ok: false, erro: "codigo" });
  igual(L.montarPessoal(a, ""), { ok: false, erro: "codigo" }, "Valen tem código vazio: não pode liberar");
});

teste("L.montarPessoal: itens ordenados, feito tolerante, nota e grupo", function () {
  var r = L.montarPessoal(abasPessoais(), "v-111");
  var v = r.areas[0];
  igual(v.itens.map(function (i) { return i.id; }), ["s1-01", "s1-02", "s1-03"]);
  igual(v.itens.map(function (i) { return i.feito; }), [true, false, true]);
  igual(v.nota, { texto: "levar casaco", salvo_em: "2026-10-02 21:00" });
  igual(r.areas[1].nota, { texto: "", salvo_em: "" });
  igual(r.reservas.map(function (x) { return x.titulo; }), ["Voo de ida", "Airbnb"]);
  igual(r.contatos.length, 2);
  igual(L.montarPessoal(abasPessoais(), "b-555").areas[0].itens[0].feito, true);
});

teste("L.montarPrivado continua aceitando o código do grupo", function () {
  igual(L.montarPrivado(abasPessoais(), "orlando2027").ok, true);
});

teste("L.validarGravacao: marcar e apagar só item próprio", function () {
  var a = abasPessoais(), pes = L.lerPessoas(a.pessoas), li = linhasItens(a);
  igual(L.validarGravacao(pes, li, { codigo: "v-111", acao: "item_marcar", id: "s1-02", feito: true }),
    { ok: true, pessoa: "Vinicius", indice: 0, feito: true });
  igual(L.validarGravacao(pes, li, { codigo: "a-222", acao: "item_apagar", id: "s1-02" }),
    { ok: false, erro: "permissao" }, "Aline vê o Vinicius mas não edita");
  igual(L.validarGravacao(pes, li, { codigo: "c-444", acao: "item_marcar", id: "s5-01", feito: true }),
    { ok: false, erro: "permissao" }, "Cris vê a Bia mas não edita");
  igual(L.validarGravacao(pes, li, { codigo: "v-111", acao: "item_marcar", id: "sumiu", feito: true }),
    { ok: false, erro: "id" });
  igual(L.validarGravacao(pes, li, { codigo: "v-111", acao: "item_marcar", id: "", feito: true }),
    { ok: false, erro: "id" }, "id vazio não casa com linha vazia");
});

teste("L.validarGravacao: código, ação e tamanhos", function () {
  var a = abasPessoais(), pes = L.lerPessoas(a.pessoas), li = linhasItens(a);
  igual(L.validarGravacao(pes, li, { codigo: "x", acao: "nota_salvar", texto: "oi" }), { ok: false, erro: "codigo" });
  igual(L.validarGravacao(pes, li, { codigo: "v-111", acao: "apagar_tudo" }), { ok: false, erro: "acao" });
  igual(L.validarGravacao(pes, li, { codigo: "v-111", acao: "item_novo", texto: "  ", categoria: "X" }), { ok: false, erro: "tamanho" });
  igual(L.validarGravacao(pes, li, { codigo: "v-111", acao: "item_novo", texto: new Array(202).join("a"), categoria: "X" }), { ok: false, erro: "tamanho" });
  igual(L.validarGravacao(pes, li, { codigo: "v-111", acao: "item_novo", texto: "Boné", categoria: "" }),
    { ok: true, pessoa: "Vinicius", texto: "Boné", categoria: "Outros" });
  igual(L.validarGravacao(pes, li, { codigo: "v-111", acao: "nota_salvar", texto: new Array(5002).join("a") }), { ok: false, erro: "tamanho" });
  igual(L.validarGravacao(pes, li, { codigo: "v-111", acao: "nota_salvar", texto: "=1+1" }),
    { ok: true, pessoa: "Vinicius", texto: "=1+1" });
});

teste("L.proximaOrdem", function () {
  var a = abasPessoais(), li = linhasItens(a);
  igual(L.proximaOrdem(li, "Vinicius"), 4);
  igual(L.proximaOrdem(li, "Valen"), 1);
});

teste("S.agruparItens agrupa por categoria na ordem e conta feitos", function () {
  var g = S.agruparItens([
    { id: "3", categoria: "Docs", texto: "c", feito: true, ordem: 3 },
    { id: "1", categoria: "Docs", texto: "a", feito: false, ordem: 1 },
    { id: "2", categoria: "Saúde", texto: "b", feito: true, ordem: 2 }
  ]);
  igual(g.map(function (x) { return [x.categoria, x.itens.length, x.feitos]; }), [["Docs", 2, 1], ["Saúde", 1, 1]]);
  igual(S.agruparItens([]), []);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `python -m http.server 8765 --bind 127.0.0.1` (em `D:\code\orlando-2027`, em background) e abrir `http://127.0.0.1:8765/tests/testes.html` no Chrome.
Expected: os testes novos em FALHA ("L.montarPessoal is not a function" etc.), os antigos OK.

- [ ] **Step 3: Implementar em `apps-script/Logica.js`**

Dentro do IIFE de `L`, trocar `montarPrivado` pela versão que usa `montarGrupo` e acrescentar as funções novas:

```js
  var ACOES_PESSOAIS = ["item_marcar", "item_novo", "item_apagar", "nota_salvar"];
  var LIMITES = { texto: 200, categoria: 40, nota: 5000 };

  function montarGrupo(abas) {
    var reservas = linhasParaObjetos(abas.reservas).filter(function (r) { return r.titulo; })
      .sort(function (a, b) { return (+a.ordem || 999) - (+b.ordem || 999); });
    var contatos = [];
    linhasParaObjetos(abas.config).forEach(function (l) {
      if (l.chave.indexOf("contato_") === 0 && l.valor) {
        contatos.push({ nome: l.chave.slice(8).replace(/_/g, " "), valor: l.valor });
      }
    });
    return { reservas: reservas, contatos: contatos };
  }

  function montarPrivado(abas, codigo) {
    var cfg = lerConfig(abas.config);
    if (!codigoConfere(cfg.codigo_grupo, codigo)) return { ok: false, erro: "codigo" };
    var g = montarGrupo(abas);
    return { ok: true, reservas: g.reservas, contatos: g.contatos };
  }

  function lerPessoas(valores) {
    return linhasParaObjetos(valores).filter(function (p) { return p.pessoa; }).map(function (p) {
      return { pessoa: p.pessoa, codigo: p.codigo, ve: texto(p.ve).split(",").map(texto).filter(Boolean) };
    });
  }

  function pessoaDoCodigo(pessoas, codigo) {
    for (var i = 0; i < pessoas.length; i++) if (codigoConfere(pessoas[i].codigo, codigo)) return pessoas[i];
    return null;
  }

  function marcadoComoFeito(v) { return ["sim", "x", "true", "1", "feito"].indexOf(texto(v).toLowerCase()) >= 0; }

  function itensDe(valores, pessoa) {
    return linhasParaObjetos(valores).filter(function (i) { return i.id && i.texto && i.pessoa === pessoa; })
      .map(function (i) {
        return { id: i.id, categoria: i.categoria || "Outros", texto: i.texto, feito: marcadoComoFeito(i.feito), ordem: +i.ordem || 0 };
      }).sort(function (a, b) { return a.ordem - b.ordem; });
  }

  function notaDe(valores, pessoa) {
    var n = linhasParaObjetos(valores).filter(function (l) { return l.pessoa === pessoa; })[0];
    return { texto: n ? n.texto : "", salvo_em: n ? n.salvo_em : "" };
  }

  function montarPessoal(abas, codigo) {
    var pessoas = lerPessoas(abas.pessoas);
    var eu = pessoaDoCodigo(pessoas, codigo);
    if (!eu) return { ok: false, erro: "codigo" };
    var nomes = pessoas.map(function (p) { return p.pessoa; });
    var visiveis = [eu.pessoa];
    eu.ve.forEach(function (n) { if (nomes.indexOf(n) >= 0 && visiveis.indexOf(n) < 0) visiveis.push(n); });
    var g = montarGrupo(abas);
    return {
      ok: true, eu: eu.pessoa, reservas: g.reservas, contatos: g.contatos,
      areas: visiveis.map(function (n) {
        return { pessoa: n, editavel: n === eu.pessoa, itens: itensDe(abas.itens, n), nota: notaDe(abas.notas, n) };
      })
    };
  }

  function validarGravacao(pessoas, itensLinhas, corpo) {
    var c = corpo || {};
    var eu = pessoaDoCodigo(pessoas, c.codigo);
    if (!eu) return { ok: false, erro: "codigo" };
    if (ACOES_PESSOAIS.indexOf(c.acao) < 0) return { ok: false, erro: "acao" };
    if (c.acao === "nota_salvar") {
      var nota = c.texto === undefined || c.texto === null ? "" : String(c.texto);
      if (nota.length > LIMITES.nota) return { ok: false, erro: "tamanho" };
      return { ok: true, pessoa: eu.pessoa, texto: nota };
    }
    if (c.acao === "item_novo") {
      var t = texto(c.texto), cat = texto(c.categoria) || "Outros";
      if (!t || t.length > LIMITES.texto || cat.length > LIMITES.categoria) return { ok: false, erro: "tamanho" };
      return { ok: true, pessoa: eu.pessoa, texto: t, categoria: cat };
    }
    var id = texto(c.id);
    if (!id) return { ok: false, erro: "id" };
    for (var i = 0; i < itensLinhas.length; i++) {
      if (itensLinhas[i].id === id) {
        if (itensLinhas[i].pessoa !== eu.pessoa) return { ok: false, erro: "permissao" };
        return { ok: true, pessoa: eu.pessoa, indice: i, feito: c.feito === true };
      }
    }
    return { ok: false, erro: "id" };
  }

  function proximaOrdem(itensLinhas, pessoa) {
    var max = 0;
    itensLinhas.forEach(function (i) { if (i.pessoa === pessoa && +i.ordem > max) max = +i.ordem; });
    return max + 1;
  }
```

No `return` de `L`, acrescentar: `lerPessoas: lerPessoas, montarPessoal: montarPessoal, validarGravacao: validarGravacao, proximaOrdem: proximaOrdem`.

- [ ] **Step 4: Implementar `S.agruparItens` em `logica.js`**

Antes do `return` de `S`:

```js
  function agruparItens(itens) {
    var grupos = [], porNome = {};
    (itens || []).slice().sort(function (a, b) { return a.ordem - b.ordem; }).forEach(function (i) {
      var g = porNome[i.categoria];
      if (!g) { g = porNome[i.categoria] = { categoria: i.categoria, itens: [], feitos: 0 }; grupos.push(g); }
      g.itens.push(i);
      if (i.feito) g.feitos++;
    });
    return grupos;
  }
```

e acrescentar `agruparItens: agruparItens` ao objeto retornado.

- [ ] **Step 5: Rodar e ver passar**

Recarregar `http://127.0.0.1:8765/tests/testes.html`. Expected: "N passaram, 0 falharam".

- [ ] **Step 6: Commit**

```bash
git add apps-script/Logica.js logica.js tests/testes.js
git commit -m "Área pessoal: lógica de visibilidade, permissão e agrupamento"
```

---

### Task 2: Apps Script (leitura/gravação), checklist inicial e códigos

**Files:**
- Create: `apps-script/SeedPessoal.js` (checklist, público)
- Create: `apps-script/SeedCodigos.local.js` (códigos, fora do git)
- Modify: `apps-script/Codigo.js`
- Modify: `tests/testes.html` (carregar `SeedPessoal.js` e `SeedCodigos.local.js`)
- Test: `tests/testes.js`

**Interfaces:**
- Consumes: `L.lerPessoas`, `L.montarPessoal`, `L.validarGravacao`, `L.proximaOrdem`, `L.linhaParaObjeto` (Task 1).
- Produces: `SP.PESSOAS`, `SP.itensIniciais() -> matriz com cabeçalho ["id","pessoa","categoria","texto","feito","ordem"]`; `SEED_CODIGOS` (matriz `["pessoa","codigo","ve"]`); `doGet ?acao=pessoal&codigo=`; `doPost` ações `item_marcar {id, feito}`, `item_novo {texto, categoria} -> {ok, item}`, `item_apagar {id}`, `nota_salvar {texto} -> {ok, nota:{texto, salvo_em}}`, sempre com `codigo`; função de setup `configurarPessoal()`.

- [ ] **Step 1: Testes que falham** (acrescentar a `tests/testes.js`)

```js
teste("SP.itensIniciais: todas as pessoas, ids únicos, extras em categorias existentes", function () {
  var m = SP.itensIniciais();
  igual(m[0], ["id", "pessoa", "categoria", "texto", "feito", "ordem"]);
  var linhas = m.slice(1), ids = {};
  SP.PESSOAS.forEach(function (p) {
    verdade(linhas.some(function (l) { return l[1] === p; }), "sem itens: " + p);
  });
  linhas.forEach(function (l) { verdade(!ids[l[0]], "id repetido " + l[0]); ids[l[0]] = 1; });
  verdade(linhas.some(function (l) { return l[1] === "Bia" && /Autorização/.test(l[3]); }));
  verdade(!linhas.some(function (l) { return l[1] !== "Vinicius" && /Mounjaro/.test(l[3]); }));
  linhas.forEach(function (l) { verdade(l[3].length <= 200 && l[2].length <= 40); });
});

teste("SEED_CODIGOS: 6 pessoas, códigos únicos e não vazios, visibilidade da spec", function () {
  var p = L.lerPessoas(SEED_CODIGOS);
  igual(p.map(function (x) { return x.pessoa; }), SP.PESSOAS);
  var cods = p.map(function (x) { return x.codigo.toLowerCase(); });
  cods.forEach(function (c, i) { verdade(c.length >= 8 && cods.indexOf(c) === i, "código fraco ou repetido"); });
  igual(p.map(function (x) { return x.ve.join(","); }), ["Aline", "Vinicius", "Cris,Bia,Valen", "Daniel,Bia,Valen", "", ""]);
});

teste("Códigos pessoais não aparecem em nenhum arquivo público", function () {
  var publico = JSON.stringify(SEED_PUBLICO) + JSON.stringify(SP.itensIniciais());
  L.lerPessoas(SEED_CODIGOS).forEach(function (x) { verdade(publico.indexOf(x.codigo) < 0); });
});
```

Em `tests/testes.html`, depois de `SeedPrivado.local.js`, acrescentar:

```html
<script src="../apps-script/SeedPessoal.js"></script>
<script src="../apps-script/SeedCodigos.local.js"></script>
```

- [ ] **Step 2: Ver falhar** — recarregar a página de testes. Expected: FALHA "SP is not defined".

- [ ] **Step 3: Criar `apps-script/SeedPessoal.js`**

```js
/**
 * Checklist inicial de cada pessoa (público: sem códigos nem dados de reserva).
 * No Apps Script: arquivo "SeedPessoal". Usado só por configurarPessoal().
 */
var SP = (function () {
  var PESSOAS = ["Vinicius", "Aline", "Daniel", "Cris", "Bia", "Valen"];
  var COMUM = [
    ["Documentos", ["Passaporte (validade ok)", "Visto americano", "Cópia do passaporte e do visto no celular", "Cartão de embarque/localizador no celular"]],
    ["Saúde", ["Remédios de uso contínuo pra 17 dias", "Kit básico: analgésico, antialérgico, curativo", "Protetor solar"]],
    ["Eletrônicos", ["Carregador", "Power bank", "Adaptador de tomada", "eSIM ou chip ativado"]],
    ["Parques", ["App My Disney Experience com ingresso vinculado", "App Universal com ingresso vinculado", "Capa de chuva", "Tênis confortável já usado"]],
    ["Mala", ["Roupas pra 16 dias (tem lavadora na casa)", "Casaco leve (manhãs de janeiro ~10 °C)", "Roupa de banho", "Necessaire"]],
    ["Dinheiro", ["Cartão internacional ou conta global", "Um pouco de dólar em espécie"]]
  ];
  var EXTRAS = {
    Vinicius: [["Documentos", "Voucher Care Plus Travel (a partir de 05/01)"], ["Saúde", "Receita do Mounjaro em inglês"],
      ["Saúde", "Mounjaro na bolsa térmica"], ["Dinheiro", "US$ 110 em espécie pro Hector"]],
    Aline: [["Documentos", "Voucher Care Plus Travel (a partir de 05/01)"]],
    Daniel: [["Documentos", "CNH física dentro da validade (motorista da minivan)"], ["Documentos", "Seguro viagem da família"],
      ["Dinheiro", "Cartão de crédito pra locadora"]],
    Cris: [["Documentos", "Cópia do seguro viagem da família"]],
    Bia: [["Documentos", "Autorização de viagem com firma reconhecida (original e cópia)"]],
    Valen: []
  };

  function itensIniciais() {
    var linhas = [["id", "pessoa", "categoria", "texto", "feito", "ordem"]];
    PESSOAS.forEach(function (p, ip) {
      var ordem = 0;
      COMUM.forEach(function (bloco) {
        var extras = (EXTRAS[p] || []).filter(function (e) { return e[0] === bloco[0]; }).map(function (e) { return e[1]; });
        bloco[1].concat(extras).forEach(function (t) {
          ordem++;
          linhas.push(["s" + (ip + 1) + "-" + (ordem < 10 ? "0" : "") + ordem, p, bloco[0], t, "", String(ordem)]);
        });
      });
    });
    return linhas;
  }

  return { PESSOAS: PESSOAS, itensIniciais: itensIniciais };
})();
```

- [ ] **Step 4: Gerar `apps-script/SeedCodigos.local.js` com códigos aleatórios**

```bash
cd D:/code/orlando-2027 && python - <<'EOF'
import secrets, string
alf = string.ascii_lowercase + string.digits
def c(n): return n.lower() + "-" + "".join(secrets.choice(alf) for _ in range(6))
ve = {"Vinicius": "Aline", "Aline": "Vinicius", "Daniel": "Cris, Bia, Valen", "Cris": "Daniel, Bia, Valen", "Bia": "", "Valen": ""}
linhas = ['  ["pessoa", "codigo", "ve"]'] + ['  ["%s", "%s", "%s"]' % (p, c(p), v) for p, v in ve.items()]
open("apps-script/SeedCodigos.local.js", "w", encoding="utf-8").write(
  "/** Códigos pessoais. NÃO VAI PRO GIT. No Apps Script: arquivo \"SeedCodigos\". */\nvar SEED_CODIGOS = [\n" + ",\n".join(linhas) + "\n];\n")
EOF
git check-ignore apps-script/SeedCodigos.local.js
```

Expected: o `check-ignore` imprime o caminho (arquivo ignorado).

- [ ] **Step 5: Atualizar `apps-script/Codigo.js`**

1. `var ABAS = ["roteiro", "pendencias", "reservas", "config", "pessoas", "itens", "notas"];`
2. Em `doGet`, antes da linha `if (p.acao === "privado")`: `if (p.acao === "pessoal") return json_(L.montarPessoal(abas, p.codigo));`
3. Em `doPost`, trocar `if (corpo.acao !== "marcar") return json_({ ok: false, erro: "acao" }); return json_(marcar_(...));` por:

```js
    if (corpo.acao === "marcar") return json_(marcar_(corpo.id, corpo.status, corpo.quem));
    return json_(gravarPessoal_(corpo));
```

4. Acrescentar depois de `marcar_`:

```js
function gravarPessoal_(corpo) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = planilha_();
    var pessoas = L.lerPessoas(ss.getSheetByName("pessoas").getDataRange().getDisplayValues());
    var shI = ss.getSheetByName("itens");
    var valores = shI.getDataRange().getDisplayValues();
    var cab = valores[0];
    // sem descartar linhas vazias: o índice precisa bater com a linha da planilha
    var linhas = valores.slice(1).map(function (l) { return L.linhaParaObjeto(cab, l); });
    var v = L.validarGravacao(pessoas, linhas, corpo);
    if (!v.ok) return v;

    if (corpo.acao === "item_marcar") {
      textoNaCelula_(shI.getRange(v.indice + 2, cab.indexOf("feito") + 1), v.feito ? "sim" : "");
      return { ok: true };
    }
    if (corpo.acao === "item_apagar") {
      shI.deleteRow(v.indice + 2);
      return { ok: true };
    }
    if (corpo.acao === "item_novo") {
      var item = { id: "i" + new Date().getTime(), pessoa: v.pessoa, categoria: v.categoria, texto: v.texto, feito: "", ordem: String(L.proximaOrdem(linhas, v.pessoa)) };
      var rng = shI.getRange(shI.getLastRow() + 1, 1, 1, cab.length);
      rng.setNumberFormat("@");
      rng.setValues([cab.map(function (k) { return item[k] !== undefined ? item[k] : ""; })]);
      return { ok: true, item: { id: item.id, categoria: item.categoria, texto: item.texto, feito: false, ordem: +item.ordem } };
    }
    // nota_salvar
    var shN = ss.getSheetByName("notas");
    var nv = shN.getDataRange().getDisplayValues();
    var salvoEm = Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyyy-MM-dd HH:mm");
    var n = shN.getLastRow() + 1;
    for (var i = 1; i < nv.length; i++) if (nv[i][0] === v.pessoa) { n = i + 1; break; }
    var r = shN.getRange(n, 1, 1, 3);
    r.setNumberFormat("@");
    r.setValues([[v.pessoa, v.texto, salvoEm]]);
    return { ok: true, nota: { texto: v.texto, salvo_em: salvoEm } };
  } finally {
    lock.releaseLock();
  }
}

// "@" antes de gravar: texto começando com "=" ou "+" não vira fórmula
function textoNaCelula_(rng, valor) { rng.setNumberFormat("@"); rng.setValue(valor); }
```

5. Extrair de `configurar()` a criação de cada aba. `configurar()` passa a iterar só as 4 abas originais (o `ABAS` agora tem 7 e `dados` só tem 4 chaves):

```js
function escreverAbaNova_(ss, nome, linhas) {
  var sh = ss.getSheetByName(nome) || ss.insertSheet(nome);
  if (sh.getLastRow() > 0) { Logger.log("Aba " + nome + " já tem dados, mantida."); return; }
  var largura = linhas[0].length;
  var rng = sh.getRange(1, 1, linhas.length, largura);
  rng.setNumberFormat("@"); // texto puro: datas e horários não viram número
  rng.setValues(linhas.map(function (l) {
    var c = l.slice(0, largura);
    while (c.length < largura) c.push("");
    return c;
  }));
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, largura).setFontWeight("bold");
  sh.getRange(2, 1, Math.max(1, sh.getMaxRows() - 1), largura).setNumberFormat("@");
}
```

Em `configurar()`, trocar o `ABAS.forEach(function (nome) { ... })` inteiro por:

```js
  ["roteiro", "pendencias", "reservas", "config"].forEach(function (nome) { escreverAbaNova_(ss, nome, dados[nome]); });
```

E acrescentar:

```js
/** Cria as abas da área pessoal. Não sobrescreve aba que já tem dados. */
function configurarPessoal() {
  var ss = planilha_();
  escreverAbaNova_(ss, "pessoas", SEED_CODIGOS);
  escreverAbaNova_(ss, "itens", SP.itensIniciais());
  escreverAbaNova_(ss, "notas", [["pessoa", "texto", "salvo_em"]]);
  Logger.log("Área pessoal pronta.");
}

function testePessoal() {
  var abas = lerAbas_();
  L.lerPessoas(abas.pessoas).forEach(function (p) {
    var r = L.montarPessoal(abas, p.codigo);
    Logger.log(p.pessoa + " vê " + r.areas.map(function (a) { return a.pessoa + "(" + a.itens.length + ")"; }).join(", "));
  });
}
```

- [ ] **Step 6: Ver passar** — recarregar a página de testes. Expected: 0 falharam.

- [ ] **Step 7: Commit**

```bash
git add apps-script/SeedPessoal.js apps-script/Codigo.js tests/testes.js tests/testes.html
git commit -m "Área pessoal: Apps Script, checklist inicial e setup"
```

---

### Task 3: API do site e modo demonstração

**Files:**
- Modify: `api.js`
- Modify: `tests/demo.js`
- Modify: `index.html` (carregar `SeedPessoal.js` no demo; rótulo da nav)

**Interfaces:**
- Consumes: resposta de `?acao=pessoal` e ações POST da Task 2; `L.montarPessoal`, `SP.itensIniciais` (demo).
- Produces: `API.buscarPessoal(codigo) -> Promise<{dados, offline, salvoEm?}>`; `API.gravarPessoal(acao, dados) -> Promise<resposta>` que rejeita com `Error` cujo `.codigo` é o `erro` do servidor; `API.atualizarCachePessoal(dados)`; `API.esquecerCodigo()` também apaga o cache pessoal; `DEMO.pessoal`.

- [ ] **Step 1: `api.js`**

1. `CHAVES` ganha `pessoal: "o27_pessoal"`.
2. Acrescentar:

```js
  function buscarPessoal(codigo) {
    if (demo()) {
      var ok = codigo && codigo.trim().toLowerCase() === "demo";
      return Promise.resolve({ dados: ok ? DEMO.pessoal : { ok: false, erro: "codigo" }, offline: false });
    }
    return buscar(APPS_SCRIPT_URL + "?acao=pessoal&codigo=" + encodeURIComponent(codigo)).then(function (dados) {
      if (dados && dados.ok) gravar(CHAVES.pessoal, { salvoEm: new Date().toISOString(), dados: dados });
      return { dados: dados, offline: false };
    }).catch(function () {
      var c = ler(CHAVES.pessoal);
      if (c && ler(CHAVES.codigo)) return { dados: c.dados, offline: true, salvoEm: c.salvoEm };
      throw new Error("sem-cache");
    });
  }

  function gravarPessoal(acao, dados) {
    if (demo()) {
      if (acao === "item_novo") return Promise.resolve({ ok: true, item: { id: "d" + Date.now(), categoria: dados.categoria || "Outros", texto: dados.texto, feito: false, ordem: 9999 } });
      if (acao === "nota_salvar") return Promise.resolve({ ok: true, nota: { texto: dados.texto, salvo_em: "" } });
      return Promise.resolve({ ok: true });
    }
    var corpo = { acao: acao, codigo: ler(CHAVES.codigo) };
    Object.keys(dados || {}).forEach(function (k) { corpo[k] = dados[k]; });
    return buscar(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(corpo)
    }).then(function (r) {
      if (!r || !r.ok) { var e = new Error((r && r.erro) || "falhou"); e.codigo = r && r.erro; throw e; }
      return r;
    });
  }
```

3. No objeto retornado: `buscarPessoal: buscarPessoal, gravarPessoal: gravarPessoal`, `esquecerCodigo: function () { apagar(CHAVES.codigo); apagar(CHAVES.privado); apagar(CHAVES.pessoal); }`, `atualizarCachePessoal: function (dados) { gravar(CHAVES.pessoal, { salvoEm: new Date().toISOString(), dados: dados }); }`.

- [ ] **Step 2: `tests/demo.js`** — acrescentar no fim:

```js
// Área pessoal fictícia: entra como Vinicius (código demo) e vê a Aline.
DEMO.pessoal = (function () {
  var r = L.montarPessoal({
    reservas: [["ordem"]], config: [["chave", "valor"]],
    pessoas: [["pessoa", "codigo", "ve"], ["Vinicius", "demo", "Aline"], ["Aline", "demo-aline", "Vinicius"]],
    itens: SP.itensIniciais().filter(function (l, i) { return i === 0 || l[1] === "Vinicius" || l[1] === "Aline"; })
      .map(function (l, i) { return i > 0 && i % 4 === 0 ? l.slice(0, 4).concat(["sim", l[5]]) : l; }),
    notas: [["pessoa", "texto", "salvo_em"], ["Aline", "Exemplo de nota da Aline.", "2026-10-02 21:00"]]
  }, "demo");
  r.reservas = DEMO.privado.reservas;
  r.contatos = DEMO.privado.contatos;
  return r;
})();
```

- [ ] **Step 3: `index.html`**

1. No `document.write` do demo, incluir `<script src="apps-script/SeedPessoal.js"><\/script>` entre `Seed.js` e `tests/demo.js`.
2. Nav: trocar `<span>Reservas</span>` por `<span>Restrita</span>` (a rota continua `#reservas`).

- [ ] **Step 4: Verificar** — abrir `http://127.0.0.1:8765/index.html?demo=1#reservas`, no console do Chrome rodar `API.buscarPessoal("demo").then(r => r.dados.areas.map(a => a.pessoa + a.itens.length))`. Expected: `["Vinicius25", "Aline22"]`. E a página de testes continua 0 falhas.

- [ ] **Step 5: Commit**

```bash
git add api.js tests/demo.js index.html
git commit -m "Área pessoal: chamadas da API, cache e demo"
```

---

### Task 4: Tela "Área restrita" com checklist e notas

**Files:**
- Modify: `app.js` (seção "Reservas" e `renderizar`)
- Modify: `style.css`
- Test: manual no demo + `tests/celular.html`

**Interfaces:**
- Consumes: `API.buscarPessoal`, `API.gravarPessoal`, `API.atualizarCachePessoal`, `API.salvarQuem`, `S.agruparItens`.
- Produces: nada para outras tasks.

- [ ] **Step 1: Estado** — `var estado = { publico: null, privado: null, offlineDesde: null, pessoal: null, pessoalOffline: null, abaRestrita: null, rascunhos: {} };`

- [ ] **Step 2: Login** — substituir `carregarPrivado` por:

```js
  function carregarPrivado(codigo, digitado) {
    conteudo.textContent = "";
    conteudo.appendChild(el("p", { classe: "carregando", texto: "Abrindo área restrita…" }));
    function entrouPessoal(res) {
      API.salvarCodigo(codigo);
      API.salvarQuem(res.dados.eu);
      estado.pessoal = res.dados;
      estado.privado = { reservas: res.dados.reservas, contatos: res.dados.contatos };
      estado.pessoalOffline = res.offline ? res.salvoEm : null;
      if (res.offline) mostrarAviso("Sem conexão. Área restrita de " + dataHora(res.salvoEm) + ". Para marcar ou salvar, conecte-se.", true);
      renderizar();
    }
    function tentarGrupo() {
      return API.buscarPrivado(codigo).then(function (res) {
        if (res.dados && res.dados.ok) {
          API.salvarCodigo(codigo);
          estado.pessoal = null;
          estado.privado = res.dados;
          if (res.offline) mostrarAviso("Sem conexão. Reservas de " + dataHora(res.salvoEm) + ".", true);
          return renderizar();
        }
        if (!digitado) API.esquecerCodigo();
        estado.privado = null;
        estado.pessoal = null;
        mostrarTela(formCodigo("Código incorreto."));
      });
    }
    API.buscarPessoal(codigo).then(function (res) {
      if (res.dados && res.dados.ok) return entrouPessoal(res);
      return tentarGrupo();
    }).catch(function () {
      return tentarGrupo();
    }).catch(function () {
      mostrarTela(formCodigo("Sem conexão. Conecte-se para abrir a área restrita pela primeira vez."));
    });
  }
```

- [ ] **Step 3: Formulário** — em `formCodigo`: placeholder e aria-label "Seu código"; `h1` "Área restrita 🔒"; texto: "Aqui ficam reservas, contatos e a sua área pessoal (checklist e notas). Digite o seu código pessoal."

- [ ] **Step 4: Tela** — substituir `telaReservas` por:

```js
  function blocoGrupo(R) {
    return el("div", null, [
      el("div", { classe: "grade" }, R.reservas.map(cartaoReserva)),
      R.contatos.length ? el("section", { classe: "cartao", style: "margin-top:14px" }, [
        el("h2", { texto: "Contatos" }),
        el("ul", { classe: "contatos" }, R.contatos.map(function (c) { return el("li", null, [el("b", { texto: c.nome }), ": " + c.valor]); }))
      ]) : null
    ]);
  }

  function telaRestrita() {
    var R = estado.privado, P = estado.pessoal;
    var abas = [{ id: "grupo", nome: "Grupo" }];
    if (P) P.areas.forEach(function (a) { abas.push({ id: a.pessoa, nome: a.editavel ? "Minha área" : a.pessoa }); });
    var existe = abas.some(function (x) { return x.id === estado.abaRestrita; });
    var atual = existe ? estado.abaRestrita : (P ? P.eu : "grupo");
    var area = P && P.areas.filter(function (a) { return a.pessoa === atual; })[0];
    return el("div", null, [
      el("h1", { texto: "Área restrita 🔒" }),
      P ? el("p", { classe: "mudo", texto: "Você entrou como " + P.eu + "." })
        : el("p", { classe: "mudo", texto: "Você entrou com o código do grupo. Peça seu código pessoal ao Vinicius para ter sua área." }),
      abas.length > 1 ? el("div", { classe: "abas", role: "tablist" }, abas.map(function (x) {
        return el("button", { type: "button", role: "tab", classe: "botao pequeno" + (x.id === atual ? "" : " secundario"),
          "aria-selected": x.id === atual ? "true" : "false", texto: x.nome,
          onclick: function () { estado.abaRestrita = x.id; renderizar(); } });
      })) : null,
      area ? telaArea(area) : blocoGrupo(R),
      el("p", null, [el("button", { type: "button", classe: "botao pequeno secundario", texto: "Sair deste aparelho", onclick: function () {
        API.esquecerCodigo();
        estado.privado = null; estado.pessoal = null; estado.abaRestrita = null; estado.rascunhos = {};
        renderizar();
      } })])
    ]);
  }
```

- [ ] **Step 5: Área pessoal** — acrescentar:

```js
  function falhaGravacao(botao) {
    return function (e) {
      if (botao) { botao.removeAttribute("aria-busy"); botao.disabled = false; }
      if (e && e.codigo === "codigo") {
        API.esquecerCodigo();
        estado.privado = null; estado.pessoal = null;
        return mostrarTela(formCodigo("Seu código mudou. Peça o novo ao Vinicius."));
      }
      if (e && e.codigo === "id") {
        mostrarAviso("Esse item mudou na planilha. Atualizei a lista.", false, "erro");
        return carregarPrivado(API.codigo(), false);
      }
      mostrarAviso("Não deu para salvar. Tente de novo com internet.", false, "erro");
    };
  }

  function salvou() { API.atualizarCachePessoal(estado.pessoal); esconderAviso(); renderizar(); }

  function semConexao() {
    if (!estado.pessoalOffline) return false;
    mostrarAviso("Sem conexão: não dá para salvar agora.", true, "erro");
    return true;
  }

  function itemChecklist(i, area, podeEditar) {
    var marcar = el("button", { type: "button", classe: "pendencia" + (i.feito ? " feita" : ""), "aria-pressed": i.feito ? "true" : "false" }, [
      el("span", { classe: "caixa", "aria-hidden": "true", texto: i.feito ? "✓" : "" }),
      el("span", { classe: "item", texto: i.texto })
    ]);
    var li = el("li", { classe: "item-check" }, [marcar]);
    if (!podeEditar) { marcar.disabled = true; return li; }
    marcar.addEventListener("click", function () {
      if (semConexao()) return;
      var novo = !i.feito;
      marcar.setAttribute("aria-busy", "true"); marcar.disabled = true;
      API.gravarPessoal("item_marcar", { id: i.id, feito: novo }).then(function () { i.feito = novo; salvou(); }).catch(falhaGravacao(marcar));
    });
    var apagar = el("button", { type: "button", classe: "apagar", "aria-label": "Apagar " + i.texto, texto: "×" });
    apagar.addEventListener("click", function () {
      if (apagar.getAttribute("data-confirmar") !== "1") {
        apagar.setAttribute("data-confirmar", "1"); apagar.textContent = "Apagar?";
        setTimeout(function () { if (apagar.isConnected) { apagar.removeAttribute("data-confirmar"); apagar.textContent = "×"; } }, 3000);
        return;
      }
      if (semConexao()) return;
      apagar.disabled = true;
      API.gravarPessoal("item_apagar", { id: i.id }).then(function () {
        area.itens = area.itens.filter(function (x) { return x.id !== i.id; });
        salvou();
      }).catch(falhaGravacao(apagar));
    });
    li.appendChild(apagar);
    return li;
  }

  function formNovoItem(area, grupos) {
    var cats = grupos.map(function (g) { return g.categoria; });
    if (cats.indexOf("Outros") < 0) cats.push("Outros");
    var sel = el("select", { "aria-label": "Categoria" }, cats.map(function (c) { return el("option", { value: c, texto: c }); }));
    var input = el("input", { type: "text", maxlength: "200", placeholder: "Novo item", "aria-label": "Novo item" });
    var botao = el("button", { classe: "botao", type: "submit", texto: "Acrescentar" });
    return el("form", { classe: "cartao form-item", onsubmit: function (ev) {
      ev.preventDefault();
      var t = input.value.trim();
      if (!t || botao.disabled || semConexao()) return;
      botao.disabled = true;
      API.gravarPessoal("item_novo", { texto: t, categoria: sel.value }).then(function (r) { area.itens.push(r.item); salvou(); }).catch(falhaGravacao(botao));
    } }, [sel, input, botao]);
  }

  function fmtSalvo(s) {
    var m = (s || "").match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2})/);
    return m ? "salvo em " + m[3] + "/" + m[2] + " às " + m[4] : "";
  }

  function blocoNota(area, podeEditar) {
    var rascunho = estado.rascunhos[area.pessoa];
    var ta = el("textarea", { rows: "6", maxlength: "5000", "aria-label": area.editavel ? "Minhas notas" : "Notas de " + area.pessoa });
    ta.value = rascunho !== undefined ? rascunho : (area.nota.texto || "");
    ta.readOnly = !podeEditar;
    ta.addEventListener("input", function () { estado.rascunhos[area.pessoa] = ta.value; });
    var status = el("span", { classe: "mudo", texto: rascunho !== undefined ? "não salvo" : fmtSalvo(area.nota.salvo_em) });
    var filhos = [el("h2", { texto: area.editavel ? "Minhas notas" : "Notas de " + area.pessoa }), ta];
    if (podeEditar) {
      var b = el("button", { type: "button", classe: "botao", texto: "Salvar" });
      b.addEventListener("click", function () {
        if (semConexao()) return;
        b.disabled = true;
        API.gravarPessoal("nota_salvar", { texto: ta.value }).then(function (r) {
          area.nota = r.nota;
          delete estado.rascunhos[area.pessoa];
          salvou();
        }).catch(falhaGravacao(b));
      });
      filhos.push(el("div", { classe: "linha-nota" }, [b, status]));
    } else filhos.push(status);
    return el("section", { classe: "cartao nota" }, filhos);
  }

  function telaArea(area) {
    var podeEditar = area.editavel && !estado.pessoalOffline;
    var grupos = S.agruparItens(area.itens);
    var feitos = area.itens.filter(function (i) { return i.feito; }).length;
    var filhos = [el("h2", { texto: (area.editavel ? "Meu checklist" : "Checklist de " + area.pessoa) + " · " + feitos + "/" + area.itens.length })];
    if (!area.editavel) filhos.push(el("p", { classe: "mudo", texto: "Só leitura." }));
    grupos.forEach(function (g) {
      filhos.push(el("section", { classe: "cartao checklist" }, [
        el("h3", { texto: g.categoria + " · " + g.feitos + "/" + g.itens.length }),
        el("ul", { classe: "itens" }, g.itens.map(function (i) { return itemChecklist(i, area, podeEditar); }))
      ]));
    });
    if (podeEditar) filhos.push(formNovoItem(area, grupos));
    filhos.push(blocoNota(area, podeEditar));
    return el("div", { classe: "area" }, filhos);
  }
```

- [ ] **Step 6: Roteamento** — em `renderizar`, trocar `mostrarTela(telaReservas())` por `mostrarTela(telaRestrita())`.

- [ ] **Step 7: CSS** — acrescentar ao fim de `style.css`:

```css
.abas { display: flex; gap: 6px; flex-wrap: wrap; margin: 8px 0 14px; }
.checklist h3 { margin: 0 0 8px; font-size: 1rem; }
.itens { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.item-check { display: flex; gap: 6px; align-items: stretch; }
.item-check .pendencia { flex: 1; }
.item-check .pendencia[disabled] { cursor: default; }
.apagar { border: 1px solid var(--borda); background: var(--superficie-2); color: var(--mudo); border-radius: 10px; padding: 0 12px; font: inherit; cursor: pointer; }
.apagar[data-confirmar="1"] { background: var(--perigo); color: #fff; border-color: var(--perigo); }
.form-item { display: flex; gap: 8px; flex-wrap: wrap; }
.form-item input { flex: 1 1 160px; }
.form-item select, .form-item input, .nota textarea { font: inherit; padding: 8px 10px; border: 1px solid var(--borda); border-radius: 10px; background: var(--superficie); color: var(--texto); }
.nota textarea { width: 100%; box-sizing: border-box; resize: vertical; }
.linha-nota { display: flex; gap: 10px; align-items: center; margin-top: 8px; flex-wrap: wrap; }
.area > * + * { margin-top: 12px; }
```

- [ ] **Step 8: Verificar no demo** — `http://127.0.0.1:8765/index.html?demo=1#reservas`, código `demo`: aparece "Você entrou como Vinicius", abas Grupo / Minha área / Aline; marcar item muda contagem; acrescentar item aparece no fim da categoria; "×" pede "Apagar?" e apaga no 2º toque; aba Aline sem botões e textarea só leitura; digitar nota, marcar item, voltar: texto continua ("não salvo"). Abrir `tests/celular.html` em 400 px: sem rolagem horizontal. Testes: 0 falhas.

- [ ] **Step 9: Commit**

```bash
git add app.js style.css
git commit -m "Área restrita com checklist e notas por pessoa"
```

---

### Task 5: Publicar e verificar de verdade

**Files:**
- Regenerate: `apps-script/COLAR-NO-APPS-SCRIPT.local.js`
- Modify: `README.md` (seção "Editar o conteúdo": abas `pessoas`, `itens`, `notas`)

- [ ] **Step 1: Regenerar o pacote de colar**

```bash
cd D:/code/orlando-2027/apps-script && python - <<'EOF'
partes = ["Logica.js", "Seed.js", "SeedPessoal.js", "SeedPrivado.local.js", "SeedCodigos.local.js", "Codigo.js"]
txt = "// ARQUIVO GERADO, NÃO VAI PRO GIT (contém dados privados). Colar inteiro no Apps Script.\n"
txt += "\n".join(open(p, encoding="utf-8").read() for p in partes)
open("COLAR-NO-APPS-SCRIPT.local.js", "w", encoding="utf-8").write(txt)
EOF
```

- [ ] **Step 2: Colar e configurar** — via Claude in Chrome no projeto Apps Script (id `1oBFCZkmaBHLNh24r8gkINxHVZOf2BeGPxtn-EPcIMr4x07dR9y9iv22I`): copiar o pacote pro clipboard (`Get-Content -Raw -Encoding UTF8 ... | Set-Clipboard`), abrir `Código.gs`, Ctrl+A, Ctrl+V, Ctrl+S; apagar o arquivo `Atualiza20261002.gs` se ele conflitar (funções `escreverLinhas_`, `completar_` etc. não existem no pacote, então só apagar se der erro). Executar `configurarPessoal`, depois `testePessoal`. Expected no registro: 6 linhas, ex. "Cris vê Cris(22), Daniel(24), Bia(22), Valen(21)".

- [ ] **Step 3: Nova versão da implantação** — Implantar → Gerenciar implantações → editar (lápis) → Versão: "Nova versão" → Implantar. A URL `/exec` continua a mesma.

- [ ] **Step 4: Verificação real** — no Chrome, `fetch` direto no `/exec`:
  - para cada código de `SeedCodigos.local.js`, `?acao=pessoal` devolve `eu` e as áreas da matriz da spec;
  - `?acao=pessoal&codigo=errado` → `{ok:false, erro:"codigo"}`;
  - `?acao=publico` não contém nenhum código pessoal nem a palavra "itens";
  - com o código do Vinicius: `item_novo {texto:"=teste", categoria:"Outros"}` → aparece na planilha como texto `=teste`; `item_marcar` desse id; `item_apagar` desse id; `nota_salvar {texto:"teste"}` e depois `nota_salvar {texto:""}`;
  - com o código da Aline: `item_marcar` num id do Vinicius → `erro:"permissao"`.

- [ ] **Step 5: README** — em "Editar o conteúdo", acrescentar:

```markdown
- `pessoas` (privada): `pessoa`, `codigo` (código pessoal), `ve` (quem a pessoa enxerga, separado por vírgula). Trocar o código de alguém = editar esta coluna.
- `itens`: checklist de cada pessoa (`feito` = sim ou vazio). Pode editar à mão.
- `notas`: uma nota por pessoa.
- Para desligar o código do grupo depois que todos tiverem o código pessoal, apague a linha `codigo_grupo` da aba `config`.
```

- [ ] **Step 6: Commit e push**

```bash
git add README.md
git commit -m "README: abas da área pessoal"
```

Push: o Vinicius roda `! git -C D:/code/orlando-2027 push` (auto mode bloqueia push do Claude neste repo).

- [ ] **Step 7: Entrega** — mandar ao Vinicius os 6 códigos (lidos de `SeedCodigos.local.js`) e um texto curto pro grupo explicando: cada um entra com o seu código, o que cada um enxerga, que o dono da planilha vê tudo, e que nada sensível vai nas notas.
