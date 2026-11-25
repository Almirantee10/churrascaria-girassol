import { lerCatalogo } from "@/lib/server/catalogo";
import { PedidoErro, montarPedido, registrarPedido } from "@/lib/server/pedidos";
import type { PedidoIn } from "@/lib/types";

/** Cliente envia o pedido. O servidor confere loja aberta, opções e recalcula os preços. */
export async function POST(req: Request) {
  try {
    const inp = (await req.json()) as PedidoIn;
    const base = montarPedido(await lerCatalogo(), inp);
    const p = await registrarPedido(base);
    return Response.json({ id: p.id, numero: p.numero, total: p.total });
  } catch (e) {
    if (e instanceof PedidoErro) return Response.json({ erro: e.message }, { status: 400 });
    return Response.json({ erro: "Não foi possível registrar o pedido. Tente de novo." }, { status: 500 });
  }
}
