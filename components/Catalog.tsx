"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_CATALOGO } from "@/lib/defaults";
import type { Catalogo, Grupo, Picks } from "@/lib/types";

type Ctx = { cat: Catalogo; loaded: boolean; refresh: () => Promise<void> };
const CatalogCtx = createContext<Ctx>({ cat: DEFAULT_CATALOGO, loaded: false, refresh: async () => {} });
export const useCatalog = () => useContext(CatalogCtx);

const POLL_MS = 5000; // o cardápio e o status da loja se atualizam sozinhos a cada 5 s

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [cat, setCat] = useState<Catalogo>(DEFAULT_CATALOGO);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/catalogo", { cache: "no-store" });
      if (!r.ok) return;
      const next = (await r.json()) as Catalogo;
      setCat((cur) => (JSON.stringify(cur) === JSON.stringify(next) ? cur : next));
      setLoaded(true);
    } catch {}
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial após a hidratação
    refresh();
    const t = setInterval(() => { if (document.visibilityState === "visible") refresh(); }, POLL_MS);
    const vis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, [refresh]);

  const L = cat.loja;
  const css = `:root{--sds-gold-500:${L.corDestaque};--sds-gold-400:${L.corTexto};--sds-gold-foil:linear-gradient(180deg,color-mix(in srgb,${L.corDestaque} 82%,#fff) 0%,${L.corDestaque} 55%,color-mix(in srgb,${L.corDestaque} 88%,#000) 100%);--sds-gold-600:color-mix(in srgb,${L.corDestaque} 85%,#000);--sds-gold-300:color-mix(in srgb,${L.corTexto} 85%,#fff)}`;
  const value = useMemo(() => ({ cat, loaded, refresh }), [cat, loaded, refresh]);
  return (
    <CatalogCtx.Provider value={value}>
      <style>{css}</style>
      {children}
    </CatalogCtx.Provider>
  );
}

/* ----------------------------------------------------------------- helpers */
export const gruposAtivos = (c: Catalogo): Grupo[] => c.grupos.filter((g) => g.ativo);

export const emptyPicks = (c: Catalogo): Picks => Object.fromEntries(gruposAtivos(c).map((g) => [g.id, [] as string[]]));

/** Grupos em que ainda faltam escolhas obrigatórias. */
export const faltando = (c: Catalogo, p: Picks) => gruposAtivos(c).filter((g) => (p[g.id]?.length ?? 0) < g.min);

/** Preço de uma marmita: preço base + extras de opções pagas + adicionais. */
export function precoMarmita(c: Catalogo, picks: Picks, adicionais: string[]): number {
  let v = c.loja.preco;
  for (const g of gruposAtivos(c)) for (const id of picks[g.id] ?? []) v += c.itens.find((i) => i.id === id)?.precoExtra ?? 0;
  for (const id of adicionais) v += c.adicionais.find((a) => a.id === id)?.preco ?? 0;
  return Math.round(v * 100) / 100;
}

/** Nomes escolhidos por grupo (ignora itens que o administrador removeu). */
export function resumo(c: Catalogo, picks: Picks) {
  return gruposAtivos(c).map((g) => ({
    grupo: g,
    nomes: (picks[g.id] ?? []).map((id) => c.itens.find((i) => i.id === id)?.nome).filter(Boolean) as string[],
  }));
}

/** Problemas da marmita com o cardápio atual (item removido, indisponível ou regra não cumprida). */
export function problemas(c: Catalogo, picks: Picks, adicionais: string[]): string[] {
  const out: string[] = [];
  for (const g of gruposAtivos(c)) {
    const ids = picks[g.id] ?? [];
    for (const id of ids) {
      const it = c.itens.find((i) => i.id === id && i.grupoId === g.id);
      if (!it) out.push(`uma opção de ${g.label.toLowerCase()} saiu do cardápio`);
      else if (!it.disponivel) out.push(`"${it.nome}" está indisponível`);
    }
    if (ids.length < g.min) out.push(`falta escolher ${g.label.toLowerCase()}`);
  }
  for (const id of adicionais) {
    const a = c.adicionais.find((x) => x.id === id);
    if (!a) out.push("um adicional saiu do cardápio");
    else if (!a.disponivel) out.push(`"${a.nome}" está indisponível`);
  }
  return out;
}
