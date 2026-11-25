import { checkCredentials, currentLogin, noteTry, startSession, tooManyTries } from "@/lib/server/auth";

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  if (tooManyTries(ip)) return Response.json({ erro: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
  const b = (await req.json().catch(() => ({}))) as { login?: string; senha?: string };
  const ok = await checkCredentials(String(b.login ?? ""), String(b.senha ?? ""));
  noteTry(ip, ok);
  if (!ok) return Response.json({ erro: "Login ou senha incorretos." }, { status: 401 });
  await startSession(await currentLogin());
  return Response.json({ ok: true });
}
