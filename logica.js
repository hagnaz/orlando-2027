/**
 * Lógica pura do site (sem DOM, sem rede). Testada em tests/testes.html.
 * Datas sempre como texto AAAA-MM-DD; aritmética em UTC para não sofrer com fuso.
 */
var S = (function () {
  var DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  var DIA_MS = 86400000;

  function paraUtc(iso) {
    var p = iso.split("-");
    return Date.UTC(+p[0], +p[1] - 1, +p[2]);
  }

  function diasAte(deIso, ateIso) {
    return Math.round((paraUtc(ateIso) - paraUtc(deIso)) / DIA_MS);
  }

  function estadoViagem(hojeIso, inicio, fim) {
    if (hojeIso < inicio) return "antes";
    if (hojeIso > fim) return "depois";
    return "durante";
  }

  function diaDaViagem(hojeIso, inicio) { return diasAte(inicio, hojeIso) + 1; }

  function somarDias(iso, n) {
    return new Date(paraUtc(iso) + n * DIA_MS).toISOString().slice(0, 10);
  }

  function ordenarPendencias(lista) {
    var abertas = [], feitas = [];
    lista.forEach(function (p) { (p.status === "feita" ? feitas : abertas).push(p); });
    abertas.sort(function (a, b) {
      if (!a.prazo && !b.prazo) return 0;
      if (!a.prazo) return 1;
      if (!b.prazo) return -1;
      return a.prazo < b.prazo ? -1 : a.prazo > b.prazo ? 1 : 0;
    });
    feitas.sort(function (a, b) { return (b.feita_em || "") < (a.feita_em || "") ? -1 : 1; });
    return { abertas: abertas, feitas: feitas };
  }

  function proximoMarco(marcos, hojeIso) {
    var futuros = marcos.filter(function (m) { return m.data >= hojeIso; })
      .sort(function (a, b) { return a.data < b.data ? -1 : 1; });
    return futuros.length ? futuros[0] : null;
  }

  function formatarData(iso) {
    if (!iso) return "";
    var d = new Date(paraUtc(iso));
    var p = iso.split("-");
    return DIAS[d.getUTCDay()] + ", " + p[2] + "/" + p[1];
  }

  function hojeIso(agora, fuso) {
    // en-CA formata como AAAA-MM-DD
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit"
    }).format(agora);
  }

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

  return {
    diasAte: diasAte, estadoViagem: estadoViagem, diaDaViagem: diaDaViagem,
    somarDias: somarDias, ordenarPendencias: ordenarPendencias,
    proximoMarco: proximoMarco, formatarData: formatarData, hojeIso: hojeIso,
    agruparItens: agruparItens
  };
})();
