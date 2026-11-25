import { adminLogin } from "@/lib/server/auth";
import { PedidoErro, mudarStatus } from "@/lib/server/pedidos";
import type { Status } from "@/lib/types";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await adminLogin())) return Response.json({ erro: "Não autorizado." }, { status: 401 });
  const { id } = await ctx.params;
  const b = (await req.json().catch(() => ({}))) as { status?: Status };
  try {
    const p = await mudarStatus(id, b.status as Status);
    return p ? Response.json(p) : Response.json({ erro: "Pedido não encontrado." }, { status: 404 });
  } catch (e) {
    return Response.json({ erro: e instanceof PedidoErro ? e.message : "Erro ao atualizar." }, { status: 400 });
  }
}
