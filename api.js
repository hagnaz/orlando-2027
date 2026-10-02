/**
 * Rede, cache offline e preferências do aparelho.
 * Nenhum dado da viagem fica no código: tudo vem do Apps Script.
 */
var API = (function () {
  var APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyvf_s24W6gDFzdHkGywYvgH8SpSIqOct3dhxRK3avWWMLz71OKkmCW55K6T9dL065acg/exec";
  var TIMEOUT_MS = 10000;
  var CHAVES = { publico: "o27_publico", privado: "o27_privado", codigo: "o27_codigo", quem: "o27_quem" };

  function ler(chave) {
    try { var v = localStorage.getItem(chave); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* sem storage: segue sem cache */ }
  }
  function apagar(chave) {
    try { localStorage.removeItem(chave); } catch (e) { /* idem */ }
  }

  function demo() { return /[?&]demo=1/.test(location.search) && typeof DEMO !== "undefined"; }

  function buscar(url, opcoes) {
    if (APPS_SCRIPT_URL.indexOf("__") === 0) return Promise.reject(new Error("sem-url"));
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT_MS);
    var o = opcoes || {};
    if (ctrl) o.signal = ctrl.signal;
    return fetch(url, o).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error("http-" + r.status);
      return r.json();
    }, function (e) { clearTimeout(timer); throw e; });
  }

  // Tenta a rede; se falhar, devolve o cache marcado como offline.
  function comCache(chave, url) {
    return buscar(url).then(function (dados) {
      if (dados && dados.ok) gravar(chave, { salvoEm: new Date().toISOString(), dados: dados });
      return { dados: dados, offline: false };
    }).catch(function () {
      var c = ler(chave);
      if (c) return { dados: c.dados, offline: true, salvoEm: c.salvoEm };
      throw new Error("sem-cache");
    });
  }

  function buscarPublico() {
    if (demo()) return Promise.resolve({ dados: DEMO.publico, offline: false });
    return comCache(CHAVES.publico, APPS_SCRIPT_URL + "?acao=publico");
  }

  function buscarPrivado(codigo) {
    if (demo()) {
      var ok = codigo && codigo.trim().toLowerCase() === "demo";
      return Promise.resolve({ dados: ok ? DEMO.privado : { ok: false, erro: "codigo" }, offline: false });
    }
    return buscar(APPS_SCRIPT_URL + "?acao=privado&codigo=" + encodeURIComponent(codigo)).then(function (dados) {
      if (dados && dados.ok) gravar(CHAVES.privado, { salvoEm: new Date().toISOString(), dados: dados });
      return { dados: dados, offline: false };
    }).catch(function () {
      // offline: só usa o cache se este aparelho já tem o código salvo
      var c = ler(CHAVES.privado);
      if (c && ler(CHAVES.codigo)) return { dados: c.dados, offline: true, salvoEm: c.salvoEm };
      throw new Error("sem-cache");
    });
  }

  function marcar(id, status, quem) {
    if (demo()) return Promise.resolve({ ok: true });
    // text/plain evita preflight de CORS no Apps Script
    return buscar(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ acao: "marcar", id: id, status: status, quem: quem })
    }).then(function (r) {
      if (!r || !r.ok) throw new Error((r && r.erro) || "falhou");
      return r;
    });
  }

  return {
    buscarPublico: buscarPublico, buscarPrivado: buscarPrivado, marcar: marcar,
    codigo: function () { return ler(CHAVES.codigo); },
    salvarCodigo: function (c) { gravar(CHAVES.codigo, c); },
    esquecerCodigo: function () { apagar(CHAVES.codigo); apagar(CHAVES.privado); },
    quem: function () { return ler(CHAVES.quem); },
    salvarQuem: function (q) { gravar(CHAVES.quem, q); },
    atualizarCachePublico: function (dados) {
      gravar(CHAVES.publico, { salvoEm: new Date().toISOString(), dados: dados });
    }
  };
})();
