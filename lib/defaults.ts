import cfg from "./cardapio.json";
import type { Catalogo } from "./types";

/** Cardápio inicial (usado até o administrador salvar a primeira alteração). */
export const DEFAULT_CATALOGO: Catalogo = {
  loja: {
    nome: "Churrascaria Girassol",
    slogan: "Sabor caseiro em cada refeição!",
    descricao: "Comida boa, feita com amor. Monte a sua marmita do seu jeito.",
    telefone: "(63) 99249-5434",
    whatsapp: "5563992495434",
    endereco: "1306 Sul, Avenida LO 29, QI 01, Lote 01 · Palmas-TO",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("1306 Sul Avenida LO 29 QI 01 Lote 01 Palmas TO"),
    aberta: true,
    mensagemFechada: "Estamos fechados no momento. Volte mais tarde para fazer o seu pedido!",
    aviso: "",
    horario: "",
    taxaEntrega: 0,
    entrega: true,
    retirada: true,
    pagamentos: [
      { id: "pix", label: "Pix", ativo: true },
      { id: "credito", label: "Cartão de crédito", ativo: true },
      { id: "debito", label: "Cartão de débito", ativo: true },
      { id: "dinheiro", label: "Dinheiro", ativo: true },
    ],
    preco: cfg.preco,
    logo: "",
    banner: "",
    corDestaque: "#F5B800",
    corTexto: "#B3202A",
    heroTitulo: "Monte a sua marmita do seu jeito.",
    heroTexto: "Escolha a carne, a salada e os acompanhamentos. Qualquer combinação por um preço só.",
    ctaTitulo: "Bateu a fome? Monte sua marmita.",
    ctaTexto: "Escolha os itens, finalize o pedido e ele chega direto no nosso WhatsApp.",
    mensagemPedido: "Aguardo a confirmação do pedido. Obrigado! 🙏",
  },
  grupos: cfg.categorias.map((c) => ({ id: c.id, label: c.label, titulo: c.titulo, dica: c.dica, min: c.min, max: c.max, ativo: true })),
  itens: cfg.categorias.flatMap((c) =>
    c.opcoes.map((nome) => ({ id: `${c.id}-${nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`, grupoId: c.id, nome, descricao: "", imagem: "", disponivel: true, precoExtra: 0 })),
  ),
  adicionais: [],
};
