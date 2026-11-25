/** Tipos compartilhados entre o cardápio público, o painel e a API. */

export type Pagamento = { id: string; label: string; ativo: boolean };

export type Loja = {
  nome: string;
  slogan: string;
  descricao: string;
  telefone: string; // exibido, ex.: (63) 99249-5434
  whatsapp: string; // só dígitos, ex.: 5563992495434
  endereco: string;
  mapsUrl: string;
  aberta: boolean;
  mensagemFechada: string;
  aviso: string; // faixa de aviso opcional (ex.: "Hoje não temos feijoada")
  horario: string; // texto livre, ex.: "Seg a Sáb, 11h às 15h"
  taxaEntrega: number;
  entrega: boolean;
  retirada: boolean;
  pagamentos: Pagamento[];
  preco: number; // preço fixo da marmita
  logo: string; // URL ou data URL (vazio = logo padrão)
  banner: string; // imagem do topo (vazio = sem imagem)
  corDestaque: string; // cor dos botões (amarelo)
  corTexto: string; // cor dos títulos (vermelho)
  heroTitulo: string;
  heroTexto: string;
  ctaTitulo: string;
  ctaTexto: string;
  mensagemPedido: string; // frase final da mensagem do WhatsApp
};

export type Grupo = { id: string; label: string; titulo: string; dica: string; min: number; max: number; ativo: boolean };
export type Item = { id: string; grupoId: string; nome: string; descricao: string; imagem: string; disponivel: boolean; precoExtra: number };
export type Adicional = { id: string; nome: string; descricao: string; imagem: string; preco: number; disponivel: boolean };

/** Documento público do cardápio (a ordem dos arrays é a ordem de exibição). */
export type Catalogo = { loja: Loja; grupos: Grupo[]; itens: Item[]; adicionais: Adicional[] };

/** Escolhas de uma marmita: id do grupo -> ids dos itens. */
export type Picks = Record<string, string[]>;

export type PedidoItemIn = { picks: Picks; adicionais: string[]; obs: string };
export type PedidoIn = {
  cliente: { nome: string; telefone: string };
  recebimento: "retirada" | "entrega";
  endereco: string;
  coords: string;
  pagamento: string;
  troco: string;
  obs: string;
  itens: PedidoItemIn[];
};

export const STATUS = ["recebido", "preparo", "entrega", "concluido", "cancelado"] as const;
export type Status = (typeof STATUS)[number];
export const STATUS_LABEL: Record<Status, string> = {
  recebido: "Recebido",
  preparo: "Em preparo",
  entrega: "Saiu para entrega",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export type PedidoItem = {
  n: number;
  preco: number;
  grupos: { label: string; itens: string[] }[];
  adicionais: { nome: string; preco: number }[];
  obs: string;
};
export type Pedido = {
  id: string;
  numero: string;
  criadoEm: string;
  status: Status;
  cliente: { nome: string; telefone: string };
  recebimento: "retirada" | "entrega";
  endereco: string;
  coords: string;
  pagamento: string;
  troco: string;
  obs: string;
  itens: PedidoItem[];
  subtotal: number;
  taxa: number;
  total: number;
  historico: { status: Status; em: string }[];
};
