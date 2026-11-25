"use client";

import Link from "next/link";
import { ChefHat, Clock, Heart, MapPin } from "lucide-react";
import { gruposAtivos, useCatalog } from "@/components/Catalog";
import { fmt } from "@/lib/data";
import { Marquee, Reveal, SplitWords, Stagger, Tilt } from "@/components/Motion";
import { BagIcon, Button, PriceTag, SectionHeading } from "@/components/ui";
import { HeroIntro } from "@/components/HeroIntro";

const EMOJI: Record<string, string> = { carne: "🥩", farofa: "🥣", salada: "🥗", acompanhamento: "🍚" };
const FALLBACK = ["🍽️", "🥘", "🍲", "🥙"];

const pillars = [
  { Icon: ChefHat, title: "Comida caseira", text: "Sabor caseiro em cada refeição, preparada com cuidado todos os dias." },
  { Icon: Heart, title: "Feita com amor", text: "Comida boa, feita com amor, do jeito que você gosta de comer." },
  { Icon: Clock, title: "Praticidade", text: "Monte sua marmita no site e envie o pedido direto para o nosso WhatsApp." },
];

export default function Home() {
  const { cat } = useCatalog();
  const L = cat.loja;
  const grupos = gruposAtivos(cat);
  const MARQUEE = ["Comida caseira", "Marmitas", L.slogan, "Feita com amor", `${fmt(L.preco)} a marmita`, "Monte do seu jeito"].filter(Boolean);
  return (
    <>
      <section className="hero hero-band" style={{ minHeight: "min(86vh,680px)", alignItems: "center", ...(L.banner ? { backgroundImage: `linear-gradient(rgba(255,255,255,.82),rgba(255,255,255,.9)), url('${L.banner}')`, backgroundSize: "cover", backgroundPosition: "center" } : {}) }}>
        <div className="hero-in" style={{ paddingTop: 96, paddingBottom: 72 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero-logo hero-fade" src={L.logo || "/assets/logo/logo-full.png"} alt={L.nome} />
          <HeroIntro label="Marmitas · Palmas-TO" />
          <SplitWords key={L.heroTitulo} text={L.heroTitulo} delay={0.35} />
          <p className="lead hero-fade">{L.heroTexto} <b>{fmt(L.preco)}</b>.</p>
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
          {grupos.map((c, gi) => (
            <Tilt key={c.id} max={7} style={{ transformStyle: "preserve-3d" }}>
              <Link href="/cardapio" className="opt-card">
                <div className="ring float ico-ring" style={{ fontSize: 72 }} aria-hidden>{EMOJI[c.id] ?? FALLBACK[gi % FALLBACK.length]}</div>
                <div className="opt-title">{c.titulo}</div>
                <p>{cat.itens.filter((i) => i.grupoId === c.id && i.disponivel).map((i) => i.nome).join(" · ")}</p>
              </Link>
            </Tilt>
          ))}
        </Stagger>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div className="from" style={{ font: "400 14px var(--font-body)", color: "var(--text-muted)" }}>Preço único por marmita</div>
          <PriceTag value={L.preco} framed size="lg" />
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
            <p>{L.endereco}{L.horario ? " · " + L.horario : ""}</p>
            <Button variant="outline" href={L.mapsUrl || "#"} external><MapPin size={18} /> <span>Ver no mapa</span></Button>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <SectionHeading>{"Por que " + L.nome.replace(/^Churrascaria /, "a ")}</SectionHeading>
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
          <h2>{L.ctaTitulo}</h2>
          <p>{L.ctaTexto}</p>
          <Button size="lg" href="/cardapio" magnetic><BagIcon size={20} /> <span>Montar minha marmita</span></Button>
        </Reveal>
      </section>
    </>
  );
}
