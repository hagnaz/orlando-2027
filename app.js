/**
 * Telas do site. Todo texto vindo da planilha entra via textContent (nunca innerHTML).
 */
(function () {
  var FUSO = "America/New_York";
  var ICONES = { parque: "🎢", descanso: "🏖️", viagem: "✈️", livre: "🛍️" };
  var ICONES_RESERVA = { voo: "✈️", hospedagem: "🏠", carro: "🚐", restaurante: "🍽️", ingresso: "🎟️", seguro: "🩺", outro: "📌" };
  var QUEM = ["Vinicius", "Aline", "Daniel", "Cris", "Bia", "Valen"];

  var estado = { verTodas: false, publico: null, privado: null, offlineDesde: null, pessoal: null, pessoalOffline: null, abaRestrita: null, rascunhos: {} };
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
      d.restaurante ? el("div", { classe: "restaurante" }, [el("b", { texto: "🍽️ " }), d.restaurante]) : null,
      d.links && d.links.length ? el("div", { classe: "links-dia" }, d.links.map(function (l) {
        return el("a", { classe: "botao pequeno secundario", href: l.url, target: "_blank", rel: "noopener", texto: l.texto + " ↗" });
      })) : null
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
    var ord = S.ordenarPendencias(S.filtrarPendencias(P.pendencias, API.quem()));
    var esquerda = [], direita = [];

    if (situacao === "antes") {
      var faltam = S.diasAte(h, P.inicio);
      esquerda.push(el("section", { classe: "cartao heroi" }, [
        el("div", { classe: "rotulo", texto: "Contagem regressiva" }),
        el("div", { classe: "numero", texto: String(faltam) }),
        el("p", { texto: faltam === 1 ? "dia para a viagem" : "dias para a viagem" }),
        el("p", { classe: "mudo", texto: S.formatarData(P.inicio) + " a " + S.formatarData(P.fim) + " de 2027" })
      ]));
      var marco = S.proximaData(P.marcos, S.filtrarPendencias(P.pendencias, API.quem()), h);
      if (marco) esquerda.push(el("section", { classe: "cartao" }, [
        el("div", { classe: "rotulo", texto: marco.pendencia ? "Próximo prazo" : "Próxima data importante" }),
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
        el("div", { classe: "rotulo", texto: API.quem() ? "Pendências mais urgentes da sua família" : "Pendências mais urgentes" }),
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
          !d.horarios && !d.notas && !d.restaurante && !(d.links && d.links.length) ? [el("p", { classe: "mudo", texto: "Sem detalhes ainda." })] : []))
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
    var h = hoje(), quem = API.quem();
    var filtrar = quem && !estado.verTodas;
    var ord = S.ordenarPendencias(filtrar ? S.filtrarPendencias(estado.publico.pendencias, quem) : estado.publico.pendencias);
    var filtro = quem ? el("div", { classe: "abas", role: "tablist" }, [
      ["familia", "Da família " + (S.familiaDe(quem) === "Vinicius" ? "Vinicius e Aline" : "do Daniel")], ["todas", "Todas"]
    ].map(function (o) {
      var ativa = (o[0] === "todas") === !filtrar;
      return el("button", { type: "button", role: "tab", classe: "botao pequeno" + (ativa ? "" : " secundario"), "aria-selected": ativa ? "true" : "false",
        texto: o[1], onclick: function () { estado.verTodas = o[0] === "todas"; renderizar(); } });
    })) : null;
    return el("div", null, [
      el("h1", { texto: "Pendências" }),
      el("p", { classe: "mudo", texto: "Toque para marcar como feita (ou desfazer). Para criar ou editar, use a planilha." }),
      filtro,
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
    var input = el("input", { type: "text", autocomplete: "off", autocapitalize: "none", spellcheck: "false", placeholder: "Seu código", "aria-label": "Seu código" });
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
      el("h1", { texto: "Área restrita 🔒" }),
      el("section", { classe: "cartao" }, [
        el("p", { texto: "Aqui ficam reservas, contatos e a sua área pessoal (checklist e notas). Digite o seu código pessoal." }),
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

  function blocoGrupo(R) {
    return el("div", null, [
      el("div", { classe: "grade" }, R.reservas.map(cartaoReserva)),
      R.contatos.length ? el("section", { classe: "cartao", style: "margin-top:14px" }, [
        el("h2", { texto: "Contatos" }),
        el("ul", { classe: "contatos" }, R.contatos.map(function (c) { return el("li", null, [el("b", { texto: c.nome }), ": " + c.valor]); }))
      ]) : null
    ]);
  }

  function telaRestrita() {
    var R = estado.privado, P = estado.pessoal;
    var abas = [{ id: "grupo", nome: "Grupo" }];
    if (P) P.areas.forEach(function (a) { abas.push({ id: a.pessoa, nome: a.editavel ? "Minha área" : a.pessoa }); });
    var existe = abas.some(function (x) { return x.id === estado.abaRestrita; });
    var atual = existe ? estado.abaRestrita : (P ? P.eu : "grupo");
    var area = P && P.areas.filter(function (a) { return a.pessoa === atual; })[0];
    return el("div", null, [
      el("h1", { texto: "Área restrita 🔒" }),
      P ? el("p", { classe: "mudo", texto: "Você entrou como " + P.eu + "." })
        : el("p", { classe: "mudo", texto: "Você entrou com o código do grupo. Peça seu código pessoal ao Vinicius para ter sua área." }),
      abas.length > 1 ? el("div", { classe: "abas", role: "tablist" }, abas.map(function (x) {
        return el("button", { type: "button", role: "tab", classe: "botao pequeno" + (x.id === atual ? "" : " secundario"),
          "aria-selected": x.id === atual ? "true" : "false", texto: x.nome,
          onclick: function () { estado.abaRestrita = x.id; renderizar(); } });
      })) : null,
      area ? telaArea(area) : blocoGrupo(R),
      el("p", null, [el("button", { type: "button", classe: "botao pequeno secundario", texto: "Sair deste aparelho", onclick: function () {
        API.esquecerCodigo();
        estado.privado = null; estado.pessoal = null; estado.abaRestrita = null; estado.rascunhos = {};
        renderizar();
      } })])
    ]);
  }

  function falhaGravacao(botao) {
    return function (e) {
      if (botao) { botao.removeAttribute("aria-busy"); botao.disabled = false; }
      if (e && e.codigo === "codigo") {
        API.esquecerCodigo();
        estado.privado = null; estado.pessoal = null;
        return mostrarTela(formCodigo("Seu código mudou. Peça o novo ao Vinicius."));
      }
      if (e && e.codigo === "id") {
        mostrarAviso("Esse item mudou na planilha. Atualizei a lista.", false, "erro");
        return carregarPrivado(API.codigo(), false);
      }
      mostrarAviso("Não deu para salvar. Tente de novo com internet.", false, "erro");
    };
  }

  function salvou() { API.atualizarCachePessoal(estado.pessoal); esconderAviso(); renderizar(); }

  function semConexao() {
    if (!estado.pessoalOffline) return false;
    mostrarAviso("Sem conexão: não dá para salvar agora.", true, "erro");
    return true;
  }

  function itemChecklist(i, area, podeEditar) {
    var marcar = el("button", { type: "button", classe: "pendencia" + (i.feito ? " feita" : ""), "aria-pressed": i.feito ? "true" : "false" }, [
      el("span", { classe: "caixa", "aria-hidden": "true", texto: i.feito ? "✓" : "" }),
      el("span", { classe: "item", texto: i.texto })
    ]);
    var li = el("li", { classe: "item-check" }, [marcar]);
    if (!podeEditar) { marcar.disabled = true; return li; }
    marcar.addEventListener("click", function () {
      if (semConexao()) return;
      var novo = !i.feito;
      marcar.setAttribute("aria-busy", "true"); marcar.disabled = true;
      API.gravarPessoal("item_marcar", { id: i.id, feito: novo }).then(function () { i.feito = novo; salvou(); }).catch(falhaGravacao(marcar));
    });
    var apagar = el("button", { type: "button", classe: "apagar", "aria-label": "Apagar " + i.texto, texto: "×" });
    apagar.addEventListener("click", function () {
      if (apagar.getAttribute("data-confirmar") !== "1") {
        apagar.setAttribute("data-confirmar", "1"); apagar.textContent = "Apagar?";
        setTimeout(function () { if (apagar.isConnected) { apagar.removeAttribute("data-confirmar"); apagar.textContent = "×"; } }, 3000);
        return;
      }
      if (semConexao()) return;
      apagar.disabled = true;
      API.gravarPessoal("item_apagar", { id: i.id }).then(function () {
        area.itens = area.itens.filter(function (x) { return x.id !== i.id; });
        salvou();
      }).catch(falhaGravacao(apagar));
    });
    li.appendChild(apagar);
    return li;
  }

  function formNovoItem(area, grupos) {
    var cats = grupos.map(function (g) { return g.categoria; });
    if (cats.indexOf("Outros") < 0) cats.push("Outros");
    var sel = el("select", { "aria-label": "Categoria" }, cats.map(function (c) { return el("option", { value: c, texto: c }); }));
    var input = el("input", { type: "text", maxlength: "200", placeholder: "Novo item", "aria-label": "Novo item" });
    var botao = el("button", { classe: "botao", type: "submit", texto: "Acrescentar" });
    return el("form", { classe: "cartao form-item", onsubmit: function (ev) {
      ev.preventDefault();
      var t = input.value.trim();
      if (!t || botao.disabled || semConexao()) return;
      botao.disabled = true;
      API.gravarPessoal("item_novo", { texto: t, categoria: sel.value }).then(function (r) { area.itens.push(r.item); salvou(); }).catch(falhaGravacao(botao));
    } }, [sel, input, botao]);
  }

  function fmtSalvo(s) {
    var m = (s || "").match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}:\d{2})/);
    return m ? "salvo em " + m[3] + "/" + m[2] + " às " + m[4] : "";
  }

  function blocoNota(area, podeEditar) {
    var rascunho = estado.rascunhos[area.pessoa];
    var ta = el("textarea", { rows: "6", maxlength: "5000", "aria-label": area.editavel ? "Minhas notas" : "Notas de " + area.pessoa });
    ta.value = rascunho !== undefined ? rascunho : (area.nota.texto || "");
    ta.readOnly = !podeEditar;
    ta.addEventListener("input", function () { estado.rascunhos[area.pessoa] = ta.value; });
    var status = el("span", { classe: "mudo", texto: rascunho !== undefined ? "não salvo" : fmtSalvo(area.nota.salvo_em) });
    var filhos = [el("h2", { texto: area.editavel ? "Minhas notas" : "Notas de " + area.pessoa }), ta];
    if (podeEditar) {
      var b = el("button", { type: "button", classe: "botao", texto: "Salvar" });
      b.addEventListener("click", function () {
        if (semConexao()) return;
        b.disabled = true;
        API.gravarPessoal("nota_salvar", { texto: ta.value }).then(function (r) {
          area.nota = r.nota;
          delete estado.rascunhos[area.pessoa];
          salvou();
        }).catch(falhaGravacao(b));
      });
      filhos.push(el("div", { classe: "linha-nota" }, [b, status]));
    } else filhos.push(status);
    return el("section", { classe: "cartao nota" }, filhos);
  }

  function telaArea(area) {
    var podeEditar = area.editavel && !estado.pessoalOffline;
    var grupos = S.agruparItens(area.itens);
    var feitos = area.itens.filter(function (i) { return i.feito; }).length;
    var filhos = [el("h2", { texto: (area.editavel ? "Meu checklist" : "Checklist de " + area.pessoa) + " · " + feitos + "/" + area.itens.length })];
    if (!area.editavel) filhos.push(el("p", { classe: "mudo", texto: "Só leitura." }));
    grupos.forEach(function (g) {
      filhos.push(el("section", { classe: "cartao checklist" }, [
        el("h3", { texto: g.categoria + " · " + g.feitos + "/" + g.itens.length }),
        el("ul", { classe: "itens" }, g.itens.map(function (i) { return itemChecklist(i, area, podeEditar); }))
      ]));
    });
    if (podeEditar) filhos.push(formNovoItem(area, grupos));
    filhos.push(blocoNota(area, podeEditar));
    return el("div", { classe: "area" }, filhos);
  }

  function carregarPrivado(codigo, digitado) {
    conteudo.textContent = "";
    conteudo.appendChild(el("p", { classe: "carregando", texto: "Abrindo área restrita…" }));
    function entrouPessoal(res) {
      API.salvarCodigo(codigo);
      API.salvarQuem(res.dados.eu);
      estado.pessoal = res.dados;
      estado.privado = { reservas: res.dados.reservas, contatos: res.dados.contatos };
      estado.pessoalOffline = res.offline ? res.salvoEm : null;
      if (res.offline) mostrarAviso("Sem conexão. Área restrita de " + dataHora(res.salvoEm) + ". Para marcar ou salvar, conecte-se.", true);
      renderizar();
    }
    function tentarGrupo() {
      return API.buscarPrivado(codigo).then(function (res) {
        if (res.dados && res.dados.ok) {
          API.salvarCodigo(codigo);
          estado.pessoal = null;
          estado.privado = res.dados;
          if (res.offline) mostrarAviso("Sem conexão. Reservas de " + dataHora(res.salvoEm) + ".", true);
          return renderizar();
        }
        if (!digitado) API.esquecerCodigo();
        estado.privado = null;
        estado.pessoal = null;
        mostrarTela(formCodigo("Código incorreto."));
      });
    }
    API.buscarPessoal(codigo).then(function (res) {
      if (res.dados && res.dados.ok) return entrouPessoal(res);
      return tentarGrupo();
    }).catch(function () {
      return tentarGrupo();
    }).catch(function () {
      mostrarTela(formCodigo("Sem conexão. Conecte-se para abrir a área restrita pela primeira vez."));
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
      if (estado.privado) mostrarTela(telaRestrita());
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
    function semCarimbo(d) { var c = {}; Object.keys(d || {}).forEach(function (k) { if (k !== "atualizadoEm") c[k] = d[k]; }); return JSON.stringify(c); }
    function aplicar(res) {
      if (!res.dados || !res.dados.ok) throw new Error("resposta");
      var mudou = !estado.publico || semCarimbo(estado.publico) !== semCarimbo(res.dados);
      estado.publico = res.dados;
      estado.offlineDesde = res.offline ? res.salvoEm : null;
      if (res.offline) mostrarAviso("Sem conexão. Mostrando dados de " + dataHora(res.salvoEm) + ".", true);
      else esconderAviso();
      if (mudou || res.offline) renderizar();
    }
    // o segundo aplicar (atualização em segundo plano) só redesenha se algo mudou
    API.buscarPublico(function (res) { try { aplicar(res); } catch (e) { /* mantém o que está na tela */ } }).then(aplicar).catch(function () {
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
