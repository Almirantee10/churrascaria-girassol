"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, PAY, PRICE, emptyPicks, fmt, type Picks } from "@/lib/data";

/** Uma marmita montada pelo cliente. Cada uma é individual (1 unidade). */
export type CartItem = { uid: string; picks: Picks; obs: string };
export type Checkout = { custName: string; phone: string; delivery: "retirada" | "entrega"; address: string; coords: string; pay: string | null; troco: string; obsGeral: string };

type Ctx = {
  cart: CartItem[];
  total: number;
  checkout: Checkout;
  setCheckout: (p: Partial<Checkout>) => void;
  patchItem: (uid: string, p: Partial<CartItem>) => void;
  removeItem: (uid: string) => void;
  duplicateItem: (uid: string) => void;
  clearCart: () => void;
  /** Rascunho da marmita que está sendo montada em /cardapio. */
  draft: Picks;
  draftObs: string;
  setDraft: (p: Picks) => void;
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
  buildMessage: () => string;
  hydrated: boolean;
};

const StoreCtx = createContext<Ctx>(null as unknown as Ctx);
export const useStore = () => useContext(StoreCtx);

const LS = "girassol-pedido-v1";
const EMPTY: Checkout = { custName: "", phone: "", delivery: "retirada", address: "", coords: "", pay: null, troco: "", obsGeral: "" };

export const burst = () => window.dispatchEvent(new CustomEvent("sds:burst"));
const uid = () => Date.now() + "-" + Math.random().toString(36).slice(2, 6);
const clone = (p: Picks): Picks => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v.slice()]));

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkout, setCo] = useState<Checkout>(EMPTY);
  const [draft, setDraft] = useState<Picks>(emptyPicks);
  const [draftObs, setDraftObs] = useState("");
  const [editUid, setEditUid] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const tt = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- restoring the saved cart after hydration */
    try {
      const s = JSON.parse(localStorage.getItem(LS) || "null");
      if (s && Array.isArray(s.cart)) {
        // ignora itens salvos em formato antigo
        setCart(s.cart.filter((it: CartItem) => it && it.picks && typeof it.picks === "object"));
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

  const startEdit = useCallback((id: string) => {
    const it = cart.find((x) => x.uid === id);
    if (!it) return;
    setDraft({ ...emptyPicks(), ...clone(it.picks) });
    setDraftObs(it.obs);
    setEditUid(id);
  }, [cart]);

  const cancelEdit = useCallback(() => {
    setEditUid(null);
    setDraft(emptyPicks());
    setDraftObs("");
  }, []);

  const saveDraft = useCallback((): "added" | "updated" => {
    const picks = clone(draft);
    const wasEdit = editUid;
    if (wasEdit) setCart((c) => c.map((it) => (it.uid === wasEdit ? { ...it, picks, obs: draftObs } : it)));
    else setCart((c) => c.concat([{ uid: uid(), picks, obs: draftObs }]));
    setEditUid(null);
    setDraft(emptyPicks());
    setDraftObs("");
    burst();
    return wasEdit ? "updated" : "added";
  }, [draft, draftObs, editUid]);

  const total = useMemo(() => cart.length * PRICE, [cart]);

  const buildMessage = useCallback(() => {
    const LINE = "────────────────────";
    const ICON: Record<string, string> = { carne: "🥩", salada: "🥗", acompanhamento: "🍚" };
    const L = ["🌻 *PEDIDO — CHURRASCARIA GIRASSOL*", ""];
    if (checkout.custName.trim()) L.push("👤 *" + checkout.custName.trim() + "*");
    if (checkout.phone.trim()) L.push("📞 " + checkout.phone.trim());
    L.push("", LINE);
    cart.forEach((it, i) => {
      L.push("", `🍱 *Marmita ${i + 1}* — ${fmt(PRICE)}`);
      CATEGORIES.forEach((c) => {
        const v = it.picks[c.id] ?? [];
        L.push(`   ${ICON[c.id] ?? "•"} ${c.label}: ${v.length ? v.join(", ") : "sem"}`);
      });
      if (it.obs.trim()) L.push("   📝 Obs.: " + it.obs.trim());
    });
    L.push("", LINE, `🍱 ${cart.length} ${cart.length === 1 ? "marmita" : "marmitas"} × ${fmt(PRICE)}`, "💰 *Total:* " + fmt(total), LINE, "");
    // cada campo é um parágrafo (linha em branco entre eles)
    const F: string[] = [];
    if (checkout.delivery === "entrega") {
      F.push("🚚 *Recebimento:* Entrega");
      F.push("📍 *Endereço:* " + (checkout.address.trim() || (checkout.coords ? "ver localização abaixo" : "enviarei pelo WhatsApp")));
      if (checkout.coords) F.push("🗺️ *Localização no mapa:* https://www.google.com/maps?q=" + checkout.coords);
    } else {
      F.push("🏪 *Recebimento:* Retirada no local");
    }
    const pay = PAY.find((x) => x.id === checkout.pay);
    F.push("💳 *Pagamento:* " + (pay ? pay.label : "-") + (checkout.pay === "dinheiro" && checkout.troco.trim() ? ` (troco para ${checkout.troco.trim()})` : ""));
    if (checkout.obsGeral.trim()) F.push("📝 *Observações:* " + checkout.obsGeral.trim());
    L.push(F.join("\n\n"), "", "Aguardo a confirmação do pedido. Obrigado! 🙏");
    return L.join("\n");
  }, [cart, checkout, total]);

  const value: Ctx = {
    cart, total, checkout, hydrated,
    setCheckout: (p) => setCo((c) => ({ ...c, ...p })),
    patchItem: (id, p) => setCart((c) => c.map((it) => (it.uid === id ? { ...it, ...p } : it))),
    removeItem: (id) => {
      setCart((c) => c.filter((x) => x.uid !== id));
      if (editUid === id) cancelEdit();
    },
    duplicateItem: (id) => setCart((c) => {
      const i = c.findIndex((x) => x.uid === id);
      if (i < 0) return c;
      const copy: CartItem = { uid: uid(), picks: clone(c[i].picks), obs: c[i].obs };
      return [...c.slice(0, i + 1), copy, ...c.slice(i + 1)];
    }),
    clearCart: () => { setCart([]); cancelEdit(); },
    draft, draftObs, setDraft, setDraftObs, editUid, startEdit, cancelEdit, saveDraft,
    toast, showToast, sent, setSent, buildMessage,
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
