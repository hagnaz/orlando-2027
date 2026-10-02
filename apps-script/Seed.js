/**
 * Dados PÚBLICOS iniciais da planilha. Usados só por configurar() na primeira vez.
 * Regra: nada de localizador, bilhete, código de reserva, endereço, telefone ou e-mail aqui.
 * Dados privados ficam em SeedPrivado.local.js (fora do git).
 * No Apps Script: arquivo "Seed".
 */
var SEED_PUBLICO = {
  roteiro: [
    ["data", "titulo", "tipo", "horarios", "notas", "restaurante"],
    ["2027-01-10", "Chegada", "viagem",
      "04:13 voo sai de GRU\n10:13 escala em Punta Cana\n13:35 chega em Sanford (SFB)\n15:00 check-in na casa",
      "Sair de casa na noite de sábado (09/01). Em SFB: imigração, retirar a minivan, mercado no caminho.", ""],
    ["2027-01-11", "Animal Kingdom", "parque", "", "Início leve. Rope drop no Kilimanjaro Safaris.", ""],
    ["2027-01-12", "Epic Universe", "parque", "", "Nintendo Land, Ministry of Magic, Isle of Berk (Valen).", ""],
    ["2027-01-13", "Descanso", "descanso", "", "Casa, piscina, mercado.", ""],
    ["2027-01-14", "Islands of Adventure", "parque", "", "Hogsmeade (prioridade da Bia), Hagrid, VelociCoaster.", ""],
    ["2027-01-15", "Universal Studios Florida", "parque", "", "Hogwarts Express fecha o arco Hogsmeade → Beco Diagonal.", ""],
    ["2027-01-16", "Disney Springs + CityWalk", "livre", "", "Fim de semana do feriadão: sem parque. Grupo escolhe no dia.", ""],
    ["2027-01-17", "Outlet x ICON Park", "livre", "", "Dia dividido: outlet (Vinicius/Aline) e ICON Park ou descanso (Daniel, Cris, Bia, Valen).", ""],
    ["2027-01-18", "Descanso (MLK Day)", "descanso", "", "Feriado nos EUA: casa e piscina, sem deslocamento.", ""],
    ["2027-01-19", "Hollywood Studios", "parque", "", "Lightning Lane Multi Pass.", ""],
    ["2027-01-20", "EPCOT", "parque", "", "World Showcase. Festival of the Arts.", ""],
    ["2027-01-21", "Descanso", "descanso", "", "Casa, piscina, mercado e lavanderia.", ""],
    ["2027-01-22", "Magic Kingdom", "parque", "", "Fecha os 7 parques. Fogos de encerramento.", "Café da manhã no Cinderella's Royal Table (reserva abre ~23/11)"],
    ["2027-01-23", "Busch Gardens Tampa", "parque", "", "1h15 a 1h30 de estrada por trecho.", ""],
    ["2027-01-24", "Descanso / buffer", "descanso", "", "Malas, última compra, piscina. Reserva para remarcar parque se chover.", ""],
    ["2027-01-25", "Dia livre / checkout", "livre", "11:00 checkout da casa",
      "Noite de 25 para 26 ainda a definir: estender a casa ou hotel perto de SFB.", ""],
    ["2027-01-26", "Partida", "viagem",
      "12:55 voo sai de SFB\n16:40 escala em Punta Cana\n02:50 (27/01) chega em GRU",
      "Devolver a minivan em SFB antes do voo. Malas despachadas na volta.", ""]
  ],
  pendencias: [
    ["id", "item", "responsavel", "prazo", "status", "feita_por", "feita_em"],
    ["p01", "Comprar as passagens", "Ambos", "", "feita", "Vinicius", "2026-10-01"],
    ["p02", "Visto americano da família do Daniel", "Daniel", "", "feita", "Daniel", "2026-10-02"],
    ["p03", "Documento de viagem da Bia", "Daniel", "", "feita", "Daniel", "2026-10-02"],
    ["p04", "Receber resposta da anfitriã (cozinha, extensão até 26/01)", "Vinicius", "2026-10-09", "aberta", "", ""],
    ["p05", "Ajustar número de hóspedes na reserva da casa (está 7, somos 6)", "Vinicius", "2026-10-15", "aberta", "", ""],
    ["p06", "Votar a opção de roteiro (A, B ou C)", "Ambos", "2026-10-20", "aberta", "", ""],
    ["p07", "Reservar a minivan em SFB", "Daniel", "2026-10-31", "aberta", "", ""],
    ["p08", "Ver se o cartão do Daniel cobre o seguro LDW do carro", "Daniel", "2026-10-31", "aberta", "", ""],
    ["p09", "Comprar bagagem na Arajet (volta: 1 mala de 23 kg por pessoa)", "Ambos", "2026-11-15", "aberta", "", ""],
    ["p10", "Reservar o Cinderella's Royal Table", "Vinicius", "2026-11-23", "aberta", "", ""],
    ["p11", "Confirmar com a Arajet o trânsito em Punta Cana", "Vinicius", "2026-11-30", "aberta", "", ""],
    ["p12", "Comprar ingressos dos parques", "Ambos", "2026-11-30", "aberta", "", ""],
    ["p13", "Resolver a noite de 25 para 26/01", "Vinicius", "2026-12-11", "aberta", "", ""],
    ["p14", "Contratar seguro viagem", "Ambos", "2026-12-15", "aberta", "", ""],
    ["p15", "Decidir Lightning Lane e Express Pass", "Ambos", "2026-12-15", "aberta", "", ""],
    ["p16", "Pedágio: SunPass ou pacote da locadora", "Daniel", "2026-12-31", "aberta", "", ""],
    ["p17", "Combinar a divisão dos gastos comuns", "Ambos", "2026-12-31", "aberta", "", ""],
    ["p18", "Roteiro hora a hora por parque", "Vinicius", "2026-12-31", "aberta", "", ""],
    ["p19", "Receitas em inglês dos remédios de uso contínuo", "Ambos", "2027-01-05", "aberta", "", ""],
    ["p20", "eSIM ou chip americano", "Ambos", "2027-01-05", "aberta", "", ""],
    ["p21", "Adaptador de tomada", "Ambos", "2027-01-05", "aberta", "", ""]
  ],
  config: [
    ["chave", "valor"],
    ["inicio", "2027-01-10"],
    ["fim", "2027-01-26"],
    ["marcos", "2026-10-31;Prazo para reservar a minivan|2026-11-23;Abre a reserva do Cinderella's Royal Table|2026-12-11;Último dia de cancelamento grátis da casa|2027-01-09;Sair de casa à noite (voo 04:13 de GRU)"]
  ]
};
