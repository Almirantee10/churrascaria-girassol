"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Banknote, Check, Copy, LocateFixed, MapPin, MessageSquare, Pencil, Phone, ShoppingBag, Trash2, User, UtensilsCrossed, X } from "lucide-react";
import { fmt } from "@/lib/data";
import { gsap, useGSAP, noMotion } from "@/lib/gsap";
import { problemas, resumo, useCatalog } from "@/components/Catalog";
import { useStore } from "@/components/Store";
import { WhatsAppIcon } from "@/components/Brand";
import { Button, Field, OptionRow, PriceTag, SectionHeading } from "@/components/ui";
import { CountUp, Reveal } from "@/components/Motion";

export default function Carrinho() {
  const { cat } = useCatalog();
  const { cart, subtotal, taxa, total, priceOf, checkout, setCheckout, patchItem, removeItem, duplicateItem, startEdit, clearCart, sendOrder, sending, hydrated } = useStore();
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<"idle" | "loading" | "error">("idle");
  const [geoMsg, setGeoMsg] = useState("");
  const [erro, setErro] = useState("");
  const L = cat.loja;
  const pagamentos = L.pagamentos.filter((p) => p.ativo);

  // se a opção escolhida deixou de existir (entrega/retirada/pagamento), ajusta sozinho
  useEffect(() => {
    if (checkout.delivery === "entrega" && !L.entrega && L.retirada) setCheckout({ delivery: "retirada" });
    if (checkout.delivery === "retirada" && !L.retirada && L.entrega) setCheckout({ delivery: "entrega" });
    if (checkout.pay && !pagamentos.some((p) => p.id === checkout.pay)) setCheckout({ pay: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [L.entrega, L.retirada, L.pagamentos]);

  const locate = () => {
    if (!navigator.geolocation) { setGeo("error"); setGeoMsg("Seu navegador não permite buscar a localização. Digite o endereço."); return; }
    setGeo("loading"); setGeoMsg("");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCheckout({ coords: pos.coords.latitude.toFixed(6) + "," + pos.coords.longitude.toFixed(6) }); setGeo("idle"); },
      (err) => { setGeo("error"); setGeoMsg(err.code === 1 ? "Permissão negada. Libere a localização no navegador ou digite o endereço." : "Não foi possível obter a localização. Digite o endereço."); },
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

  const tipos = cart.map((it) => problemas(cat, it.picks, it.adicionais));
  const bloqueado = !L.aberta || tipos.some((p) => p.length > 0);
  const cantSend = !checkout.pay || bloqueado || (!L.entrega && !L.retirada);
  const send = async () => {
    if (cantSend || !cart.length) return;
    setErro("");
    const e = await sendOrder();
    if (e) setErro(e);
  };

  return (
    <div className="cart" ref={root}>
      <div className="cart-head">
        <Link href="/cardapio" className="iconbtn" aria-label="Voltar para montar marmita"><ArrowLeft size={20} /></Link>
        <h1>Meu pedido</h1>
      </div>

      {!L.aberta && <div className="closed-box"><AlertTriangle size={20} /> <span><b>Loja fechada.</b> {L.mensagemFechada}</span></div>}

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
                    <small>{fmt(priceOf(it))}</small>
                    {resumo(cat, it.picks).map(({ grupo, nomes }) => (
                      <span className="fl" key={grupo.id}>{grupo.label}: <em>{nomes.length ? nomes.join(", ") : "sem"}</em></span>
                    ))}
                    {it.adicionais.length > 0 && <span className="fl">Adicionais: <em>{it.adicionais.map((id) => cat.adicionais.find((a) => a.id === id)?.nome).filter(Boolean).join(", ")}</em></span>}
                    {tipos[i].length > 0 && <span className="warn" style={{ textAlign: "left" }}>⚠ {tipos[i][0]}. Toque em Alterar.</span>}
                  </div>
                  <button className="iconbtn iconbtn-ghost" aria-label="Remover" onClick={() => remove(it.uid)}><Trash2 size={18} /></button>
                </div>
                <div className="citem-foot">
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Button variant="outline" size="sm" onClick={() => { startEdit(it.uid); router.push("/cardapio"); }}><Pencil size={14} /> <span>Alterar</span></Button>
                    <Button variant="ghost" size="sm" onClick={() => duplicateItem(it.uid)}><Copy size={14} /> <span>Repetir</span></Button>
                  </div>
                  <PriceTag value={priceOf(it)} />
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
              {L.retirada && <OptionRow type="radio" checked={checkout.delivery === "retirada"} label="Retirada no local" description="Você retira na churrascaria" onChange={() => setCheckout({ delivery: "retirada" })} />}
              {L.entrega && <OptionRow type="radio" checked={checkout.delivery === "entrega"} label="Entrega" description={L.taxaEntrega > 0 ? `Taxa de entrega: ${fmt(L.taxaEntrega)}` : "Levamos até você"} onChange={() => setCheckout({ delivery: "entrega" })} />}
              {!L.entrega && !L.retirada && <p className="warn">No momento não estamos recebendo pedidos.</p>}
            </div>
            {checkout.delivery === "entrega" && L.entrega && (
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
                <p className="note" style={{ textAlign: "left" }}>Usamos a localização apenas para enviar o ponto de entrega no seu pedido.</p>
              </div>
            )}
            <div className="grp">
              <span className="lbl">Forma de pagamento</span>
              {pagamentos.map((o) => <OptionRow key={o.id} type="radio" checked={checkout.pay === o.id} label={o.label} onChange={() => setCheckout({ pay: o.id })} />)}
            </div>
            {pagamentos.find((p) => p.id === checkout.pay && /dinheiro/i.test(p.label)) && (
              <Field label="Troco para (opcional)" icon={<Banknote size={18} />} placeholder="Ex.: R$ 50,00" value={checkout.troco} onChange={(e) => setCheckout({ troco: e.target.value })} />
            )}
            <Field label="Observações do pedido (opcional)" multiline placeholder="Recados para a cozinha, horário desejado..." value={checkout.obsGeral} onChange={(e) => setCheckout({ obsGeral: e.target.value })} />
            <div className="sum-lines">
              <div><span>{cart.length} {cart.length === 1 ? "marmita" : "marmitas"}</span><span>{fmt(subtotal)}</span></div>
              {taxa > 0 && <div><span>Taxa de entrega</span><span>{fmt(taxa)}</span></div>}
            </div>
            <div className="total-row">
              <span>Total</span>
              <CountUp value={total} format={fmt} className="price price-lg" />
            </div>
            {!L.aberta && <p className="warn">Loja fechada no momento. {L.mensagemFechada}</p>}
            <Button variant="whatsapp" size="lg" full disabled={cantSend || sending} onClick={send}><WhatsAppIcon size={22} /> <span>{sending ? "Enviando..." : "Enviar pedido pelo WhatsApp"}</span></Button>
            {L.aberta && !checkout.pay && <p className="warn" style={{ marginTop: -10 }}>Escolha a forma de pagamento para enviar.</p>}
            {erro && <p className="warn" role="alert" style={{ marginTop: -10, fontWeight: 700 }}>{erro}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
