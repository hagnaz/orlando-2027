/**
 * Site da Viagem Orlando 2027: porta única da planilha "Orlando 2027 - Site".
 * No Apps Script: arquivo "Codigo". Depende de Logica (L), Seed (SEED_PUBLICO) e,
 * só na primeira configuração, SeedPrivado (SEED_PRIVADO).
 *
 * SETUP (uma vez):
 * 1. https://script.google.com -> Novo projeto -> nome "Orlando 2027 - Site"
 * 2. Criar 4 arquivos de script e colar: Codigo, Logica, Seed, SeedPrivado
 * 3. Selecionar a função configurar -> Executar -> autorizar
 *    (cria a planilha no seu Drive e mostra o link no registro de execução)
 * 4. Implantar -> Nova implantação -> App da Web
 *      Executar como: Eu | Quem tem acesso: Qualquer pessoa
 * 5. Mandar a URL /exec para o Claude
 */

var PLANILHA_NOME = "Orlando 2027 - Site";
var ABAS = ["roteiro", "pendencias", "reservas", "config"];

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var abas = lerAbas_();
    if (p.acao === "privado") return json_(L.montarPrivado(abas, p.codigo));
    return json_(L.montarPublico(abas, new Date().toISOString()));
  } catch (err) {
    return json_({ ok: false, erro: String(err) });
  }
}

function doPost(e) {
  try {
    var corpo = JSON.parse(e.postData.contents);
    if (corpo.acao !== "marcar") return json_({ ok: false, erro: "acao" });
    return json_(marcar_(corpo.id, corpo.status, corpo.quem));
  } catch (err) {
    return json_({ ok: false, erro: String(err) });
  }
}

function marcar_(id, status, quem) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = planilha_().getSheetByName("pendencias");
    var valores = sh.getDataRange().getDisplayValues();
    var cab = valores[0];
    // sem descartar linhas vazias: o índice precisa bater com a linha da planilha
    var lista = valores.slice(1).map(function (l) { return L.linhaParaObjeto(cab, l); });
    var v = L.validarMarcacao(lista, id, status, quem);
    if (!v.ok) return v;

    var linha = v.indice + 2;
    var feitaEm = status === "feita"
      ? Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyyy-MM-dd HH:mm") : "";
    sh.getRange(linha, cab.indexOf("status") + 1).setValue(status);
    sh.getRange(linha, cab.indexOf("feita_por") + 1).setValue(status === "feita" ? quem : "");
    sh.getRange(linha, cab.indexOf("feita_em") + 1).setValue(feitaEm);

    var p = lista[v.indice];
    p.status = status;
    p.feita_por = status === "feita" ? quem : "";
    p.feita_em = feitaEm;
    return { ok: true, pendencia: p };
  } finally {
    lock.releaseLock();
  }
}

function lerAbas_() {
  var ss = planilha_(), abas = {};
  ABAS.forEach(function (nome) {
    var sh = ss.getSheetByName(nome);
    abas[nome] = sh ? sh.getDataRange().getDisplayValues() : [];
  });
  return abas;
}

function planilha_() {
  var id = PropertiesService.getScriptProperties().getProperty("PLANILHA_ID");
  if (!id) throw new Error("Rode configurar() antes de implantar.");
  return SpreadsheetApp.openById(id);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Cria a planilha e as abas. Não sobrescreve aba que já tem dados. */
function configurar() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("PLANILHA_ID");
  var ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create(PLANILHA_NOME);
  props.setProperty("PLANILHA_ID", ss.getId());

  var privado = typeof SEED_PRIVADO !== "undefined" ? SEED_PRIVADO : { reservas: [["ordem", "tipo", "titulo", "quando", "codigo", "detalhes", "endereco", "link"]], config: [] };
  var dados = {
    roteiro: SEED_PUBLICO.roteiro,
    pendencias: SEED_PUBLICO.pendencias,
    reservas: privado.reservas,
    config: SEED_PUBLICO.config.concat(privado.config)
  };

  ABAS.forEach(function (nome) {
    var sh = ss.getSheetByName(nome) || ss.insertSheet(nome);
    if (sh.getLastRow() > 0) { Logger.log("Aba " + nome + " já tem dados, mantida."); return; }
    var linhas = dados[nome];
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
  });

  var padrao = ss.getSheetByName("Página1") || ss.getSheetByName("Sheet1");
  if (padrao && ss.getSheets().length > 1) ss.deleteSheet(padrao);
  Logger.log("Planilha pronta: " + ss.getUrl());
}

// ---------- Testes manuais (Executar no editor e ver o registro) ----------
function testePublico() {
  var r = L.montarPublico(lerAbas_(), new Date().toISOString());
  var txt = JSON.stringify(r);
  Logger.log("ok=" + r.ok + " dias=" + r.roteiro.length + " pendencias=" + r.pendencias.length);
  Logger.log("vazou codigo? " + (txt.indexOf("codigo") >= 0) + " | vazou reservas? " + (txt.indexOf("reservas") >= 0));
}

function testePrivadoErrado() {
  Logger.log(JSON.stringify(L.montarPrivado(lerAbas_(), "codigo-errado")));
}

function testeMarcarIdaVolta() {
  Logger.log(JSON.stringify(marcar_("p04", "feita", "Vinicius")));
  Logger.log(JSON.stringify(marcar_("p04", "aberta", "Vinicius")));
}
