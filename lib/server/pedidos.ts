import "server-only";
import { randomBytes } from "crypto";
import type { Catalogo, Pedido, PedidoIn, PedidoItem, Status } from "../types";
import { STATUS } from "../types";
import { listDocs, readDoc, updateDoc } from "./db";

const day = (d = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Araguaina" }).format(d); // AAAA-MM-DD
const docOf = (d: string) => `pedidos/${d}.json`;

export class PedidoErro extends Error {}

/** Valida o pedido e recalcula todos os preços no servidor (o cliente não define valores). */
export function montarPedido(c: Catalogo, inp: PedidoIn): Omit<Pedido, "id" | "numero" | "criadoEm" | "historico" | "status"> {
  const L = c.loja;
  if (!L.aberta) throw new PedidoErro(L.mensagemFechada || "A loja está fechada no momento.");
  if (!Array.isArray(inp.itens) || !inp.itens.length) throw new PedidoErro("O pedido está vazio.");
  if (inp.itens.length > 30) throw new PedidoErro("Quantidade de marmitas acima do limite.");
  const rec = inp.recebimento === "entrega" ? "entrega" : "retirada";
  if (rec === "entrega" && !L.entrega) throw new PedidoErro("No momento não estamos fazendo entregas.");
  if (rec === "retirada" && !L.retirada) throw new PedidoErro("No momento não estamos com retirada no local.");
  const pag = L.pagamentos.find((p) => p.id === inp.pagamento && p.ativo);
  if (!pag) throw new PedidoErro("Escolha uma forma de pagamento válida.");

  const itens: PedidoItem[] = inp.itens.map((it, idx) => {
    const grupos: PedidoItem["grupos"] = [];
    let preco = L.preco;
    for (const g of c.grupos.filter((g) => g.ativo)) {
      const ids = (it.picks?.[g.id] ?? []).filter((v, i, a) => a.indexOf(v) === i);
      const escolhidos = ids.map((iid) => c.itens.find((x) => x.id === iid && x.grupoId === g.id)).filter(Boolean) as Catalogo["itens"];
      if (escolhidos.length !== ids.length) throw new PedidoErro(`Marmita ${idx + 1}: uma das opções de ${g.label.toLowerCase()} não existe mais. Refaça a escolha.`);
      const indisp = escolhidos.find((x) => !x.disponivel);
      if (indisp) throw new PedidoErro(`Marmita ${idx + 1}: "${indisp.nome}" está indisponível agora.`);
      if (escolhidos.length < g.min) throw new PedidoErro(`Marmita ${idx + 1}: escolha ${g.label.toLowerCase()}.`);
      if (escolhidos.length > g.max) throw new PedidoErro(`Marmita ${idx + 1}: máximo de ${g.max} em ${g.label.toLowerCase()}.`);
      preco += escolhidos.reduce((a, x) => a + x.precoExtra, 0);
      grupos.push({ label: g.label, itens: escolhidos.map((x) => x.nome) });
    }
    const adicionais = (it.adicionais ?? []).filter((v, i, a) => a.indexOf(v) === i).map((aid) => {
      const a = c.adicionais.find((x) => x.id === aid);
      if (!a) throw new PedidoErro(`Marmita ${idx + 1}: um adicional não existe mais. Refaça a escolha.`);
      if (!a.disponivel) throw new PedidoErro(`Marmita ${idx + 1}: "${a.nome}" está indisponível agora.`);
      return { nome: a.nome, preco: a.preco };
    });
    preco += adicionais.reduce((a, x) => a + x.preco, 0);
    return { n: idx + 1, preco: Math.round(preco * 100) / 100, grupos, adicionais, obs: String(it.obs ?? "").slice(0, 300) };
  });
  const subtotal = Math.round(itens.reduce((a, i) => a + i.preco, 0) * 100) / 100;
  const taxa = rec === "entrega" ? L.taxaEntrega : 0;
  return {
    cliente: { nome: String(inp.cliente?.nome ?? "").slice(0, 80), telefone: String(inp.cliente?.telefone ?? "").slice(0, 30) },
    recebimento: rec,
    endereco: String(inp.endereco ?? "").slice(0, 300),
    coords: /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(String(inp.coords ?? "")) ? String(inp.coords) : "",
    pagamento: pag.label,
    troco: String(inp.troco ?? "").slice(0, 30),
    obs: String(inp.obs ?? "").slice(0, 500),
    itens, subtotal, taxa, total: Math.round((subtotal + taxa) * 100) / 100,
  };
}

export async function registrarPedido(base: ReturnType<typeof montarPedido>): Promise<Pedido> {
  const hoje = day();
  const agora = new Date().toISOString();
  let criado!: Pedido;
  await updateDoc<Pedido[]>(docOf(hoje), () => [], (lista) => {
    criado = { ...base, id: randomBytes(6).toString("hex"), numero: String(lista.length + 1).padStart(3, "0"), criadoEm: agora, status: "recebido", historico: [{ status: "recebido", em: agora }] };
    lista.push(criado);
  });
  return criado;
}

/** Pedidos dos últimos `dias` dias (mais novos primeiro). */
export async function listarPedidos(dias = 31): Promise<Pedido[]> {
  const nomes = (await listDocs("pedidos/")).sort().reverse().slice(0, dias);
  const out: Pedido[] = [];
  for (const nome of nomes) {
    const { data } = await readDoc<Pedido[]>(nome);
    if (data) out.push(...data);
  }
  return out.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

export async function mudarStatus(id: string, status: Status): Promise<Pedido | null> {
  if (!STATUS.includes(status)) throw new PedidoErro("Status inválido.");
  const nomes = (await listDocs("pedidos/")).sort().reverse();
  for (const nome of nomes) {
    const { data } = await readDoc<Pedido[]>(nome);
    if (!data?.some((p) => p.id === id)) continue;
    let alvo: Pedido | null = null;
    await updateDoc<Pedido[]>(nome, () => [], (lista) => {
      const p = lista.find((x) => x.id === id);
      if (p) { p.status = status; p.historico.push({ status, em: new Date().toISOString() }); alvo = p; }
    });
    return alvo;
  }
  return null;
}
