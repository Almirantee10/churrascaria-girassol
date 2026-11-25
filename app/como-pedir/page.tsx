"use client";

import { useRef, useState } from "react";
import { CalendarCheck, ChevronDown, ListChecks, MapPin, MessageCircle } from "lucide-react";
import { fmt, waUrl } from "@/lib/data";
import { useCatalog } from "@/components/Catalog";
import { gsap, useGSAP, noMotion } from "@/lib/gsap";
import { Reveal, SplitWords, Stagger } from "@/components/Motion";
import { Button, SectionHeading } from "@/components/ui";
import { WhatsAppIcon } from "@/components/Brand";

const steps = [
  { n: 1, Icon: ListChecks, title: "Monte sua marmita", text: "Escolha a carne, a salada e os acompanhamentos. Confira o resumo e adicione ao pedido." },
  { n: 2, Icon: MessageCircle, title: "Envie pelo WhatsApp", text: "Escolha retirada ou entrega e a forma de pagamento. O pedido chega organizado no nosso WhatsApp." },
  { n: 3, Icon: CalendarCheck, title: "Retire ou receba", text: "Confirmamos o seu pedido e combinamos a retirada ou a entrega." },
];
const makeFaq = (preco: number, entrega: boolean, retirada: boolean) => [
  { q: "Quanto custa a marmita?", a: `Cada marmita custa ${fmt(preco)}. Alguns itens ou adicionais podem ter valor extra, sempre indicado ao lado da opção, e o total aparece antes de você enviar o pedido.` },
  { q: "Posso pedir mais de uma marmita?", a: "Pode. Monte cada marmita individualmente, com combinações diferentes, ou use o botão Repetir no pedido para copiar uma marmita." },
  { q: "Posso mudar minha escolha antes de finalizar?", a: "Pode. No resumo da marmita, e também no pedido, toque em Alterar para mudar qualquer item antes de enviar." },
  { q: "Vocês entregam?", a: entrega && retirada ? "Você escolhe retirada ou entrega ao finalizar o pedido. A taxa de entrega, se houver, aparece no resumo do pedido." : entrega ? "Sim, fazemos entrega. A taxa, se houver, aparece no resumo do pedido." : "No momento atendemos só com retirada no local." },
  { q: "Quais são as formas de pagamento?", a: "Pix, cartão de crédito, cartão de débito ou dinheiro. Você escolhe ao finalizar o pedido." },
];

export default function ComoPedir() {
  const { cat } = useCatalog();
  const L = cat.loja;
  const faq = makeFaq(L.preco, L.entrega, L.retirada);
  const [open, setOpen] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP({ scope: root });

  // the gold line that links the three steps draws as you scroll
  useGSAP(() => {
    if (noMotion()) return;
    gsap.fromTo(".steps-line", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".steps", start: "top 75%", end: "bottom 60%", scrub: 0.6 } });
    gsap.fromTo(".step-n", { scale: 0, rotate: -90 }, { scale: 1, rotate: 0, duration: 0.9, stagger: 0.18, ease: "back.out(2)", scrollTrigger: { trigger: ".steps", start: "top 80%", once: true } });
  }, { scope: root });

  const toggle = contextSafe((i: number) => {
    const items = gsap.utils.toArray<HTMLElement>(".faq-a");
    const next = open === i ? -1 : i;
    items.forEach((el, k) => gsap.to(el, { height: k === next ? "auto" : 0, duration: 0.6, ease: "expo.out" }));
    setOpen(next);
  });

  return (
    <div ref={root}>
      <section className="section" style={{ paddingBottom: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14 }}>
          <SplitWords text="Como pedir" className="serif-title" style={{ font: "700 clamp(38px,6vw,60px)/1.1 var(--font-serif)", color: "var(--sds-gold-400)" }} />
          <Reveal delay={0.3}><p className="lead" style={{ fontSize: 18, maxWidth: 560 }}>Três passos e a sua marmita está a caminho.</p></Reveal>
        </div>
        <div style={{ position: "relative" }}>
          <div className="steps-line" aria-hidden />
          <Stagger className="steps">
            {steps.map(({ n, Icon, title, text }) => (
              <div className="step" key={n}>
                <div className="step-top"><div className="step-n">{n}</div><Icon size={22} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </Stagger>
        </div>
      </section>

      <section style={{ maxWidth: 820, margin: "0 auto", padding: "16px 20px 72px", display: "flex", flexDirection: "column", gap: 28 }}>
        <SectionHeading>Dúvidas frequentes</SectionHeading>
        <Stagger className="faq">
          {faq.map((f, i) => (
            <div key={i} className={`faq-item${open === i ? " open" : ""}`}>
              <button type="button" className="faq-q" aria-expanded={open === i} onClick={() => toggle(i)}>
                <span>{f.q}</span><ChevronDown size={20} />
              </button>
              <div className="faq-a" style={{ height: i === 0 ? "auto" : 0 }}><p>{f.a}</p></div>
            </div>
          ))}
        </Stagger>
      </section>

      <section className="festa-band">
        <Stagger className="two" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: 20 }}>
          <div className="contact">
            <WhatsAppIcon size={28} color="var(--sds-whatsapp)" />
            <div className="lbl" style={{ letterSpacing: ".18em" }}>WhatsApp</div>
            <div className="v">{L.telefone}</div>
            <Button variant="outline" size="sm" href={waUrl(L.whatsapp, "Olá! Gostaria de fazer um pedido.")} external>Chamar no WhatsApp</Button>
          </div>
          <div className="contact">
            <MapPin size={28} color="var(--sds-gold-400)" />
            <div className="lbl" style={{ letterSpacing: ".18em" }}>Onde estamos</div>
            <div className="v" style={{ fontSize: 20 }}>{L.endereco}</div>
            {L.horario && <p>{L.horario}</p>}
            {L.mapsUrl && <Button variant="outline" size="sm" href={L.mapsUrl} external>Ver no mapa</Button>}
          </div>
        </Stagger>
      </section>
    </div>
  );
}
