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
