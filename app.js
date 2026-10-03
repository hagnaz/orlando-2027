/**
 * Telas do site. Todo texto vindo da planilha entra via textContent (nunca innerHTML).
 */
(function () {
  var FUSO = "America/New_York";
  var ICONES = { parque: "🎢", descanso: "🏖️", viagem: "✈️", livre: "🛍️" };
  var ICONES_RESERVA = { voo: "✈️", hospedagem: "🏠", carro: "🚐", restaurante: "🍽️", ingresso: "🎟️", seguro: "🩺", outro: "📌" };
  var QUEM = ["Vinicius", "Aline", "Daniel", "Cris", "Bia", "Valen"];

  var estado = { publico: null, privado: null, offlineDesde: null };
  var conteudo = document.getElementById("conteudo");
  var aviso = document.getElementById("aviso");

  // ---------- utilitários ----------
  function el(tag, props, filhos) {
    var n = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      if (k === "texto") n.textContent = props[k];
      else if (k === "classe") n.className = props[k];
      else if (k.indexOf("on") === 0) n.addEventListener(k.slice(2), props[k]);
      else n.setAttribute(k, props[k]);
    });
    (filhos || []).forEach(function (f) { if (f) n.appendChild(typeof f === "string" ? document.createTextNode(f) : f); });
    return n;
  }

  function hoje() {
    var m = location.search.match(/[?&]hoje=(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : S.hojeIso(new Date(), FUSO);
  }

  function dataHora(iso) {
    try {
      return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch (e) { return iso; }
  }

  function mostrarAviso(texto, comBotao, classe) {
    aviso.textContent = "";
    aviso.className = "aviso" + (classe ? " " + classe : "");
    aviso.appendChild(el("span", { texto: texto }));
    if (comBotao) aviso.appendChild(el("button", { classe: "botao pequeno secundario", texto: "Tentar de novo", onclick: iniciar }));
    aviso.hidden = false;
  }
  function esconderAviso() { aviso.hidden = true; }

  function linhas(txt) { return (txt || "").split(/\n/).map(function (l) { return l.trim(); }).filter(Boolean); }

  function listaHorarios(txt) {
    var ls = linhas(txt);
    if (!ls.length) return null;
    return el("ul", { classe: "horarios" }, ls.map(function (l) {
      var m = l.match(/^(\d{1,2}:\d{2}(?:\s*\([^)]*\))?)\s+(.*)$/);
      return m ? el("li", null, [el("b", { texto: m[1] }), m[2]]) : el("li", { texto: l });
    }));
  }

  function blocoDia(d) {
    return [
      listaHorarios(d.horarios),
      d.notas ? el("p", { texto: d.notas }) : null,
      d.restaurante ? el("div", { classe: "restaurante" }, [el("b", { texto: "🍽️ " }), d.restaurante]) : null
    ];
  }

  function diaPorData(data) {
    var r = estado.publico.roteiro;
    for (var i = 0; i < r.length; i++) if (r[i].data === data) return r[i];
    return null;
  }

  function etiquetaPrazo(p, hojeIso) {
    if (!p.prazo) return null;
    var vencida = p.status !== "feita" && p.prazo < hojeIso;
    return el("span", { classe: "etiqueta" + (vencida ? " vencida" : ""), texto: (vencida ? "venceu " : "até ") + S.formatarData(p.prazo) });
  }

  // ---------- Hoje ----------
  function telaHoje() {
    var P = estado.publico, h = hoje();
    var situacao = S.estadoViagem(h, P.inicio, P.fim);
    var ord = S.ordenarPendencias(P.pendencias);
    var esquerda = [], direita = [];

    if (situacao === "antes") {
      var faltam = S.diasAte(h, P.inicio);
      esquerda.push(el("section", { classe: "cartao heroi" }, [
        el("div", { classe: "rotulo", texto: "Contagem regressiva" }),
        el("div", { classe: "numero", texto: String(faltam) }),
        el("p", { texto: faltam === 1 ? "dia para a viagem" : "dias para a viagem" }),
        el("p", { classe: "mudo", texto: S.formatarData(P.inicio) + " a " + S.formatarData(P.fim) + " de 2027" })
      ]));
      var marco = S.proximoMarco(P.marcos, h);
      if (marco) esquerda.push(el("section", { classe: "cartao" }, [
        el("div", { classe: "rotulo", texto: "Próximo marco" }),
        el("h2", { texto: marco.texto }),
        el("p", { classe: "mudo", texto: S.formatarData(marco.data) + " · em " + S.diasAte(h, marco.data) + " dias" })
      ]));
      var primeiro = diaPorData(P.inicio);
      if (primeiro) esquerda.push(el("section", { classe: "cartao" }, [
        el("div", { classe: "rotulo", texto: "Dia 1 · " + S.formatarData(primeiro.data) }),
        el("h2", { texto: primeiro.titulo })
      ].concat(blocoDia(primeiro))));
    } else if (situacao === "durante") {
      var dHoje = diaPorData(h), amanha = diaPorData(S.somarDias(h, 1));
      var n = S.diaDaViagem(h, P.inicio), total = S.diaDaViagem(P.fim, P.inicio);
      esquerda.push(el("section", { classe: "cartao heroi" }, [
        el("div", { classe: "rotulo", texto: "Dia " + n + " de " + total + " · " + S.formatarData(h) }),
        el("h1", { texto: dHoje ? (ICONES[dHoje.tipo] || "") + " " + dHoje.titulo : "Dia livre" })
      ]));
      if (dHoje) esquerda.push(el("section", { classe: "cartao" }, [el("div", { classe: "rotulo", texto: "Hoje" })].concat(blocoDia(dHoje))));
      if (amanha) esquerda.push(el("section", { classe: "cartao" }, [
        el("div", { classe: "rotulo", texto: "Amanhã · " + S.formatarData(amanha.data) }),
        el("h2", { texto: (ICONES[amanha.tipo] || "") + " " + amanha.titulo })
      ].concat(amanha.horarios ? [listaHorarios(amanha.horarios)] : [])));
    } else {
      esquerda.push(el("section", { classe: "cartao heroi" }, [
        el("div", { classe: "rotulo", texto: "Viagem encerrada" }),
        el("h1", { texto: "Que viagem! 🎢" }),
        el("p", { texto: "O roteiro completo continua guardado aqui." }),
        el("a", { href: "#roteiro", classe: "botao secundario", texto: "Ver o roteiro" })
      ]));
    }

    if (situacao !== "depois") {
      var top = ord.abertas.slice(0, 3);
      direita.push(el("section", { classe: "cartao" }, [
        el("div", { classe: "rotulo", texto: "Pendências mais urgentes" }),
        top.length ? el("div", null, top.map(function (p) { return itemPendencia(p, h); })) : el("p", { classe: "mudo", texto: "Nada pendente. 🎉" }),
        el("p", { classe: "mudo" }, [ord.abertas.length + " abertas · ", el("a", { href: "#pendencias", texto: "ver todas" })])
      ]));
    }
    return el("div", { classe: "colunas" }, [el("div", null, esquerda), el("div", null, direita)]);
  }

  // ---------- Roteiro ----------
  function telaRoteiro() {
    var P = estado.publico, h = hoje();
    var cartoes = P.roteiro.map(function (d) {
      var classe = "cartao dia" + (d.data === h ? " hoje" : d.data < h ? " passado" : "");
      var det = el("details", { classe: classe, id: "dia-" + d.data }, [
        el("summary", null, [
          el("span", { classe: "ico-dia", "aria-hidden": "true", texto: ICONES[d.tipo] || "📍" }),
          el("span", null, [
            el("div", { classe: "data", texto: S.formatarData(d.data) + (d.data === h ? " · hoje" : "") }),
            el("div", { classe: "titulo", texto: d.titulo })
          ]),
          el("span", { classe: "num", texto: "dia " + S.diaDaViagem(d.data, P.inicio) })
        ]),
        el("div", { classe: "corpo" }, blocoDia(d).concat(
          !d.horarios && !d.notas && !d.restaurante ? [el("p", { classe: "mudo", texto: "Sem detalhes ainda." })] : []))
      ]);
      if (d.data === h) det.open = true;
      return det;
    });
    return el("div", null, [
      el("h1", { texto: "Roteiro" }),
      el("p", { classe: "mudo", texto: S.formatarData(P.inicio) + " a " + S.formatarData(P.fim) + " · toque num dia para ver os detalhes" }),
      el("div", { classe: "grade grade-3" }, cartoes)
    ]);
  }

  // ---------- Pendências ----------
  function itemPendencia(p, hojeIso) {
    var feita = p.status === "feita";
    var meta = [el("span", { texto: p.responsavel || "" }), etiquetaPrazo(p, hojeIso)];
    if (feita && p.feita_por) meta.push(el("span", { texto: "feita por " + p.feita_por + (p.feita_em ? " em " + p.feita_em.slice(0, 10).split("-").reverse().join("/") : "") }));
    return el("button", {
      type: "button", classe: "pendencia" + (feita ? " feita" : ""), "aria-pressed": feita ? "true" : "false",
      onclick: function (ev) { alternar(p, ev.currentTarget); }
    }, [
      el("span", { classe: "caixa", "aria-hidden": "true", texto: feita ? "✓" : "" }),
      el("span", null, [el("div", { classe: "item", texto: p.item }), el("div", { classe: "meta" }, meta)])
    ]);
  }

  function telaPendencias() {
    var h = hoje(), ord = S.ordenarPendencias(estado.publico.pendencias);
    return el("div", null, [
      el("h1", { texto: "Pendências" }),
      el("p", { classe: "mudo", texto: "Toque para marcar como feita (ou desfazer). Para criar ou editar, use a planilha." }),
      el("div", { classe: "grade" }, [
        el("section", null, [el("h2", { texto: "Abertas (" + ord.abertas.length + ")" })].concat(
          ord.abertas.length ? ord.abertas.map(function (p) { return itemPendencia(p, h); }) : [el("p", { classe: "mudo", texto: "Nada pendente. 🎉" })])),
        el("section", null, [el("h2", { texto: "Feitas (" + ord.feitas.length + ")" })].concat(
          ord.feitas.map(function (p) { return itemPendencia(p, h); })))
      ])
    ]);
  }

  function perguntarQuem() {
    return new Promise(function (resolve) {
      var salvo = API.quem();
      if (salvo) return resolve(salvo);
      var dlg = document.getElementById("dlg-quem");
      var box = document.getElementById("dlg-quem-opcoes");
      var resolvido = false;
      function fim(v) {
        if (resolvido) return;
        resolvido = true;
        if (v) API.salvarQuem(v);
        if (dlg.open) dlg.close();
        resolve(v);
      }
      box.textContent = "";
      QUEM.forEach(function (q) {
        box.appendChild(el("button", { type: "button", classe: "botao secundario", texto: q, onclick: function () { fim(q); } }));
      });
      dlg.querySelector("button[value=cancelar]").onclick = function (ev) { ev.preventDefault(); fim(null); };
      dlg.oncancel = function () { fim(null); };
      dlg.showModal();
    });
  }

  function alternar(p, botao) {
    if (estado.offlineDesde) { mostrarAviso("Sem conexão: não dá para marcar agora.", true, "erro"); return; }
    perguntarQuem().then(function (quem) {
      if (!quem) return;
      var antes = { status: p.status, feita_por: p.feita_por, feita_em: p.feita_em };
      var novo = p.status === "feita" ? "aberta" : "feita";
      botao.setAttribute("aria-busy", "true");
      API.marcar(p.id, novo, quem).then(function (r) {
        p.status = novo;
        p.feita_por = novo === "feita" ? quem : "";
        p.feita_em = (r.pendencia && r.pendencia.feita_em) || (novo === "feita" ? S.hojeIso(new Date(), FUSO) : "");
        API.atualizarCachePublico(estado.publico);
        esconderAviso();
        renderizar();
      }).catch(function () {
        p.status = antes.status; p.feita_por = antes.feita_por; p.feita_em = antes.feita_em;
        botao.removeAttribute("aria-busy");
        mostrarAviso("Não deu para salvar. Tente de novo com internet.", false, "erro");
      });
    });
  }

  // ---------- Reservas ----------
  function formCodigo(erro) {
    var input = el("input", { type: "text", autocomplete: "off", autocapitalize: "none", spellcheck: "false", placeholder: "Código do grupo", "aria-label": "Código do grupo" });
    var msg = el("p", { classe: "erro-texto", texto: erro || "" });
    msg.hidden = !erro;
    var form = el("form", { classe: "form-codigo", onsubmit: function (ev) {
      ev.preventDefault();
      var c = input.value.trim();
      if (!c) return;
      msg.hidden = true;
      carregarPrivado(c, true);
    } }, [input, el("button", { classe: "botao", type: "submit", texto: "Entrar" })]);
    setTimeout(function () { input.focus(); }, 0);
    return el("div", null, [
      el("h1", { texto: "Reservas 🔒" }),
      el("section", { classe: "cartao" }, [
        el("p", { texto: "Esta parte tem códigos de reserva, bilhetes e endereço. Digite o código do grupo (está no grupo do WhatsApp)." }),
        form, msg
      ])
    ]);
  }

  function copiar(texto, botao) {
    var pronto = function () { botao.textContent = "Copiado ✓"; setTimeout(function () { botao.textContent = "Copiar"; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(pronto, function () { botao.textContent = texto; });
    } else { botao.textContent = texto; }
  }

  function cartaoReserva(r) {
    var filhos = [
      el("div", { classe: "tipo", texto: (ICONES_RESERVA[r.tipo] || "📌") + " " + (r.tipo || "") }),
      el("h2", { texto: r.titulo }),
      r.quando ? el("p", { classe: "mudo", texto: r.quando }) : null
    ];
    if (r.codigo) {
      var b = el("button", { type: "button", classe: "botao pequeno secundario", texto: "Copiar" });
      b.addEventListener("click", function () { copiar(r.codigo, b); });
      filhos.push(el("div", { classe: "codigo-linha" }, [el("span", { classe: "codigo", texto: r.codigo }), b]));
    }
    if (r.detalhes) filhos.push(el("p", { texto: r.detalhes }));
    if (r.endereco) filhos.push(el("p", null, ["📍 " + r.endereco + " · ",
      el("a", { href: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(r.endereco), target: "_blank", rel: "noopener", texto: "abrir no Maps" })]));
    if (r.link && /^https:\/\//.test(r.link)) filhos.push(el("p", null, [el("a", { href: r.link, target: "_blank", rel: "noopener", texto: "Abrir site ↗" })]));
    return el("section", { classe: "cartao reserva" }, filhos);
  }

  function telaReservas() {
    var R = estado.privado;
    return el("div", null, [
      el("h1", { texto: "Reservas 🔒" }),
      el("div", { classe: "grade" }, R.reservas.map(cartaoReserva)),
      R.contatos.length ? el("section", { classe: "cartao", style: "margin-top:14px" }, [
        el("h2", { texto: "Contatos" }),
        el("ul", { classe: "contatos" }, R.contatos.map(function (c) { return el("li", null, [el("b", { texto: c.nome }), ": " + c.valor]); }))
      ]) : null,
      el("p", null, [el("button", { type: "button", classe: "botao pequeno secundario", texto: "Sair deste aparelho", onclick: function () {
        API.esquecerCodigo(); estado.privado = null; renderizar();
      } })])
    ]);
  }

  function carregarPrivado(codigo, digitado) {
    conteudo.textContent = "";
    conteudo.appendChild(el("p", { classe: "carregando", texto: "Abrindo reservas…" }));
    API.buscarPrivado(codigo).then(function (res) {
      if (res.dados && res.dados.ok) {
        API.salvarCodigo(codigo);
        estado.privado = res.dados;
        if (res.offline) mostrarAviso("Sem conexão. Reservas de " + dataHora(res.salvoEm) + ".", true);
        renderizar();
      } else {
        if (!digitado) API.esquecerCodigo();
        estado.privado = null;
        mostrarTela(formCodigo("Código incorreto."));
      }
    }).catch(function () {
      mostrarTela(formCodigo("Sem conexão. Conecte-se para abrir as reservas pela primeira vez."));
    });
  }

  // ---------- Roteamento ----------
  function rotaAtual() {
    var r = (location.hash || "#hoje").slice(1);
    return ["hoje", "roteiro", "pendencias", "reservas"].indexOf(r) >= 0 ? r : "hoje";
  }

  function mostrarTela(no) {
    conteudo.textContent = "";
    conteudo.appendChild(no);
  }

  function renderizar() {
    var rota = rotaAtual();
    Array.prototype.forEach.call(document.querySelectorAll(".nav a"), function (a) {
      a.classList.toggle("ativa", a.getAttribute("data-rota") === rota);
      if (a.getAttribute("data-rota") === rota) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    if (rota === "reservas") {
      if (estado.privado) mostrarTela(telaReservas());
      else if (API.codigo()) return carregarPrivado(API.codigo(), false);
      else mostrarTela(formCodigo());
      return;
    }
    if (!estado.publico) return;
    mostrarTela(rota === "roteiro" ? telaRoteiro() : rota === "pendencias" ? telaPendencias() : telaHoje());
    if (rota === "roteiro") {
      var alvo = document.getElementById("dia-" + hoje());
      if (alvo) alvo.scrollIntoView({ block: "center" });
    }
  }

  function iniciar() {
    esconderAviso();
    API.buscarPublico().then(function (res) {
      estado.publico = res.dados;
      if (!res.dados || !res.dados.ok) throw new Error("resposta");
      estado.offlineDesde = res.offline ? res.salvoEm : null;
      if (res.offline) mostrarAviso("Sem conexão. Mostrando dados de " + dataHora(res.salvoEm) + ".", true);
      renderizar();
    }).catch(function () {
      if (rotaAtual() === "reservas") return renderizar();
      mostrarTela(el("section", { classe: "cartao" }, [
        el("h2", { texto: "Não deu para carregar" }),
        el("p", { texto: "Conecte-se à internet uma vez para baixar o roteiro. Depois ele fica salvo neste aparelho." }),
        el("button", { type: "button", classe: "botao", texto: "Tentar de novo", onclick: iniciar })
      ]));
    });
  }

  window.addEventListener("hashchange", function () { renderizar(); window.scrollTo(0, 0); });
  iniciar();
})();
