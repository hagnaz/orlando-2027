/**
 * Detalhe do dia (aba "blocos"). Público: só roteiro, sem códigos nem reservas.
 * Piloto 22/10/2026: 13/01 (Epic Universe, dia 1), da nota "Roteiro Hora a Hora (Epic e Harry Potter)".
 * Horários são estimativas com abertura às 9h.
 */
var SEED_BLOCOS = [
  ["data", "ordem", "hora", "fim", "tipo", "titulo", "texto", "link"],
  ["2027-01-13", "1", "", "", "info", "Horários estimados", "Abertura assumida às 9h. O horário oficial sai entre o fim de novembro e dezembro: conferir no app na véspera.", ""],
  ["2027-01-13", "2", "", "", "info", "Antes de sair", "Power Up Band pareada no app. Casaco, gorro e luva (manhã perto de 9 °C). Lanche e garrafa na mochila. Hoje nada que molha.", ""],
  ["2027-01-13", "3", "", "", "info", "Ponto de encontro", "Portal de entrada do Celestial Park. Ficar parado e ligar. Bia e Valen sempre com adulto ou em dupla.", ""],
  ["2027-01-13", "10", "07:00", "", "logistica", "Sair de casa", "Café da manhã em casa. De 25 a 35 min até a garagem do Epic (conferir no Waze).", ""],
  ["2027-01-13", "11", "08:00", "", "logistica", "Portão", "A entrada com menos fila fica à direita da bilheteria. Ir para a frente da fila.", ""],
  ["2027-01-13", "12", "09:00", "09:40", "atracao", "Mario Kart: Bowser's Challenge", "Super Nintendo World primeiro, contra o fluxo de quem vai para Harry Potter. Prioridade do Daniel.", ""],
  ["2027-01-13", "13", "09:40", "10:30", "atracao", "Mine-Cart Madness e Power Up Band", "Área do Donkey Kong, no fundo. É a que mais quebra: se estiver fechada, vira prioridade de amanhã. Yoshi's só sem fila.", ""],
  ["2027-01-13", "14", "10:30", "11:30", "atracao", "Isle of Berk: Hiccup's Wing Gliders", "Prioridade da Valen. Depois Viking Training Camp e foto com dragões. Pular Dragon Racer's Rally e Fyre Drill (molha).", ""],
  ["2027-01-13", "15", "11:10", "", "show", "The Untrainable Dragon", "Sessões de referência às 11:10, 12:00 e 12:50. Chegar 20 a 30 min antes.", ""],
  ["2027-01-13", "16", "12:00", "12:45", "refeicao", "Almoço em Berk", "Spit Fyre Grill e sobremesa no Mead Hall (bread pudding). Fazer o Mobile Order ao sair do show. Alternativa: Toadstool Cafe.", ""],
  ["2027-01-13", "17", "13:00", "14:30", "atracao", "Battle at the Ministry", "Harry Potter no meio do dia, quando a fila costuma ser menor. Depois, Le Cirque Arcanus (show da Bia).", ""],
  ["2027-01-13", "18", "14:30", "15:30", "compras", "Lojas do Ministry", "Cosme Acajor (a varinha da Fênix só existe aqui), cerveja amanteigada e pontos de varinha interativa.", ""],
  ["2027-01-13", "19", "15:30", "16:30", "atracao", "Stardust Racers", "Versão de dia. Se a fila passar de 60 min, deixar para as 20:30.", ""],
  ["2027-01-13", "20", "16:30", "17:30", "pausa", "Pausa no Celestial Park", "Sentar, lanchar e beber água. Constellation Carousel no fim. É o dia mais longo da viagem.", ""],
  ["2027-01-13", "21", "17:30", "19:00", "atracao", "Dark Universe", "Monsters Unchained e Curse of the Werewolf, já no escuro.", ""],
  ["2027-01-13", "22", "18:45", "19:30", "refeicao", "Jantar", "Das Steakhouse ou lanche no Dark Universe. Mobile Order na saída da Werewolf.", ""],
  ["2027-01-13", "23", "19:30", "20:30", "atracao", "Super Nintendo World à noite", "Parque aceso. Repetir a Mine-Cart se falhou de manhã.", ""],
  ["2027-01-13", "24", "20:30", "21:15", "show", "Celestial Goodnight", "Fontes, luzes e fogos, menos de 10 min. Chegar 30 a 40 min antes perto da Cosmos Fountain, de costas para o hotel Helios.", ""],
  ["2027-01-13", "25", "21:15", "", "logistica", "Saída", "Andar cedo para o carro. Em casa por volta das 22h.", ""],
  ["2027-01-13", "30", "", "", "planob", "Mario Kart ou Mine-Cart fechados", "Ir direto para Berk e voltar ao Super Nintendo World às 19:30 ou amanhã.", ""],
  ["2027-01-13", "31", "", "", "planob", "Ministry fechado", "Le Cirque Arcanus e as lojas continuam. Battle at the Ministry vira meta de amanhã.", ""],
  ["2027-01-13", "32", "", "", "planob", "Chuva ou raio", "O Epic fecha quase tudo: lojas e restaurantes cobertos até liberar. Se o dia se perder, amanhã vira o dia 1.", ""],
  ["2027-01-13", "33", "", "", "planob", "Valen exausta", "Pular a volta ao Super Nintendo World e ir direto para o Celestial Goodnight.", ""]
];
