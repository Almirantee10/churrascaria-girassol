import "server-only";
import { get, put, list } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";

/**
 * Armazenamento JSON. Em produção usa o Vercel Blob (store privado, token vindo
 * da variável BLOB_READ_WRITE_TOKEN). Sem o token (desenvolvimento local),
 * grava em arquivos dentro de .data/ (pasta ignorada pelo git).
 */
const blobAtivo = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL = path.join(process.cwd(), ".data");

export type Doc<T> = { data: T | null; etag: string | null };

export async function readDoc<T>(name: string): Promise<Doc<T>> {
  if (blobAtivo()) {
    const r = await get(name, { access: "private", useCache: false });
    if (!r || r.statusCode !== 200) return { data: null, etag: null };
    return { data: (await new Response(r.stream).json()) as T, etag: r.blob.etag };
  }
  try {
    const txt = await fs.readFile(path.join(LOCAL, name), "utf8");
    return { data: JSON.parse(txt) as T, etag: String(txt.length) + ":" + txt.slice(-24) };
  } catch {
    return { data: null, etag: null };
  }
}

/** Grava o documento. Com `etag`, só grava se ninguém alterou desde a leitura (retorna false se houve conflito). */
export async function writeDoc<T>(name: string, data: T, etag?: string | null): Promise<boolean> {
  const body = JSON.stringify(data);
  if (blobAtivo()) {
    try {
      await put(name, body, {
        access: "private",
        contentType: "application/json",
        allowOverwrite: true,
        addRandomSuffix: false,
        cacheControlMaxAge: 60,
        ...(etag ? { ifMatch: etag } : {}),
      });
      return true;
    } catch (e) {
      if (e instanceof Error && /precondition|etag|412/i.test(e.name + e.message)) return false;
      throw e;
    }
  }
  const file = path.join(LOCAL, name);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, body, "utf8");
  return true;
}

/** Lê, altera e grava com tentativas em caso de conflito. */
export async function updateDoc<T>(name: string, fallback: () => T, mutate: (d: T) => T | void, tries = 5): Promise<T> {
  for (let i = 0; i < tries; i++) {
    const { data, etag } = await readDoc<T>(name);
    const base = data ?? fallback();
    const next = (mutate(base) as T | undefined) ?? base;
    if (await writeDoc(name, next, etag)) return next;
  }
  throw new Error("Não foi possível salvar (conflito). Tente novamente.");
}

export async function listDocs(prefix: string): Promise<string[]> {
  if (blobAtivo()) {
    const out: string[] = [];
    let cursor: string | undefined;
    do {
      const r = await list({ prefix, cursor, limit: 1000 });
      out.push(...r.blobs.map((b) => b.pathname));
      cursor = r.hasMore ? r.cursor : undefined;
    } while (cursor);
    return out;
  }
  try {
    const folder = prefix.endsWith("/") ? prefix.slice(0, -1) : path.posix.dirname(prefix);
    const base = prefix.endsWith("/") ? "" : path.posix.basename(prefix);
    return (await fs.readdir(path.join(LOCAL, folder))).filter((f) => f.startsWith(base)).map((f) => path.posix.join(folder, f));
  } catch {
    return [];
  }
}
