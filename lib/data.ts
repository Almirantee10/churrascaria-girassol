import cfg from "./cardapio.json";

// WhatsApp da Churrascaria Girassol (formato 55 + DDD + número, só dígitos)
export const WA = "5563992495434";
export const WA_LABEL = "(63) 99249-5434";
export const ADDRESS = "1306 Sul, Avenida LO 29, QI 01, Lote 01 · Palmas-TO";
export const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("1306 Sul Avenida LO 29 QI 01 Lote 01 Palmas TO");

export const PAGES = [
  { href: "/", label: "Início" },
  { href: "/cardapio", label: "Montar marmita" },
  { href: "/como-pedir", label: "Como pedir" },
];

/** Preço fixo da marmita (edite em lib/cardapio.json). */
export const PRICE: number = cfg.preco;

export type Category = {
  id: string;
  label: string;
  titulo: string;
  dica: string;
  min: number;
  max: number;
  opcoes: string[];
};

export const CATEGORIES: Category[] = cfg.categorias;

/** Escolhas de uma marmita: id da categoria -> itens escolhidos. */
export type Picks = Record<string, string[]>;

export const emptyPicks = (): Picks => Object.fromEntries(CATEGORIES.map((c) => [c.id, [] as string[]]));

/** Categorias que ainda não atingiram o mínimo de escolhas. */
export const missing = (p: Picks) => CATEGORIES.filter((c) => (p[c.id]?.length ?? 0) < c.min);

export const PAY = [
  { id: "pix", label: "Pix" },
  { id: "credito", label: "Cartão de crédito" },
  { id: "debito", label: "Cartão de débito" },
  { id: "dinheiro", label: "Dinheiro" },
];

export const MARQUEE = ["Comida caseira", "Marmitas", "Sabor caseiro em cada refeição", "Feita com amor", "R$ 25,00 a marmita", "Monte do seu jeito"];

export const fmt = (v: number) =>
  "R$ " + Number(v).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export const waUrl = (text: string) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
