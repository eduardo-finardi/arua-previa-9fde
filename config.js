// Dados da loja. É só aqui que se mexe para mudar número, preço e cores.
window.ARUA = {
  // WhatsApp que recebe os pedidos: só dígitos, com 55 + DDD. Ex.: "5513999998888"
  whatsapp: "",

  // Preço mostrado no site. Deixe "" para não mostrar preço. Ex.: "R$ 3.490,00"
  preco: "",

  // Texto curto ao lado do preço. Ex.: "à vista no Pix" ou "em até 10x no cartão"
  condicao: "",

  // Parcelamento anunciado no site. Deixe parcelasVezes "" para esconder.
  parcelasVezes: "12x",
  parcelasTexto: "no cartão, pelo Mercado Pago",

  // Link de pagamento do Mercado Pago (opcional). Se preenchido, aparece o botão
  // "Pagar pelo Mercado Pago" depois que o pedido é enviado. Ex.: "https://mpago.la/xxxx"
  linkPagamento: "",

  // Redes sociais: cole o endereço completo. As que ficarem "" não aparecem no site.
  redes: {
    Instagram: "",
    Facebook: "",
    TikTok: "",
    YouTube: "",
  },

  // Cores oferecidas. "chip" é a cor da bolinha; h/s/l controlam a pintura na foto.
  cores: [
    { id: "laranja", nome: "Laranja", chip: "#E4560F", original: true, ui: "#D94E0A", sobre: "#FFFFFF" },
    { id: "vermelho", nome: "Vermelho", chip: "#C8171E", h: 357, s: 1.0, l: 0.86, ui: "#C8171E", sobre: "#FFFFFF" },
    { id: "amarelo", nome: "Amarelo", chip: "#F2B90F", h: 45, s: 1.0, l: 1.08, ui: "#F2B90F", sobre: "#1B1B12" },
    { id: "verde", nome: "Verde", chip: "#1E8A4C", h: 146, s: 0.72, l: 0.72, ui: "#1B7F45", sobre: "#FFFFFF" },
    { id: "azul", nome: "Azul", chip: "#1763C6", h: 214, s: 0.9, l: 0.9, ui: "#1763C6", sobre: "#FFFFFF" },
    { id: "rosa", nome: "Rosa", chip: "#E0347F", h: 332, s: 0.9, l: 1.02, ui: "#D42A75", sobre: "#FFFFFF" },
    { id: "roxo", nome: "Roxo", chip: "#6B35B8", h: 268, s: 0.7, l: 0.88, ui: "#6B35B8", sobre: "#FFFFFF" },
    { id: "preto", nome: "Preto", chip: "#1A1C1C", h: 200, s: 0.04, l: 0.26, ui: "#1A1C1C", sobre: "#FFFFFF" },
    { id: "branco", nome: "Branco", chip: "#F4F5F2", h: 80, s: 0.03, l: 0.62, soma: 0.56, ui: "#0F2A2B", sobre: "#FFFFFF" },
  ],
};
