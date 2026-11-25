import "server-only";
import { DEFAULT_CATALOGO } from "../defaults";
import type { Adicional, Catalogo, Grupo, Item, Loja } from "../types";
import { readDoc, writeDoc } from "./db";

const DOC = "catalogo.json";

export async function lerCatalogo(): Promise<Catalogo> {
  const { data } = await readDoc<Catalogo>(DOC);
  if (!data) return DEFAULT_CATALOGO;
  // completa campos novos com os padrões (se a loja ganhar novas opções no futuro)
  return { ...data, loja: { ...DEFAULT_CATALOGO.loja, ...data.loja } };
}

const s = (v: unknown, max = 400) => String(v ?? "").slice(0, max);
const n = (v: unknown, min = 0, max = 100000) => {
  const x = Number(v);
  return Number.isFinite(x) ? Math.min(max, Math.max(min, Math.round(x * 100) / 100)) : min;
};
const b = (v: unknown) => v === true;
/** Imagem: URL http(s) ou data URL de imagem (até ~350 KB). */
const img = (v: unknown) => {
  const t = String(v ?? "");
  if (!t) return "";
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/.test(t) && t.length <= 480_000) return t;
  if (/^https?:\/\//.test(t) && t.length <= 600) return t;
  return "";
};
const color = (v: unknown, d: string) => (/^#[0-9a-fA-F]{6}$/.test(String(v)) ? String(v) : d);
const id = (v: unknown) => s(v, 60).replace(/[^a-zA-Z0-9_-]/g, "") || Math.random().toString(36).slice(2, 10);

/** Valida e limpa o que veio do painel antes de salvar. */
export function limpar(raw: unknown): Catalogo {
  const r = (raw ?? {}) as Record<string, unknown>;
  const L = (r.loja ?? {}) as Record<string, unknown>;
  const D = DEFAULT_CATALOGO.loja;
  const loja: Loja = {
    nome: s(L.nome, 80) || D.nome,
    slogan: s(L.slogan, 120),
    descricao: s(L.descricao, 500),
    telefone: s(L.telefone, 30),
    whatsapp: s(L.whatsapp, 20).replace(/\D/g, "") || D.whatsapp,
    endereco: s(L.endereco, 200),
    mapsUrl: /^https?:\/\//.test(s(L.mapsUrl, 500)) ? s(L.mapsUrl, 500) : "",
    aberta: b(L.aberta),
    mensagemFechada: s(L.mensagemFechada, 300),
    aviso: s(L.aviso, 300),
    horario: s(L.horario, 300),
    taxaEntrega: n(L.taxaEntrega),
    entrega: b(L.entrega),
    retirada: b(L.retirada),
    pagamentos: (Array.isArray(L.pagamentos) ? L.pagamentos : []).slice(0, 12).map((p: Record<string, unknown>) => ({ id: id(p.id), label: s(p.label, 40), ativo: b(p.ativo) })).filter((p) => p.label),
    preco: n(L.preco),
    logo: img(L.logo),
    banner: img(L.banner),
    corDestaque: color(L.corDestaque, D.corDestaque),
    corTexto: color(L.corTexto, D.corTexto),
    heroTitulo: s(L.heroTitulo, 120),
    heroTexto: s(L.heroTexto, 400),
    ctaTitulo: s(L.ctaTitulo, 120),
    ctaTexto: s(L.ctaTexto, 400),
    mensagemPedido: s(L.mensagemPedido, 200),
  };
  const grupos: Grupo[] = (Array.isArray(r.grupos) ? r.grupos : []).slice(0, 20).map((g: Record<string, unknown>) => {
    const max = Math.max(1, Math.round(n(g.max, 1, 50)));
    return { id: id(g.id), label: s(g.label, 40) || "Categoria", titulo: s(g.titulo, 80) || s(g.label, 40) || "Categoria", dica: s(g.dica, 160), min: Math.min(max, Math.round(n(g.min, 0, 50))), max, ativo: b(g.ativo) };
  });
  const ids = new Set(grupos.map((g) => g.id));
  const itens: Item[] = (Array.isArray(r.itens) ? r.itens : []).slice(0, 400).map((i: Record<string, unknown>) => ({
    id: id(i.id), grupoId: s(i.grupoId, 60), nome: s(i.nome, 80), descricao: s(i.descricao, 300), imagem: img(i.imagem), disponivel: b(i.disponivel), precoExtra: n(i.precoExtra),
  })).filter((i) => i.nome && ids.has(i.grupoId));
  const adicionais: Adicional[] = (Array.isArray(r.adicionais) ? r.adicionais : []).slice(0, 100).map((a: Record<string, unknown>) => ({
    id: id(a.id), nome: s(a.nome, 80), descricao: s(a.descricao, 300), imagem: img(a.imagem), preco: n(a.preco), disponivel: b(a.disponivel),
  })).filter((a) => a.nome);
  return { loja, grupos, itens, adicionais };
}

export async function salvarCatalogo(raw: unknown): Promise<Catalogo> {
  const c = limpar(raw);
  await writeDoc(DOC, c);
  return c;
}
