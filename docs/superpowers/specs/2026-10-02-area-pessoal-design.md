# Área pessoal no site Orlando 2027: design

Data: 02/10/2026. Pedido do Vinicius: tornar o site o lugar central da viagem, com uma área para cada pessoa.

## Objetivo

Cada uma das 6 pessoas (Vinicius, Aline, Daniel, Cris, Bia, Valen) abre o site no celular, entra com um código pessoal, vê um checklist já montado para ela, marca o que fez, acrescenta itens e escreve notas. Usado antes da viagem e em Orlando.

## Decisões (aprovadas em conversa)

| Tema | Decisão |
|---|---|
| Quem tem área | As 6 pessoas |
| Visibilidade | Vinicius ↔ Aline. Daniel ↔ Cris; Daniel e Cris veem Bia e Valen. Bia e Valen veem só a própria |
| Edição | Cada pessoa edita só a própria área. Ver a área de outra pessoa é só leitura |
| Offline | Opção B: lê a última versão salva; editar exige internet (botões desabilitados offline) |
| Checklist inicial | Pré-montado por pessoa a partir de um modelo, revisado pelo Vinicius antes de carregar |
| Abordagem | Estender o site atual (planilha + Apps Script + GitHub Pages) |
| Acesso | Código pessoal por pessoa abre a área restrita do grupo e a área pessoal; substitui o código do grupo |

O dono da planilha (Vinicius) vê tudo pela planilha; isso será dito ao grupo. Nada sensível de verdade (senha, cartão) deve ir para as notas.

## Planilha

Três abas novas, todas em texto puro (`@`):

- `pessoas`: `pessoa`, `codigo`, `ve` (lista separada por vírgula, ex.: `Daniel, Bia, Valen`).
- `itens`: `id`, `pessoa`, `categoria`, `texto`, `feito` (`sim` ou vazio), `ordem`.
- `notas`: `pessoa`, `texto`, `salvo_em` (`AAAA-MM-DD HH:mm`, fuso de São Paulo).

`config.codigo_grupo` continua aceito durante a migração. Quando a linha for apagada, deixa de funcionar.

## Apps Script

Leitura (`doGet`):

- `acao=pessoal&codigo=X`: valida X contra `pessoas.codigo` (sem diferenciar maiúsculas, sem espaços nas pontas). Devolve `{ ok, eu, reservas, contatos, areas: [{ pessoa, editavel, itens, nota }] }`, com a área própria primeiro e depois as de `ve` na ordem da lista. Código desconhecido: `{ ok:false, erro:"codigo" }`.
- `acao=privado&codigo=<codigo_grupo>` continua funcionando como hoje enquanto `codigo_grupo` existir.

Gravação (`doPost`, corpo JSON em `text/plain`), todas com `codigo` e sempre sobre a área do dono do código:

- `item_marcar { id, feito }`
- `item_novo { categoria, texto }`: gera id `i` + timestamp, `ordem` no fim da categoria.
- `item_apagar { id }`
- `nota_salvar { texto }`

Regras no servidor (lógica pura em `Logica.js`, testável):

- O id de item precisa pertencer à pessoa do código; senão `{ ok:false, erro:"permissao" }`.
- Texto de item: 1 a 200 caracteres; nota: até 5.000 caracteres; categoria: até 40.
- Toda gravação usa `LockService` como `marcar_` já faz.
- `ve` só afeta leitura; nunca dá permissão de escrita.

Setup único: `configurarPessoal()` cria as 3 abas se não existirem, preenche `pessoas` e carrega o checklist inicial. Códigos pessoais e o checklist ficam em `apps-script/SeedPessoal.local.js` (fora do git).

## Site

- A aba "Reservas 🔒" vira "Área restrita 🔒". Pede o código pessoal; aceita também o código do grupo durante a migração (nesse caso mostra só a parte do grupo, com um aviso).
- Com código pessoal: sub-abas "Grupo" (reservas e contatos), "Minha área" e uma por pessoa visível; abre em "Minha área".
- Checklist agrupado por categoria com contagem (`Documentos 3/5`). Marcar, acrescentar (campo + categoria) e apagar só na área própria.
- Nota: caixa de texto, botão Salvar, "salvo às HH:mm".
- O código pessoal define "quem sou eu"; a pergunta "quem é você" das pendências deixa de aparecer para quem entrou.
- Cache: a resposta de `acao=pessoal` vai para o `localStorage` como hoje. Offline: mostra o cache com "offline, salvo às HH:mm" e desabilita edição.
- Erro ao gravar: desfaz a mudança na tela e mostra "não salvou, tente de novo". `erro:"codigo"`: esquece o código e pede de novo.
- Demo (`?demo=1`) ganha dados pessoais fictícios, código `demo`.

## Testes

- `tests/testes.js`: visibilidade (cada uma das 6 pessoas vê exatamente quem deveria), escrita negada em item de outra pessoa, código errado, validação de tamanhos, compatibilidade do código do grupo.
- Visual: `tests/celular.html` em 400 px com a área pessoal.
- Real: código de teste numa linha temporária de `pessoas`, ida e volta de marcar/acrescentar/apagar/nota no site publicado, depois apagar a linha.

## Migração

1. Rodar `configurarPessoal()` e publicar nova versão do Apps Script (mesma URL).
2. Push do site (Vinicius).
3. Vinicius distribui os códigos pessoais (mensagem individual).
4. Quando todos tiverem entrado, apagar `codigo_grupo` da planilha.

## Checklist inicial (rascunho para revisão)

Comum a todos:

- Documentos: passaporte (validade ok) · visto americano · cópia do passaporte e visto no celular · cartão de embarque/localizador no celular
- Saúde: remédios de uso contínuo pra 17 dias · kit básico (analgésico, antialérgico, curativo) · protetor solar
- Eletrônicos: carregador · power bank · adaptador de tomada · eSIM ou chip ativado
- Parques: app My Disney Experience com ingresso vinculado · app Universal com ingresso vinculado · capa de chuva · tênis confortável já usado
- Mala: roupas pra 16 dias (lavadora na casa) · casaco leve (manhãs de janeiro ~10 °C) · roupa de banho · necessaire
- Dinheiro: cartão internacional ou conta global · um pouco de dólar em espécie

Só para alguns:

- Vinicius: receita do Mounjaro em inglês · Mounjaro com bolsa térmica · US$ 110 em espécie pro Hector · voucher Care Plus Travel (a partir de 05/01)
- Aline: voucher Care Plus Travel (a partir de 05/01)
- Daniel: CNH física dentro da validade (motorista da minivan; PID opcional) · cartão de crédito da locadora · seguro viagem da família
- Cris: seguro viagem da família (cópia)
- Bia: autorização de viagem com firma reconhecida (original e cópia)
- Valen: só a lista comum, sem itens extras; a Cris acompanha pela visualização (só leitura)

## Fora do escopo

Gastos pessoais, lista de compras, diário, edição offline, recuperação de código pelo site (o código é trocado na planilha).
