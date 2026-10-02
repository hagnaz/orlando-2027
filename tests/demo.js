// Dados do modo ?demo=1. Público vem do seed (sem nada sensível); privado é FICTÍCIO. Código: demo
var DEMO = {
  publico: L.montarPublico({
    roteiro: SEED_PUBLICO.roteiro, pendencias: SEED_PUBLICO.pendencias,
    reservas: [["ordem"]], config: SEED_PUBLICO.config
  }, new Date().toISOString()),
  privado: {
    ok: true,
    reservas: [
      { ordem: "1", tipo: "voo", titulo: "Voo de ida (exemplo)", quando: "dom 10/01 · 04:13 → 13:35", codigo: "ABC123", detalhes: "Dados fictícios do modo demonstração.", endereco: "", link: "" },
      { ordem: "2", tipo: "hospedagem", titulo: "Casa (exemplo)", quando: "check-in 10/01 15:00", codigo: "XYZ789", detalhes: "Endereço fictício.", endereco: "Walt Disney World, FL", link: "https://example.com/" },
      { ordem: "3", tipo: "carro", titulo: "Minivan (exemplo)", quando: "10/01 a 26/01", codigo: "", detalhes: "Sem código ainda.", endereco: "", link: "" }
    ],
    contatos: [{ nome: "exemplo", valor: "0000 0000" }]
  }
};
