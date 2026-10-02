// ---------- Fixtures ----------
function abasFixture() {
  return {
    roteiro: [
      ["data", "titulo", "tipo", "horarios", "notas", "restaurante"],
      ["2027-01-12", "Epic Universe", "parque", "08:00 abertura", "", ""],
      ["", "sem data", "livre", "", "", ""],
      ["2027-01-11", "Animal Kingdom", "parque", "", "Safari cedo", ""],
      ["", "", "", "", "", ""]
    ],
    pendencias: [
      ["id", "item", "responsavel", "prazo", "status", "feita_por", "feita_em"],
      ["p1", "Comprar bagagem", "Ambos", "2026-11-01", "aberta", "", ""],
      ["", "sem id", "Daniel", "", "aberta", "", ""],
      ["p2", "", "Daniel", "", "aberta", "", ""],
      ["p3", "Seguro viagem", "Vinicius", "", "feita", "Vinicius", "2026-10-02 10:00"]
    ],
    reservas: [
      ["ordem", "tipo", "titulo", "quando", "codigo", "detalhes", "endereco", "link"],
      ["2", "hospedagem", "Airbnb", "10/01 15:00", "ABC123", "", "Rua X", ""],
      ["1", "voo", "Voo de ida", "10/01 04:13", "XYZ999", "", "", ""],
      ["3", "carro", "", "", "SEMTITULO", "", "", ""]
    ],
    config: [
      ["chave", "valor"],
      ["codigo_grupo", "Orlando2027"],
      ["inicio", "2027-01-10"],
      ["fim", "2027-01-26"],
      ["marcos", "2026-11-23;Abre reserva Cinderella|2026-12-11;Limite cancelamento Airbnb"],
      ["contato_expedia", "11 0000 0000"],
      ["contato_seguro_viagem", "0800 000"]
    ]
  };
}

// ---------- Servidor (L) ----------
teste("L.linhasParaObjetos usa cabeçalho e descarta linha vazia", function () {
  igual(L.linhasParaObjetos([["a", "b"], ["1", "2"], ["", ""], ["3", ""]]),
    [{ a: "1", b: "2" }, { a: "3", b: "" }]);
});

teste("L.linhasParaObjetos com só cabeçalho ou nada", function () {
  igual(L.linhasParaObjetos([["a"]]), []);
  igual(L.linhasParaObjetos([]), []);
});

teste("L.montarPublico filtra e ordena roteiro por data", function () {
  var r = L.montarPublico(abasFixture(), "2026-10-02T10:00:00Z");
  igual(r.ok, true);
  igual(r.roteiro.map(function (d) { return d.data; }), ["2027-01-11", "2027-01-12"]);
});

teste("L.montarPublico ignora pendência sem id ou item", function () {
  var r = L.montarPublico(abasFixture(), "x");
  igual(r.pendencias.map(function (p) { return p.id; }), ["p1", "p3"]);
});

teste("L.montarPublico traz marcos, inicio, fim e atualizadoEm", function () {
  var r = L.montarPublico(abasFixture(), "2026-10-02T10:00:00Z");
  igual(r.marcos, [
    { data: "2026-11-23", texto: "Abre reserva Cinderella" },
    { data: "2026-12-11", texto: "Limite cancelamento Airbnb" }
  ]);
  igual([r.inicio, r.fim, r.atualizadoEm], ["2027-01-10", "2027-01-26", "2026-10-02T10:00:00Z"]);
});

teste("L.montarPublico não vaza nada privado", function () {
  var txt = JSON.stringify(L.montarPublico(abasFixture(), "x"));
  ["Orlando2027", "codigo_grupo", "ABC123", "XYZ999", "4700", "contato", "reservas"].forEach(function (s) {
    verdade(txt.indexOf(s) === -1, "vazou: " + s);
  });
});

teste("L.montarPrivado com código certo (espaços e caixa diferentes)", function () {
  var r = L.montarPrivado(abasFixture(), "  orlando2027 ");
  igual(r.ok, true);
  igual(r.reservas.map(function (x) { return x.titulo; }), ["Voo de ida", "Airbnb"]);
  igual(r.contatos, [
    { nome: "expedia", valor: "11 0000 0000" },
    { nome: "seguro viagem", valor: "0800 000" }
  ]);
});

teste("L.montarPrivado com código errado não devolve dados", function () {
  var r = L.montarPrivado(abasFixture(), "errado");
  igual(r, { ok: false, erro: "codigo" });
});

teste("L.montarPrivado nunca libera se código da config estiver vazio", function () {
  var abas = abasFixture();
  abas.config[1][1] = "";
  igual(L.montarPrivado(abas, ""), { ok: false, erro: "codigo" });
  igual(L.montarPrivado(abas, undefined), { ok: false, erro: "codigo" });
});

teste("L.validarMarcacao aceita caso válido", function () {
  var pend = L.linhasParaObjetos(abasFixture().pendencias);
  igual(L.validarMarcacao(pend, "p3", "aberta", "Aline"), { ok: true, indice: 3 });
});

teste("L.validarMarcacao rejeita id, status e quem inválidos", function () {
  var pend = L.linhasParaObjetos(abasFixture().pendencias);
  igual(L.validarMarcacao(pend, "nao-existe", "feita", "Aline").ok, false);
  igual(L.validarMarcacao(pend, "p1", "talvez", "Aline").ok, false);
  igual(L.validarMarcacao(pend, "p1", "feita", "Hacker").ok, false);
  igual(L.validarMarcacao(pend, "", "feita", "Aline").ok, false);
});

// ---------- Site (S) ----------
teste("S.estadoViagem antes, durante e depois", function () {
  igual(S.estadoViagem("2026-10-02", "2027-01-10", "2027-01-26"), "antes");
  igual(S.estadoViagem("2027-01-10", "2027-01-10", "2027-01-26"), "durante");
  igual(S.estadoViagem("2027-01-26", "2027-01-10", "2027-01-26"), "durante");
  igual(S.estadoViagem("2027-01-27", "2027-01-10", "2027-01-26"), "depois");
});

teste("S.diaDaViagem e S.diasAte", function () {
  igual(S.diaDaViagem("2027-01-10", "2027-01-10"), 1);
  igual(S.diaDaViagem("2027-01-11", "2027-01-10"), 2);
  igual(S.diasAte("2026-10-02", "2027-01-10"), 100);
  igual(S.diasAte("2027-01-10", "2027-01-10"), 0);
});

teste("S.ordenarPendencias separa e ordena por prazo, sem prazo no fim", function () {
  var r = S.ordenarPendencias([
    { id: "a", status: "aberta", prazo: "" },
    { id: "b", status: "aberta", prazo: "2026-12-01" },
    { id: "c", status: "feita", prazo: "2026-10-05" },
    { id: "d", status: "aberta", prazo: "2026-10-20" }
  ]);
  igual(r.abertas.map(function (p) { return p.id; }), ["d", "b", "a"]);
  igual(r.feitas.map(function (p) { return p.id; }), ["c"]);
});

teste("S.proximoMarco ignora passados e pega o mais próximo", function () {
  var m = [{ data: "2026-12-11", texto: "B" }, { data: "2026-09-01", texto: "velho" }, { data: "2026-11-23", texto: "A" }];
  igual(S.proximoMarco(m, "2026-10-02"), { data: "2026-11-23", texto: "A" });
  igual(S.proximoMarco(m, "2026-11-23"), { data: "2026-11-23", texto: "A" });
  igual(S.proximoMarco(m, "2027-01-01"), null);
});

teste("S.formatarData em pt-BR", function () {
  igual(S.formatarData("2027-01-11"), "seg, 11/01");
  igual(S.formatarData("2027-01-10"), "dom, 10/01");
  igual(S.formatarData(""), "");
});

teste("S.hojeIso respeita o fuso informado", function () {
  // 2027-01-11 02:00 UTC = 2027-01-10 21:00 em Orlando
  igual(S.hojeIso(new Date("2027-01-11T02:00:00Z"), "America/New_York"), "2027-01-10");
});

// ---------- Seed real ----------
teste("Seed público não contém nenhum valor do seed privado", function () {
  if (typeof SEED_PUBLICO === "undefined") throw new Error("Seed.js não carregado");
  // SeedPrivado.local.js só existe na máquina do Vinicius (fora do git); sem ele o teste não tem o que comparar
  if (typeof SEED_PRIVADO === "undefined") return;
  var txt = JSON.stringify(SEED_PUBLICO);
  var segredos = [];
  SEED_PRIVADO.reservas.slice(1).forEach(function (r) {
    if (r[4]) segredos.push(r[4]);            // codigo
    if (r[6]) segredos.push(r[6]);            // endereco
    (r[5].match(/\d{8,}/g) || []).forEach(function (n) { segredos.push(n); }); // bilhetes, itinerário
  });
  SEED_PRIVADO.config.forEach(function (c) { if (c[0] === "codigo_grupo") segredos.push(c[1]); });
  verdade(segredos.length >= 5, "seed privado sem segredos para comparar");
  segredos.forEach(function (sg) { verdade(txt.indexOf(sg) === -1, "seed público contém um valor privado"); });
  ["@", "+55"].forEach(function (sg) { verdade(txt.indexOf(sg) === -1, "seed público contém " + sg); });
});

teste("Seed público gera 17 dias de roteiro válidos", function () {
  var r = L.montarPublico({
    roteiro: SEED_PUBLICO.roteiro, pendencias: SEED_PUBLICO.pendencias,
    reservas: [["ordem"]], config: SEED_PUBLICO.config
  }, "x");
  igual(r.roteiro.length, 17);
  igual(r.roteiro[0].data, "2027-01-10");
  igual(r.roteiro[16].data, "2027-01-26");
  verdade(r.pendencias.length >= 5, "poucas pendências");
});

teste("L.normalizarData aceita AAAA-MM-DD e DD/MM/AAAA", function () {
  igual(L.normalizarData("2027-01-11"), "2027-01-11");
  igual(L.normalizarData("11/01/2027"), "2027-01-11");
  igual(L.normalizarData("1/2/2027"), "2027-02-01");
  igual(L.normalizarData(" "), "");
  igual(L.normalizarData("lixo"), "");
});

teste("L.montarPublico normaliza datas vindas da planilha em pt-BR", function () {
  var abas = abasFixture();
  abas.roteiro[1][0] = "12/01/2027";
  abas.pendencias[1][3] = "01/11/2026";
  var r = L.montarPublico(abas, "x");
  igual(r.roteiro[1].data, "2027-01-12");
  igual(r.pendencias[0].prazo, "2026-11-01");
});
