# Orlando 2027

Site da viagem do grupo (10 a 26/01/2027): **Hoje**, **Roteiro**, **Pendências** e **Reservas 🔒**.
Página estática no GitHub Pages; todo o conteúdo vem da planilha **Orlando 2027 - Site** (Drive do Vinicius) via Google Apps Script.

**Este repositório não tem nenhum dado da viagem.** Localizadores, bilhetes, endereço e contatos ficam só na planilha e só saem com o código do grupo.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html`, `style.css`, `app.js` | Casca e telas (celular e PC) |
| `logica.js` | Lógica pura do site (datas, ordenação) |
| `api.js` | Chamadas ao Apps Script, cache offline, código e "quem sou eu" |
| `apps-script/Codigo.js`, `Logica.js`, `Seed.js` | Código do Apps Script e dados públicos iniciais |
| `apps-script/*.local.js` | Dados privados iniciais (fora do git) |
| `tests/testes.html` | Testes da lógica (abrir via servidor local) |
| `tests/celular.html` | Visualização em 400px com dados de demonstração |

## Editar o conteúdo

Tudo pela planilha **Orlando 2027 - Site**:

- `roteiro`: uma linha por dia. `tipo` = parque, descanso, viagem ou livre. Em `horarios`, um item por linha começando com a hora (`08:00 abertura`).
- `pendencias`: `id` único (p22, p23...), `responsavel` = Vinicius, Daniel ou Ambos, `prazo` em AAAA-MM-DD ou DD/MM/AAAA, `status` = aberta ou feita.
- `reservas` (privada): `ordem` define a posição; `codigo` ganha botão de copiar; `endereco` ganha link do Maps.
- `config`: `marcos` no formato `AAAA-MM-DD;texto|AAAA-MM-DD;texto`; `codigo_grupo` é o código das reservas; linhas `contato_*` aparecem como contatos (privados).

- `pessoas` (privada): `pessoa`, `codigo` (código pessoal), `ve` (quem a pessoa enxerga, separado por vírgula). Trocar o código de alguém = editar esta coluna.
- `itens`: checklist de cada pessoa (`feito` = sim ou vazio). Pode editar à mão.
- `notas`: uma nota por pessoa.
- Para desligar o código do grupo depois que todos tiverem o código pessoal, apague a linha `codigo_grupo` da aba `config`.

**Nunca** coloque código de reserva, bilhete, endereço ou telefone nas abas `roteiro` e `pendencias`: elas são públicas.

## Publicar o Apps Script (uma vez)

1. https://script.google.com → **Novo projeto** → nome "Orlando 2027 - Site".
2. Apague o conteúdo de `Código.gs` e cole **inteiro** o arquivo local `apps-script/COLAR-NO-APPS-SCRIPT.local.js` (gerado juntando Logica, Seed, SeedPessoal, SeedPrivado.local, SeedCodigos.local e Codigo). Salvar. Para a área pessoal, rode também `configurarPessoal`.
3. No menu de funções escolha **configurar** → **Executar** → autorizar. O registro mostra o link da planilha criada.
4. **Implantar → Nova implantação → App da Web**. Executar como: **Eu**. Quem pode acessar: **Qualquer pessoa**. Implantar e copiar a URL que termina em `/exec`.
5. A URL entra em `api.js` no lugar de `__APPS_SCRIPT_URL__`.

Ao mudar o código do Apps Script depois: **Implantar → Gerenciar implantações → editar → Nova versão** (a URL continua a mesma).

## Testar localmente

```
python -m http.server 8765 --bind 127.0.0.1
```

- Testes: http://127.0.0.1:8765/tests/testes.html
- Demonstração: http://127.0.0.1:8765/index.html?demo=1 (código das reservas no demo: `demo`)
- Simular um dia: acrescente `&hoje=2027-01-14`
