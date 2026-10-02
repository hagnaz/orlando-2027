# Site da Viagem Orlando 2027: Design

Data: 02/10/2026
Status: aprovado em conversa, aguardando revisão da spec escrita

## Objetivo

Um site único para o grupo (Vinicius, Aline, Daniel, Cris, Bia, Valen) que serve a dois momentos:

1. **Planejamento (até 09/01/2027):** acompanhar pendências com responsável e prazo, consultar reservas, ver o roteiro tomando forma.
2. **Viagem (10 a 26/01/2027):** guia de bolso no celular com o dia de hoje, reservas, códigos e contatos, funcionando mesmo com internet ruim nos parques.

Fora do escopo da v1: divisão de custos, votação de roteiro, edição de conteúdo pelo site (além de marcar pendência), login individual.

## Decisões tomadas

| Decisão | Escolha | Motivo |
|---|---|---|
| Hospedagem | GitHub Pages (repo novo `hagnaz/orlando-2027`) + Google Apps Script + Google Sheets | Mesmo padrão do `orlando-enquete`, já validado com o grupo; sem servidor |
| Proteção | Opção B: roteiro e pendências públicos; reservas e contatos atrás de um código do grupo | Escolha do Vinicius |
| Edição | Conteúdo editado direto na planilha; no site só se marca pendência como feita | Menos código, planilha editável por Vinicius, Daniel ou Claude |
| Offline | Cache da última resposta no `localStorage` | Internet ruim dentro dos parques |
| Dispositivos | Mobile first, responsivo para PC/tablet | Uso principal no celular durante a viagem |

## Regras de privacidade (consequência da opção B)

- **O repositório e o HTML não contêm nenhum dado da viagem.** Todo conteúdo vem da planilha via Apps Script.
- **Abas públicas (`roteiro`, `pendencias`)** usam apenas apelidos (Vinicius, Aline, Dani, Cris, Bia, Valen) e nomes de lugares públicos (parques, restaurantes, aeroportos). Proibido nelas: localizador, número de bilhete, código de reserva, endereço da hospedagem, telefone, e-mail, documento, dados de cartão.
- **Abas privadas (`reservas`, contatos em `config`)** só saem do Apps Script quando a requisição traz o código do grupo correto.
- O código do grupo fica só na aba `config` e nunca é devolvido em nenhuma resposta.
- Verificação obrigatória antes de entregar: inspecionar a resposta JSON pública do Apps Script (não só a tela) e confirmar que nada sensível aparece.

## Arquitetura

```
Celular/PC ──fetch──> Apps Script (web app, "qualquer pessoa") ──> Planilha "Orlando 2027 - Site"
   │                        │
   └─ localStorage           └─ confere código p/ ação "privado"
      (cache + código + "quem sou eu")
```

### Planilha "Orlando 2027 - Site"

| Aba | Colunas | Acesso |
|---|---|---|
| `roteiro` | `data` (AAAA-MM-DD), `titulo`, `tipo` (parque, descanso, viagem, livre), `horarios` (texto livre, uma linha por item), `notas`, `restaurante` | público |
| `pendencias` | `id`, `item`, `responsavel` (Vinicius, Daniel, Ambos), `prazo` (AAAA-MM-DD, opcional), `status` (aberta, feita), `feita_por`, `feita_em` | público; status alterável pelo site |
| `reservas` | `ordem`, `tipo` (voo, hospedagem, carro, restaurante, ingresso, outro), `titulo`, `quando`, `codigo`, `detalhes`, `endereco`, `link` | privado |
| `config` | pares `chave`/`valor`: `codigo_grupo`, `inicio` (2027-01-10), `fim` (2027-01-26), `marcos` (lista de "data;texto"), `contato_*` | `codigo_grupo` nunca sai; `marcos` público; `contato_*` privado |

### API do Apps Script

Todas as chamadas via `GET` (leitura) e `POST` com corpo texto/JSON (escrita), sem cabeçalhos customizados, para evitar preflight de CORS (mesma técnica da enquete).

| Ação | Entrada | Saída |
|---|---|---|
| `publico` | nada | `{ok, atualizadoEm, roteiro[], pendencias[], marcos[], inicio, fim}` |
| `privado` | `codigo` | `{ok, reservas[], contatos[]}` ou `{ok:false, erro:"codigo"}` |
| `marcar` | `id`, `status` (feita/aberta), `quem` | `{ok, pendencia}` ou `{ok:false, erro}` |

Regras:
- Linhas com campo obrigatório vazio (`data` no roteiro, `id`/`item` nas pendências, `titulo` nas reservas) são ignoradas, sem quebrar a resposta.
- `marcar` só aceita `quem` dentro da lista Vinicius, Aline, Daniel, Cris, Bia, Valen, e só altera `status`, `feita_por`, `feita_em`.
- Comparação do código sem diferenciar maiúsculas e ignorando espaços nas pontas.

## Telas

Navegação: barra fixa embaixo no celular; menu lateral no PC (largura acima de ~700px). Conteúdo com largura máxima de ~1100px.

1. **Hoje** (padrão)
   - Antes de 10/01: contagem regressiva, 3 pendências abertas com prazo mais próximo, próximo marco de `config.marcos`.
   - De 10 a 26/01: "Dia N: título", horários, notas e restaurante do dia, prévia de amanhã.
   - Depois de 26/01: mensagem de encerramento e link para o roteiro.
   - PC: duas colunas (dia | pendências e marcos).
2. **Roteiro**: cartões dos dias 10 a 26/01 com data, título e ícone do tipo; dia atual destacado e rolado até ele; toque abre detalhes. PC: grade de 2 a 3 colunas.
3. **Pendências**: "Abertas" (ordenadas por prazo, prazo vencido em vermelho) e "Feitas" (com quem e quando). Toque alterna o status; na primeira vez pergunta "quem é você?" e guarda no aparelho. PC: abertas e feitas lado a lado.
4. **Reservas 🔒**: pede o código uma vez e guarda no aparelho; cartões por tipo; botão "copiar" no código; botão "abrir no Maps" no endereço; contatos ao final; botão "sair" que apaga o código salvo. PC: grade de cartões.

Visual: tema claro/escuro seguindo o sistema, fonte legível em movimento, sem framework (HTML + CSS + JS puros), datas em pt-BR, fuso de referência America/New_York durante a viagem.

## Tratamento de erros

| Situação | Comportamento |
|---|---|
| Sem internet, com cache | Mostra cache com faixa "sem conexão, dados de [data/hora]" |
| Sem internet, sem cache | "Conecte-se uma vez para baixar o roteiro" |
| Apps Script lento/fora | Timeout de 10s, cai para o cache, botão "tentar de novo" |
| Código errado | "Código incorreto", nenhum dado exibido, nada salvo |
| Marcar pendência falhou | Item volta ao estado anterior, aviso "não deu para salvar, tente com internet" |
| Linha mal preenchida na planilha | Ignorada silenciosamente pelo Apps Script |

## Testes

- **Apps Script:** funções `teste*` no editor: `publico` retorna dados e não contém chaves privadas; `privado` com código certo e errado; `marcar` em pendência de teste, ida e volta; `quem` inválido rejeitado.
- **Site, ponta a ponta** (Claude in Chrome, URL publicada), em largura de celular e de PC: cada aba renderiza; código errado e certo; marcar pendência e conferir na planilha; cache offline (simular falha de rede).
- **Privacidade:** inspecionar o JSON de `publico` com os dados reais carregados e procurar localizadores, bilhetes, endereço e telefones.
- **Dados reais iniciais:** voos, Airbnb, cotação da minivan, pendências levantadas em 02/10/2026 e calendário macro da vault.

## Entrega

1. Repo `hagnaz/orlando-2027` no GitHub, Pages ativo em `https://hagnaz.github.io/orlando-2027/`.
2. Planilha "Orlando 2027 - Site" no Drive do Vinicius.
3. Apps Script publicado como web app (passo manual do Vinicius: publicar e autorizar, como na enquete).
4. README com o passo a passo de publicação e de edição da planilha.
5. Link enviado ao grupo "Disney 2027" pelo próprio Vinicius.
