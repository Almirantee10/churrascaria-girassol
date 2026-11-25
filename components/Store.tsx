"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { fmt } from "@/lib/data";
import type { Picks } from "@/lib/types";
import { emptyPicks, precoMarmita, problemas, resumo, useCatalog } from "./Catalog";

/** Uma marmita montada pelo cliente. Cada uma é individual (1 unidade). */
export type CartItem = { uid: string; picks: Picks; adicionais: string[]; obs: string };
export type Checkout = { custName: string; phone: string; delivery: "retirada" | "entrega"; address: string; coords: string; pay: string | null; troco: string; obsGeral: string };

type Ctx = {
  cart: CartItem[];
  /** Subtotal das marmitas (sem taxa de entrega). */
  subtotal: number;
  taxa: number;
  total: number;
  priceOf: (it: CartItem) => number;
  checkout: Checkout;
  setCheckout: (p: Partial<Checkout>) => void;
  patchItem: (uid: string, p: Partial<CartItem>) => void;
  removeItem: (uid: string) => void;
  duplicateItem: (uid: string) => void;
  clearCart: () => void;
  /** Rascunho da marmita que está sendo montada em /cardapio. */
  draft: Picks;
  draftAdic: string[];
  draftObs: string;
  setDraft: (p: Picks) => void;
  setDraftAdic: (a: string[]) => void;
  setDraftObs: (t: string) => void;
  editUid: string | null;
  startEdit: (uid: string) => void;
  cancelEdit: () => void;
  /** Adiciona (ou atualiza, se estiver editando) a marmita do rascunho. */
  saveDraft: () => "added" | "updated";
  toast: string | null;
  showToast: (t: string) => void;
  sent: string | null;
  setSent: (t: string | null) => void;
  /** Registra o pedido no servidor e prepara a mensagem do WhatsApp. Retorna erro (texto) se falhar. */
  sendOrder: () => Promise<string | null>;
  sending: boolean;
  hydrated: boolean;
};

const StoreCtx = createContext<Ctx>(null as unknown as Ctx);
export const useStore = () => useContext(StoreCtx);

const LS = "girassol-pedido-v2";
const EMPTY: Checkout = { custName: "", phone: "", delivery: "retirada", address: "", coords: "", pay: null, troco: "", obsGeral: "" };

export const burst = () => window.dispatchEvent(new CustomEvent("sds:burst"));
const uid = () => Date.now() + "-" + Math.random().toString(36).slice(2, 6);
const clone = (p: Picks): Picks => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v.slice()]));

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { cat } = useCatalog();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkout, setCo] = useState<Checkout>(EMPTY);
  const [draft, setDraft] = useState<Picks>({});
  const [draftAdic, setDraftAdic] = useState<string[]>([]);
  const [draftObs, setDraftObs] = useState("");
  const [editUid, setEditUid] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const tt = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- restoring the saved cart after hydration */
    try {
      const s = JSON.parse(localStorage.getItem(LS) || "null");
      if (s && Array.isArray(s.cart)) {
        setCart(s.cart.filter((it: CartItem) => it && it.picks && typeof it.picks === "object").map((it: CartItem) => ({ ...it, adicionais: it.adicionais ?? [] })));
        setCo({ ...EMPTY, ...s.checkout });
      }
    } catch {}
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(LS, JSON.stringify({ cart, checkout })); } catch {}
  }, [cart, checkout, hydrated]);

  const showToast = useCallback((t: string) => {
    clearTimeout(tt.current);
    setToast(t);
    tt.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const blank = useCallback(() => { setDraft(emptyPicks(cat)); setDraftAdic([]); setDraftObs(""); }, [cat]);

  const startEdit = useCallback((id: string) => {
    const it = cart.find((x) => x.uid === id);
    if (!it) return;
    setDraft({ ...emptyPicks(cat), ...clone(it.picks) });
    setDraftAdic(it.adicionais.slice());
    setDraftObs(it.obs);
    setEditUid(id);
  }, [cart, cat]);

  const cancelEdit = useCallback(() => { setEditUid(null); blank(); }, [blank]);

  const saveDraft = useCallback((): "added" | "updated" => {
    const picks = clone(draft);
    const adicionais = draftAdic.slice();
    const wasEdit = editUid;
    if (wasEdit) setCart((c) => c.map((it) => (it.uid === wasEdit ? { ...it, picks, adicionais, obs: draftObs } : it)));
    else setCart((c) => c.concat([{ uid: uid(), picks, adicionais, obs: draftObs }]));
    setEditUid(null);
    blank();
    burst();
    return wasEdit ? "updated" : "added";
  }, [draft, draftAdic, draftObs, editUid, blank]);

  const priceOf = useCallback((it: CartItem) => precoMarmita(cat, it.picks, it.adicionais), [cat]);
  const subtotal = useMemo(() => cart.reduce((a, it) => a + priceOf(it), 0), [cart, priceOf]);
  const taxa = checkout.delivery === "entrega" && cart.length ? cat.loja.taxaEntrega : 0;
  const total = Math.round((subtotal + taxa) * 100) / 100;

  const sendOrder = useCallback(async (): Promise<string | null> => {
    const L = cat.loja;
    if (!L.aberta) return L.mensagemFechada || "A loja está fechada no momento.";
    for (let i = 0; i < cart.length; i++) {
      const p = problemas(cat, cart[i].picks, cart[i].adicionais);
      if (p.length) return `Marmita ${i + 1}: ${p[0]}. Toque em Alterar para ajustar.`;
    }
    setSending(true);
    try {
      const r = await fetch("/api/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente: { nome: checkout.custName, telefone: checkout.phone },
          recebimento: checkout.delivery, endereco: checkout.address, coords: checkout.coords,
          pagamento: checkout.pay, troco: checkout.troco, obs: checkout.obsGeral,
          itens: cart.map((it) => ({ picks: it.picks, adicionais: it.adicionais, obs: it.obs })),
        }),
      });
      const j = await r.json();
      if (!r.ok) return j.erro || "Não foi possível enviar o pedido.";
      const LINE = "────────────────────";
      const ICON: Record<string, string> = { carne: "🥩", farofa: "🥣", salada: "🥗", acompanhamento: "🍚" };
      const M = [`🌻 *PEDIDO #${j.numero} — ${L.nome.toUpperCase()}*`, ""];
      if (checkout.custName.trim()) M.push("👤 *" + checkout.custName.trim() + "*");
      if (checkout.phone.trim()) M.push("📞 " + checkout.phone.trim());
      M.push("", LINE);
      cart.forEach((it, i) => {
        M.push("", `🍱 *Marmita ${i + 1}* — ${fmt(priceOf(it))}`);
        resumo(cat, it.picks).forEach(({ grupo, nomes }) => M.push(`   ${ICON[grupo.id] ?? "•"} ${grupo.label}: ${nomes.length ? nomes.join(", ") : "sem"}`));
        it.adicionais.forEach((id) => { const a = cat.adicionais.find((x) => x.id === id); if (a) M.push(`   ➕ ${a.nome} (+${fmt(a.preco)})`); });
        if (it.obs.trim()) M.push("   📝 Obs.: " + it.obs.trim());
      });
      M.push("", LINE, `🍱 ${cart.length} ${cart.length === 1 ? "marmita" : "marmitas"}: ${fmt(subtotal)}`);
      if (taxa > 0) M.push(`🚚 Entrega: ${fmt(taxa)}`);
      M.push("💰 *Total:* " + fmt(j.total), LINE, "");
      const F: string[] = [];
      if (checkout.delivery === "entrega") {
        F.push("🚚 *Recebimento:* Entrega");
        F.push("📍 *Endereço:* " + (checkout.address.trim() || (checkout.coords ? "ver localização abaixo" : "enviarei pelo WhatsApp")));
        if (checkout.coords) F.push("🗺️ *Localização no mapa:* https://www.google.com/maps?q=" + checkout.coords);
      } else F.push("🏪 *Recebimento:* Retirada no local");
      const pay = L.pagamentos.find((x) => x.id === checkout.pay);
      F.push("💳 *Pagamento:* " + (pay ? pay.label : "-") + (pay && /dinheiro/i.test(pay.label) && checkout.troco.trim() ? ` (troco para ${checkout.troco.trim()})` : ""));
      if (checkout.obsGeral.trim()) F.push("📝 *Observações:* " + checkout.obsGeral.trim());
      M.push(F.join("\n\n"), "", L.mensagemPedido);
      setSent(M.join("\n"));
      setCart([]);
      return null;
    } catch {
      return "Sem conexão. Verifique a internet e tente de novo.";
    } finally {
      setSending(false);
    }
  }, [cat, cart, checkout, priceOf, subtotal, taxa]);

  const value: Ctx = {
    cart, subtotal, taxa, total, priceOf, checkout, hydrated,
    setCheckout: (p) => setCo((c) => ({ ...c, ...p })),
    patchItem: (id, p) => setCart((c) => c.map((it) => (it.uid === id ? { ...it, ...p } : it))),
    removeItem: (id) => { setCart((c) => c.filter((x) => x.uid !== id)); if (editUid === id) cancelEdit(); },
    duplicateItem: (id) => setCart((c) => {
      const i = c.findIndex((x) => x.uid === id);
      if (i < 0) return c;
      const copy: CartItem = { uid: uid(), picks: clone(c[i].picks), adicionais: c[i].adicionais.slice(), obs: c[i].obs };
      return [...c.slice(0, i + 1), copy, ...c.slice(i + 1)];
    }),
    clearCart: () => { setCart([]); cancelEdit(); },
    draft, draftAdic, draftObs, setDraft, setDraftAdic, setDraftObs, editUid, startEdit, cancelEdit, saveDraft,
    toast, showToast, sent, setSent, sendOrder, sending,
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
