export const PAGES = [
  { href: "/", label: "Início" },
  { href: "/cardapio", label: "Montar marmita" },
  { href: "/como-pedir", label: "Como pedir" },
];

export const fmt = (v: number) =>
  "R$ " + Number(v).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export const waUrl = (whatsapp: string, text: string) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;
