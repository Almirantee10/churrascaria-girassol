import "server-only";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { readDoc, writeDoc } from "./db";

/**
 * Login do administrador.
 * - Credenciais iniciais: variáveis ADMIN_LOGIN e ADMIN_PASSWORD (configuradas na Vercel, fora do código).
 * - Quando o administrador troca a senha no painel, só o hash (scrypt + salt) fica salvo no armazenamento
 *   privado e passa a valer no lugar das variáveis. A senha nunca é gravada em texto.
 */
type AdminRec = { login: string; salt: string; hash: string };
const ADMIN_DOC = "admin.json";
const COOKIE = "girassol_admin";
const MAX_AGE = 60 * 60 * 12; // 12h

const key = () => createHash("sha256").update("girassol-session:" + (process.env.BLOB_READ_WRITE_TOKEN || process.env.ADMIN_PASSWORD || "dev-only-secret")).digest();
const hash = (pw: string, salt: string) => scryptSync(pw, salt, 32).toString("hex");
const same = (a: string, b: string) => {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
};

export async function saveCredentials(login: string, password: string) {
  const salt = randomBytes(16).toString("hex");
  await writeDoc<AdminRec>(ADMIN_DOC, { login, salt, hash: hash(password, salt) });
}

/** Login atual (o salvo no painel ou, na falta dele, o da variável de ambiente). */
async function current(): Promise<{ rec: AdminRec | null; login: string }> {
  const { data } = await readDoc<AdminRec>(ADMIN_DOC);
  return { rec: data, login: data?.login ?? process.env.ADMIN_LOGIN ?? "" };
}

export async function checkCredentials(login: string, password: string): Promise<boolean> {
  const { rec, login: cur } = await current();
  if (!cur) return false;
  const okLogin = same(login.trim().toLowerCase(), cur.toLowerCase());
  let okPass: boolean;
  if (rec) okPass = same(hash(password, rec.salt), rec.hash);
  else okPass = !!process.env.ADMIN_PASSWORD && same(password, process.env.ADMIN_PASSWORD);
  return okLogin && okPass;
}

export async function currentLogin() {
  return (await current()).login;
}

export async function startSession(login: string) {
  const token = await new SignJWT({ adm: true, login }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(key());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** Retorna o login do administrador logado, ou null. */
export async function adminLogin(): Promise<string | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, key(), { algorithms: ["HS256"] });
    return payload.adm ? String(payload.login ?? "") : null;
  } catch {
    return null;
  }
}

/* Limite simples de tentativas de login por IP (por instância do servidor). */
const tries = new Map<string, { n: number; t: number }>();
export function tooManyTries(ip: string) {
  const r = tries.get(ip);
  return !!r && Date.now() - r.t < 10 * 60_000 && r.n >= 8;
}
export function noteTry(ip: string, ok: boolean) {
  if (ok) { tries.delete(ip); return; }
  const r = tries.get(ip);
  if (!r || Date.now() - r.t > 10 * 60_000) tries.set(ip, { n: 1, t: Date.now() });
  else r.n++;
}
