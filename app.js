(function () {
  "use strict";

  var CFG = window.ARUA;
  var $ = function (id) { return document.getElementById(id); };

  // ---------- Fotos e onde está o quadro em cada uma ----------
  // area: retângulo (em fração da foto) onde procurar a tinta do quadro.
  // fora: retângulos ignorados dentro da área (o baú de vime tem tom parecido com o laranja).
  var VISTAS = {
    vime: {
      src: "img/quadriciclo-bau-vime.jpg",
      bagageiro: "Baú de vime",
      area: [0.12, 0.02, 0.73, 0.99],
      fora: [[0.165, 0.395, 0.338, 0.59, 0.18]], // 5º número: inclinação da borda direita (o tubo do selim passa na frente do baú)
      satMin: 0.5,
    },
    aramado: {
      src: "img/quadriciclo-cesto-aramado.jpg",
      bagageiro: "Cesto aramado",
      area: [0.2, 0.06, 0.74, 0.97],
      fora: [],
      satMin: 0.45,
    },
  };

  var tela = $("tela");
  var ctx = tela.getContext("2d", { willReadFrequently: true });
  var mini = $("miniatura");
  var miniCtx = mini.getContext("2d");

  var estado = { vista: "vime", cor: CFG.cores[0] };
  var cache = {}; // por vista: { w, h, original(ImageData), mascara, sat, luz }

  // ---------- Conversões de cor ----------
  function rgbParaHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var l = (max + min) / 2, h = 0, s = 0, d = max - min;
    if (d > 0) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / d + 2) * 60;
      else h = ((r - g) / d + 4) * 60;
    }
    return [h, s, l];
  }
  function tom(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
  function rampa(v, a, b) {
    if (v <= a) return 0;
    if (v >= b) return 1;
    var t = (v - a) / (b - a);
    return t * t * (3 - 2 * t);
  }

  // ---------- Prepara a foto: acha os pixels pintados de laranja ----------
  function preparar(nome, img) {
    var v = VISTAS[nome];
    var w = Math.min(img.naturalWidth, 1600);
    var h = Math.round(img.naturalHeight * (w / img.naturalWidth));
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    var cx = c.getContext("2d", { willReadFrequently: true });
    cx.drawImage(img, 0, 0, w, h);
    var original = cx.getImageData(0, 0, w, h);
    var d = original.data;
    var mascara = new Uint8Array(w * h);
    var sat = new Uint8Array(w * h);
    var luz = new Uint8Array(w * h);

    var x0 = Math.floor(v.area[0] * w), y0 = Math.floor(v.area[1] * h);
    var x1 = Math.ceil(v.area[2] * w), y1 = Math.ceil(v.area[3] * h);
    for (var y = y0; y < y1; y++) {
      for (var x = x0; x < x1; x++) {
        var ignorar = false;
        for (var k = 0; k < v.fora.length; k++) {
          var f = v.fora[k];
          var direita = f[2] + (f[4] || 0) * (y / h - f[1]);
          if (x >= f[0] * w && x <= direita * w && y >= f[1] * h && y <= f[3] * h) { ignorar = true; break; }
        }
        if (ignorar) continue;
        var i = y * w + x, p = i * 4;
        var hsl = rgbParaHsl(d[p], d[p + 1], d[p + 2]);
        var dist = Math.abs(hsl[0] - 17);
        if (dist > 180) dist = 360 - dist;
        var peso = (1 - rampa(dist, 11, 19)) * rampa(hsl[1], v.satMin, v.satMin + 0.18) * rampa(hsl[2], 0.06, 0.16);
        if (peso > 0.02) {
          mascara[i] = Math.round(Math.min(1, peso * 2) * 255); // ganho: bordas e sombras do quadro pegam a cor inteira
          sat[i] = Math.round(hsl[1] * 255);
          luz[i] = Math.round(hsl[2] * 255);
        }
      }
    }
    cache[nome] = { w: w, h: h, original: original, mascara: mascara, sat: sat, luz: luz };
  }

  // ---------- Pinta o quadro na cor escolhida ----------
  function pintar() {
    var dados = cache[estado.vista];
    if (!dados) return;
    var cor = estado.cor;
    if (tela.width !== dados.w || tela.height !== dados.h) { tela.width = dados.w; tela.height = dados.h; }

    if (cor.original) {
      ctx.putImageData(dados.original, 0, 0);
    } else {
      var saida = new ImageData(new Uint8ClampedArray(dados.original.data), dados.w, dados.h);
      var d = saida.data, m = dados.mascara, n = m.length;
      var hh = cor.h / 360, soma = cor.soma || 0;
      for (var i = 0; i < n; i++) {
        var peso = m[i];
        if (!peso) continue;
        var s = Math.min(1, (dados.sat[i] / 255) * cor.s);
        var l = Math.min(0.97, (dados.luz[i] / 255) * cor.l + soma);
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var pp = 2 * l - q;
        var r = tom(pp, q, hh + 1 / 3) * 255, g = tom(pp, q, hh) * 255, b = tom(pp, q, hh - 1 / 3) * 255;
        var a = peso / 255, p = i * 4;
        d[p] = d[p] + (r - d[p]) * a;
        d[p + 1] = d[p + 1] + (g - d[p + 1]) * a;
        d[p + 2] = d[p + 2] + (b - d[p + 2]) * a;
      }
      ctx.putImageData(saida, 0, 0);
    }

    // miniatura do resumo
    var mw = 640, mh = Math.round(mw * dados.h / dados.w);
    if (mini.width !== mw || mini.height !== mh) { mini.width = mw; mini.height = mh; }
    miniCtx.drawImage(tela, 0, 0, mw, mh);
  }

  function carregarVista(nome, depois) {
    if (cache[nome]) { depois(); return; }
    var img = new Image();
    img.onload = function () { preparar(nome, img); depois(); };
    img.src = VISTAS[nome].src;
  }

  // ---------- Estado → tela ----------
  var OUTRA = "outra";

  function nomeDaCor() {
    if ($("cor").value === OUTRA) {
      var t = $("outra-cor").value.trim();
      return t ? t : "Outra cor";
    }
    return estado.cor.nome;
  }

  function atualizar() {
    var cor = estado.cor;
    var outra = $("cor").value === OUTRA;
    document.documentElement.style.setProperty("--tinta", cor.ui);
    document.documentElement.style.setProperty("--sobre-tinta", cor.sobre);

    $("cor-nome").textContent = cor.nome;
    $("pedir-nesta-cor").textContent = "Pedir na cor " + cor.nome.toLowerCase();
    tela.setAttribute("aria-label", "Quadriciclo a pedal Aruã na cor " + cor.nome.toLowerCase() + ", " + VISTAS[estado.vista].bagageiro.toLowerCase());

    Array.prototype.forEach.call(document.querySelectorAll(".chip"), function (b) {
      var ativo = b.dataset.cor === cor.id;
      b.setAttribute("aria-checked", ativo ? "true" : "false");
      b.tabIndex = ativo ? 0 : -1;
    });
    Array.prototype.forEach.call(document.querySelectorAll(".vista"), function (b) {
      b.setAttribute("aria-pressed", b.dataset.vista === estado.vista ? "true" : "false");
    });

    if (!outra) $("cor").value = cor.id;
    $("campo-outra-cor").hidden = !outra;
    $("resumo-cor").textContent = nomeDaCor();
    $("resumo-bagageiro").textContent = bagageiro();
    $("resumo-qtd").textContent = quantidade();
    $("resumo-pagamento").textContent = pagamento();

    carregarVista(estado.vista, pintar);
  }

  function bagageiro() {
    var m = document.querySelector('input[name="bagageiro"]:checked');
    return m ? m.value : "";
  }
  function pagamento() {
    var m = document.querySelector('input[name="pagamento"]:checked');
    return m ? m.value : "";
  }
  function quantidade() {
    var q = parseInt($("qtd").value, 10);
    return q >= 1 ? Math.min(q, 20) : 1;
  }
  function escolherCor(id) {
    var c = CFG.cores.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    estado.cor = c;
    $("cor").value = c.id;
    atualizar();
  }
  function escolherVista(nome) {
    estado.vista = nome;
    var alvo = VISTAS[nome].bagageiro;
    Array.prototype.forEach.call(document.querySelectorAll('input[name="bagageiro"]'), function (r) {
      r.checked = r.value === alvo;
    });
    atualizar();
  }

  // ---------- Monta bolinhas e lista de cores ----------
  var chips = $("chips"), select = $("cor");
  CFG.cores.forEach(function (c) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.dataset.cor = c.id;
    b.style.setProperty("--chip", c.chip);
    b.setAttribute("role", "radio");
    b.setAttribute("aria-label", c.nome);
    b.title = c.nome;
    b.addEventListener("click", function () { escolherCor(c.id); });
    chips.appendChild(b);

    var o = document.createElement("option");
    o.value = c.id; o.textContent = c.nome;
    select.appendChild(o);
  });
  var outraOpcao = document.createElement("option");
  outraOpcao.value = OUTRA; outraOpcao.textContent = "Outra cor (escrever)";
  select.appendChild(outraOpcao);

  chips.addEventListener("keydown", function (e) {
    var passo = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!passo) return;
    e.preventDefault();
    var i = CFG.cores.indexOf(estado.cor);
    var prox = CFG.cores[(i + passo + CFG.cores.length) % CFG.cores.length];
    escolherCor(prox.id);
    chips.querySelector('[data-cor="' + prox.id + '"]').focus();
  });

  Array.prototype.forEach.call(document.querySelectorAll(".vista"), function (b) {
    b.addEventListener("click", function () { escolherVista(b.dataset.vista); });
  });

  select.addEventListener("change", function () {
    if (select.value === OUTRA) { atualizar(); $("outra-cor").focus(); }
    else escolherCor(select.value);
  });
  $("outra-cor").addEventListener("input", atualizar);
  $("qtd").addEventListener("input", atualizar);
  Array.prototype.forEach.call(document.querySelectorAll('input[name="pagamento"]'), function (r) {
    r.addEventListener("change", atualizar);
  });
  Array.prototype.forEach.call(document.querySelectorAll('input[name="bagageiro"]'), function (r) {
    r.addEventListener("change", function () {
      escolherVista(r.value === VISTAS.aramado.bagageiro ? "aramado" : "vime");
    });
  });

  // ---------- Preço e WhatsApp ----------
  var zap = (CFG.whatsapp || "").replace(/\D/g, "");
  if (CFG.preco) {
    $("preco").hidden = false;
    $("preco-valor").textContent = CFG.preco;
    $("preco-condicao").textContent = CFG.condicao || "";
    $("resumo-preco-linha").hidden = false;
    $("resumo-preco").textContent = CFG.preco;
  }
  if (CFG.parcelas) {
    $("parcelas").hidden = false;
    $("parcelas").textContent = CFG.parcelas;
  }
  if (zap) {
    var r = $("rodape-zap");
    r.href = "https://wa.me/" + zap + "?text=" + encodeURIComponent("Olá! Quero saber mais sobre o quadriciclo a pedal Aruã.");
    r.target = "_blank"; r.rel = "noopener";
  }

  // ---------- Redes sociais (rodapé) ----------
  Object.keys(CFG.redes || {}).forEach(function (nome) {
    var url = (CFG.redes[nome] || "").trim();
    if (!/^https?:///i.test(url)) return;
    var a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener";
    a.textContent = nome;
    $("redes").appendChild(a);
  });

  // ---------- Formulário ----------
  $("fone").addEventListener("input", function () {
    var n = this.value.replace(/\D/g, "").slice(0, 11), t = n;
    if (n.length > 2) t = "(" + n.slice(0, 2) + ") " + n.slice(2);
    if (n.length > 6) {
      var corte = n.length > 10 ? 7 : 6;
      t = "(" + n.slice(0, 2) + ") " + n.slice(2, corte) + "-" + n.slice(corte);
    }
    this.value = t;
  });

  function validar(id, ok) {
    $(id).setAttribute("aria-invalid", ok ? "false" : "true");
    $("erro-" + id).hidden = ok;
    return ok;
  }

  function mensagem() {
    var linhas = [
      "*Pedido: Quadriciclo a pedal Aruã*",
      "",
      "Nome: " + $("nome").value.trim(),
      "WhatsApp: " + $("fone").value.trim(),
      "Entrega em: " + $("cidade").value.trim(),
      "",
      "Cor do quadro: " + nomeDaCor(),
      "Bagageiro: " + bagageiro(),
      "Quantidade: " + quantidade(),
      "Pagamento: " + pagamento(),
    ];
    if (CFG.preco) linhas.push("Valor visto no site: " + CFG.preco + (CFG.condicao ? " " + CFG.condicao : ""));
    var obs = $("obs").value.trim();
    if (obs) linhas.push("", "Observações: " + obs);
    return linhas.join("\n");
  }

  $("form-pedido").addEventListener("submit", function (e) {
    e.preventDefault();
    var aviso = $("aviso");
    aviso.hidden = true; aviso.className = "aviso";

    var ok = [
      validar("nome", $("nome").value.trim().length >= 2),
      validar("fone", $("fone").value.replace(/\D/g, "").length >= 10),
      validar("cidade", $("cidade").value.trim().length >= 2),
      validar("outra-cor", select.value !== OUTRA || $("outra-cor").value.trim().length >= 2),
    ];
    if (ok.indexOf(false) !== -1) {
      var primeiro = document.querySelector('#form-pedido [aria-invalid="true"]');
      if (primeiro) primeiro.focus();
      return;
    }

    if (!zap) {
      aviso.textContent = "O pedido não foi enviado: falta cadastrar o número de WhatsApp da loja no arquivo config.js.";
      aviso.hidden = false;
      return;
    }
    window.open("https://wa.me/" + zap + "?text=" + encodeURIComponent(mensagem()), "_blank", "noopener");
    aviso.textContent = "Pedido aberto no WhatsApp. Toque em enviar por lá para concluir.";
    aviso.classList.add("ok");
    aviso.hidden = false;
    if (CFG.linkPagamento && pagamento().indexOf("Mercado Pago") !== -1) {
      $("pagar-mp").href = CFG.linkPagamento;
      $("pagar-mp").hidden = false;
    }
  });

  // Para conferência no console: ARUA_DEBUG.mensagem()
  window.ARUA_DEBUG = { mensagem: mensagem, escolherCor: escolherCor, escolherVista: escolherVista, cache: cache };

  atualizar();
  // deixa a outra foto pronta para a troca ser instantânea
  carregarVista("aramado", function () {});
})();
