import { adminLogin } from "@/lib/server/auth";
import { lerCatalogo, salvarCatalogo } from "@/lib/server/catalogo";

const no = () => Response.json({ erro: "Não autorizado." }, { status: 401 });

export async function GET() {
  if (!(await adminLogin())) return no();
  return Response.json(await lerCatalogo(), { headers: { "Cache-Control": "no-store" } });
}

/** Salva o cardápio inteiro (loja, categorias, itens, adicionais). Só o administrador. */
export async function PUT(req: Request) {
  if (!(await adminLogin())) return no();
  try {
    return Response.json(await salvarCatalogo(await req.json()));
  } catch {
    return Response.json({ erro: "Não foi possível salvar." }, { status: 500 });
  }
}
