import { adminLogin } from "@/lib/server/auth";
import { listarPedidos } from "@/lib/server/pedidos";

export async function GET() {
  if (!(await adminLogin())) return Response.json({ erro: "Não autorizado." }, { status: 401 });
  return Response.json(await listarPedidos(), { headers: { "Cache-Control": "no-store" } });
}
