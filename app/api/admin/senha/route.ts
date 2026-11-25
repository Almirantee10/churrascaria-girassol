import { adminLogin, checkCredentials, saveCredentials, startSession } from "@/lib/server/auth";

/** Troca login e/ou senha. Exige a senha atual. */
export async function POST(req: Request) {
  const atual = await adminLogin();
  if (!atual) return Response.json({ erro: "Não autorizado." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { senhaAtual?: string; novoLogin?: string; novaSenha?: string };
  if (!(await checkCredentials(atual, String(b.senhaAtual ?? "")))) return Response.json({ erro: "Senha atual incorreta." }, { status: 403 });
  const login = String(b.novoLogin ?? "").trim() || atual;
  const senha = String(b.novaSenha ?? "");
  if (login.length < 3) return Response.json({ erro: "O login precisa ter pelo menos 3 caracteres." }, { status: 400 });
  if (senha.length < 8) return Response.json({ erro: "A nova senha precisa ter pelo menos 8 caracteres." }, { status: 400 });
  await saveCredentials(login, senha);
  await startSession(login);
  return Response.json({ ok: true, login });
}
