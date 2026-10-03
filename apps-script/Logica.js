/**
 * Lógica pura do servidor (sem SpreadsheetApp). Testada em tests/testes.html.
 * No Apps Script: arquivo "Logica".
 */
var L = (function () {
  var QUEM_VALIDOS = ["Vinicius", "Aline", "Daniel", "Cris", "Bia", "Valen"];
  var STATUS_VALIDOS = ["aberta", "feita"];

  function texto(v) { return v === null || v === undefined ? "" : String(v).trim(); }

  function linhaParaObjeto(cabecalho, linha) {
    var obj = {};
    for (var i = 0; i < cabecalho.length; i++) obj[texto(cabecalho[i])] = texto(linha[i]);
    return obj;
  }

  function linhaVazia(linha) {
    for (var i = 0; i < linha.length; i++) if (texto(linha[i]) !== "") return false;
    return true;
  }

  function linhasParaObjetos(valores) {
    if (!valores || valores.length < 2) return [];
    var cab = valores[0], out = [];
    for (var i = 1; i < valores.length; i++) {
      if (!linhaVazia(valores[i])) out.push(linhaParaObjeto(cab, valores[i]));
    }
    return out;
  }

  function doisDigitos(n) { return (n < 10 ? "0" : "") + n; }

  function normalizarData(v) {
    var s = texto(v), m;
    if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return m[1] + "-" + m[2] + "-" + m[3];
    if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) {
      return m[3] + "-" + doisDigitos(+m[2]) + "-" + doisDigitos(+m[1]);
    }
    return "";
  }

  function lerConfig(valores) {
    var cfg = {};
    linhasParaObjetos(valores).forEach(function (l) { if (l.chave) cfg[l.chave] = l.valor; });
    return cfg;
  }

  function lerMarcos(txt) {
    return texto(txt).split("|").map(function (par) {
      var i = par.indexOf(";");
      if (i < 0) return null;
      var data = normalizarData(par.slice(0, i));
      var t = texto(par.slice(i + 1));
      return data && t ? { data: data, texto: t } : null;
    }).filter(Boolean).sort(function (a, b) { return a.data < b.data ? -1 : 1; });
  }

  function montarPublico(abas, agoraIso) {
    var cfg = lerConfig(abas.config);
    var roteiro = linhasParaObjetos(abas.roteiro).map(function (d) {
      return {
        data: normalizarData(d.data), titulo: d.titulo, tipo: d.tipo || "livre",
        horarios: d.horarios, notas: d.notas, restaurante: d.restaurante
      };
    }).filter(function (d) { return d.data && d.titulo; })
      .sort(function (a, b) { return a.data < b.data ? -1 : a.data > b.data ? 1 : 0; });

    var pendencias = linhasParaObjetos(abas.pendencias).filter(function (p) {
      return p.id && p.item;
    }).map(function (p) {
      return {
        id: p.id, item: p.item, responsavel: p.responsavel, prazo: normalizarData(p.prazo),
        status: p.status === "feita" ? "feita" : "aberta", feita_por: p.feita_por, feita_em: p.feita_em
      };
    });

    return {
      ok: true, atualizadoEm: agoraIso,
      inicio: normalizarData(cfg.inicio), fim: normalizarData(cfg.fim),
      roteiro: roteiro, pendencias: pendencias, marcos: lerMarcos(cfg.marcos)
    };
  }

  function codigoConfere(esperado, recebido) {
    var e = texto(esperado).toLowerCase(), r = texto(recebido).toLowerCase();
    return e !== "" && e === r;
  }

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

  // setValues interpreta "=", "+", "-" e "@" no início como fórmula mesmo com formato texto
  function protegerTexto(v) { return /^[=+\-@]/.test(v) ? "'" + v : v; }

  function proximaOrdem(itensLinhas, pessoa) {
    var max = 0;
    itensLinhas.forEach(function (i) { if (i.pessoa === pessoa && +i.ordem > max) max = +i.ordem; });
    return max + 1;
  }

  function validarMarcacao(pendencias, id, status, quem) {
    if (STATUS_VALIDOS.indexOf(status) < 0) return { ok: false, erro: "status" };
    if (QUEM_VALIDOS.indexOf(quem) < 0) return { ok: false, erro: "quem" };
    var alvo = texto(id);
    if (!alvo) return { ok: false, erro: "id" };
    for (var i = 0; i < pendencias.length; i++) {
      if (pendencias[i].id === alvo) return { ok: true, indice: i };
    }
    return { ok: false, erro: "id" };
  }

  return {
    QUEM_VALIDOS: QUEM_VALIDOS,
    linhaParaObjeto: linhaParaObjeto, linhasParaObjetos: linhasParaObjetos,
    normalizarData: normalizarData, montarPublico: montarPublico,
    montarPrivado: montarPrivado, validarMarcacao: validarMarcacao,
    lerPessoas: lerPessoas, montarPessoal: montarPessoal, validarGravacao: validarGravacao, proximaOrdem: proximaOrdem, protegerTexto: protegerTexto
  };
})();
