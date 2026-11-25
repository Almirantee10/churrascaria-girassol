import Link from "next/link";
import { ChefHat, Clock, Heart, MapPin } from "lucide-react";
import { ADDRESS, CATEGORIES, MARQUEE, MAPS_URL, PRICE } from "@/lib/data";
import { Marquee, Reveal, SplitWords, Stagger, Tilt } from "@/components/Motion";
import { BagIcon, Button, PriceTag, SectionHeading } from "@/components/ui";
import { HeroIntro } from "@/components/HeroIntro";

const EMOJI: Record<string, string> = { carne: "🥩", salada: "🥗", acompanhamento: "🍚" };

const pillars = [
  { Icon: ChefHat, title: "Comida caseira", text: "Sabor caseiro em cada refeição, preparada com cuidado todos os dias." },
  { Icon: Heart, title: "Feita com amor", text: "Comida boa, feita com amor, do jeito que você gosta de comer." },
  { Icon: Clock, title: "Praticidade", text: "Monte sua marmita no site e envie o pedido direto para o nosso WhatsApp." },
];

export default function Home() {
  return (
    <>
      <section className="hero hero-band" style={{ minHeight: "min(86vh,680px)", alignItems: "center" }}>
        <div className="hero-in" style={{ paddingTop: 96, paddingBottom: 72 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero-logo hero-fade" src="/assets/logo/logo-full.png" alt="Churrascaria Girassol" />
          <HeroIntro label="Marmitas · Palmas-TO" />
          <SplitWords text="Monte a sua marmita do seu jeito." delay={0.35} />
          <p className="lead hero-fade">Escolha a carne, a salada e os acompanhamentos. Qualquer combinação por um preço só: <b>R$ {String(PRICE).replace(".", ",")},00</b>.</p>
          <div className="hero-cta hero-fade">
            <Button size="lg" href="/cardapio" magnetic><BagIcon size={20} /> <span>Montar minha marmita</span></Button>
            <Button size="lg" variant="outline" href="/como-pedir" magnetic>Como pedir</Button>
          </div>
        </div>
        <span className="scrollcue" aria-hidden />
      </section>

      <Marquee items={MARQUEE} />

      <section className="section">
        <SectionHeading>O que tem na marmita</SectionHeading>
        <Stagger className="grid-auto" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", perspective: 1000 }}>
          {CATEGORIES.map((c) => (
            <Tilt key={c.id} max={7} style={{ transformStyle: "preserve-3d" }}>
              <Link href="/cardapio" className="opt-card">
                <div className="ring float ico-ring" style={{ fontSize: 72 }} aria-hidden>{EMOJI[c.id] ?? "🍽️"}</div>
                <div className="opt-title">{c.titulo}</div>
                <p>{c.opcoes.join(" · ")}</p>
              </Link>
            </Tilt>
          ))}
        </Stagger>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div className="from" style={{ font: "400 14px var(--font-body)", color: "var(--text-muted)" }}>Preço único por marmita</div>
          <PriceTag value={PRICE} framed size="lg" />
        </div>
      </section>

      <section className="festa-band">
        <div className="two">
          <Reveal>
            <div className="eyebrow">Como funciona</div>
            <h2 className="serif-h">Escolha, confira e peça.</h2>
            <p>Você escolhe os itens de cada categoria, confere o resumo da marmita e adiciona ao pedido. Quer mais de uma? Monte cada uma do seu jeito, com combinações diferentes.</p>
            <Button href="/cardapio">Montar minha marmita</Button>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="eyebrow">Onde estamos</div>
            <h2 className="serif-h">Venha nos visitar.</h2>
            <p>{ADDRESS}</p>
            <Button variant="outline" href={MAPS_URL} external><MapPin size={18} /> <span>Ver no mapa</span></Button>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <SectionHeading>Por que a Girassol</SectionHeading>
        <Stagger className="grid-auto" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
          {pillars.map(({ Icon, title, text }) => (
            <div className="pillar" key={title}>
              <div className="ic"><Icon size={24} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </Stagger>
      </section>

      <section className="cta" style={{ background: "var(--surface-festa)" }}>
        <Reveal className="cta-in">
          <h2>Bateu a fome? Monte sua marmita.</h2>
          <p>Escolha os itens, finalize o pedido e ele chega direto no nosso WhatsApp.</p>
          <Button size="lg" href="/cardapio" magnetic><BagIcon size={20} /> <span>Montar minha marmita</span></Button>
        </Reveal>
      </section>
    </>
  );
}
