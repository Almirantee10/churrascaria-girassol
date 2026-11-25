import { adminLogin } from "@/lib/server/auth";

export async function GET() {
  const login = await adminLogin();
  return login ? Response.json({ login }) : Response.json({ erro: "Não autorizado." }, { status: 401 });
}
