"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Banknote, Check, Copy, LocateFixed, MapPin, MessageSquare, Pencil, Phone, ShoppingBag, Trash2, User, UtensilsCrossed, X } from "lucide-react";
import { CATEGORIES, PAY, PRICE, fmt } from "@/lib/data";
import { gsap, useGSAP, noMotion } from "@/lib/gsap";
import { useStore } from "@/components/Store";
import { WhatsAppIcon } from "@/components/Brand";
import { Button, Field, OptionRow, PriceTag, SectionHeading } from "@/components/ui";
import { CountUp, Reveal } from "@/components/Motion";

export default function Carrinho() {
  const { cart, total, checkout, setCheckout, patchItem, removeItem, duplicateItem, startEdit, clearCart, setSent, buildMessage, hydrated } = useStore();
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<"idle" | "loading" | "error">("idle");
  const [geoMsg, setGeoMsg] = useState("");

  const locate = () => {
    if (!navigator.geolocation) { setGeo("error"); setGeoMsg("Seu navegador não permite buscar a localização. Digite o endereço."); return; }
    setGeo("loading"); setGeoMsg("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCheckout({ coords: pos.coords.latitude.toFixed(6) + "," + pos.coords.longitude.toFixed(6) });
        setGeo("idle");
      },
      (err) => {
        setGeo("error");
        setGeoMsg(err.code === 1 ? "Permissão negada. Libere a localização no navegador ou digite o endereço." : "Não foi possível obter a localização. Digite o endereço.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  useGSAP(() => {
    if (!hydrated || noMotion()) return;
    gsap.fromTo(".citem", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "expo.out", clearProps: "transform" });
    gsap.fromTo(".checkout", { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 1, delay: 0.15, ease: "expo.out", clearProps: "transform" });
  }, { scope: root, dependencies: [hydrated, cart.length === 0] });

  const remove = (uid: string) => {
    const el = document.querySelector<HTMLElement>(`[data-uid="${uid}"]`);
    if (!el || noMotion()) { removeItem(uid); return; }
    gsap.to(el, { x: 80, opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, marginBottom: -12, duration: 0.5, ease: "power3.in", onComplete: () => removeItem(uid) });
  };

  const cantSend = !checkout.pay;
  const send = () => { if (cantSend || !cart.length) return; setSent(buildMessage()); };

  return (
    <div className="cart" ref={root}>
      <div className="cart-head">
        <Link href="/cardapio" className="iconbtn" aria-label="Voltar para montar marmita"><ArrowLeft size={20} /></Link>
        <h1>Meu pedido</h1>
      </div>

      {hydrated && cart.length === 0 && (
        <Reveal className="empty">
          <ShoppingBag size={40} />
          <p className="lead" style={{ fontSize: 17 }}>Seu pedido está vazio. Que tal montar sua marmita?</p>
          <Button href="/cardapio">Montar minha marmita</Button>
        </Reveal>
      )}

      {cart.length > 0 && (
        <div className="cart-grid">
          <div className="cart-list">
            {cart.map((it, i) => (
              <div className="citem" key={it.uid} data-uid={it.uid}>
                <div className="citem-top">
                  <div className="pcard-img ico" style={{ width: 56, height: 56 }}><UtensilsCrossed size={24} /></div>
                  <div className="citem-info">
                    <b>Marmita {i + 1}</b>
                    <small>{fmt(PRICE)}</small>
                    {CATEGORIES.map((c) => {
                      const v = it.picks[c.id] ?? [];
                      return <span className="fl" key={c.id}>{c.label}: <em>{v.length ? v.join(", ") : "sem"}</em></span>;
                    })}
                  </div>
                  <button className="iconbtn iconbtn-ghost" aria-label="Remover" onClick={() => remove(it.uid)}><Trash2 size={18} /></button>
                </div>
                <div className="citem-foot">
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Button variant="outline" size="sm" onClick={() => { startEdit(it.uid); router.push("/cardapio"); }}><Pencil size={14} /> <span>Alterar</span></Button>
                    <Button variant="ghost" size="sm" onClick={() => duplicateItem(it.uid)}><Copy size={14} /> <span>Repetir</span></Button>
                  </div>
                  <PriceTag value={PRICE} />
                </div>
                <Field icon={<MessageSquare size={18} />} placeholder="Observação desta marmita (opcional)" value={it.obs} onChange={(e) => patchItem(it.uid, { obs: e.target.value })} />
              </div>
            ))}
            <div><Button variant="ghost" size="sm" onClick={clearCart}><Trash2 size={16} /> <span>Limpar pedido</span></Button> <Button variant="outline" size="sm" href="/cardapio"><span>+ Montar outra marmita</span></Button></div>
          </div>

          <div className="checkout">
            <SectionHeading align="left">Finalizar</SectionHeading>
            <Field label="Seu nome (opcional)" icon={<User size={18} />} placeholder="Como podemos te chamar?" value={checkout.custName} onChange={(e) => setCheckout({ custName: e.target.value })} />
            <Field label="Telefone para contato (opcional)" icon={<Phone size={18} />} type="tel" inputMode="tel" autoComplete="tel" placeholder="(63) 90000-0000" value={checkout.phone} onChange={(e) => setCheckout({ phone: e.target.value })} />
            <div className="grp">
              <span className="lbl">Recebimento</span>
              <OptionRow type="radio" checked={checkout.delivery === "retirada"} label="Retirada no local" description="Você retira na churrascaria" onChange={() => setCheckout({ delivery: "retirada" })} />
              <OptionRow type="radio" checked={checkout.delivery === "entrega"} label="Entrega" description="Levamos até você" onChange={() => setCheckout({ delivery: "entrega" })} />
            </div>
            {checkout.delivery === "entrega" && (
              <div className="grp">
                <Field label="Endereço de entrega (opcional)" icon={<MapPin size={18} />} placeholder="Rua, número, bairro, referência" value={checkout.address} onChange={(e) => setCheckout({ address: e.target.value })} />
                {checkout.coords ? (
                  <div className="geo-ok">
                    <Check size={16} /> <span>Localização atual anexada ao pedido</span>
                    <button type="button" className="iconbtn iconbtn-ghost" aria-label="Remover localização" onClick={() => setCheckout({ coords: "" })}><X size={16} /></button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" full onClick={locate} disabled={geo === "loading"}><LocateFixed size={16} /> <span>{geo === "loading" ? "Buscando localização..." : "Usar minha localização atual"}</span></Button>
                )}
                {geo === "error" && <p className="warn" style={{ textAlign: "left" }}>{geoMsg}</p>}
                <p className="note" style={{ textAlign: "left" }}>Usamos a localização apenas para enviar o ponto de entrega no seu pedido pelo WhatsApp.</p>
              </div>
            )}
            <div className="grp">
              <span className="lbl">Forma de pagamento</span>
              {PAY.map((o) => <OptionRow key={o.id} type="radio" checked={checkout.pay === o.id} label={o.label} onChange={() => setCheckout({ pay: o.id })} />)}
            </div>
            {checkout.pay === "dinheiro" && (
              <Field label="Troco para (opcional)" icon={<Banknote size={18} />} placeholder="Ex.: R$ 200,00" value={checkout.troco} onChange={(e) => setCheckout({ troco: e.target.value })} />
            )}
            <Field label="Observações do pedido (opcional)" multiline placeholder="Recados para a cozinha, horário desejado..." value={checkout.obsGeral} onChange={(e) => setCheckout({ obsGeral: e.target.value })} />
            <div className="total-row">
              <span>Total · {cart.length} {cart.length === 1 ? "marmita" : "marmitas"} × {fmt(PRICE)}</span>
              <CountUp value={total} format={fmt} className="price price-lg" />
            </div>
            <p className="note" style={{ textAlign: "left", marginTop: -10 }}>Taxa de entrega, se houver, é combinada pelo WhatsApp.</p>
            <Button variant="whatsapp" size="lg" full disabled={cantSend} onClick={send}><WhatsAppIcon size={22} /> <span>Enviar pedido pelo WhatsApp</span></Button>
            {cantSend && <p className="warn" style={{ marginTop: -10 }}>Escolha a forma de pagamento para enviar.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
