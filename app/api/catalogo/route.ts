import { lerCatalogo } from "@/lib/server/catalogo";

/** Cardápio público (sempre atualizado). */
export async function GET() {
  return Response.json(await lerCatalogo(), { headers: { "Cache-Control": "no-store" } });
}
