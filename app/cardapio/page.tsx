"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Pencil, Plus, ShoppingBag } from "lucide-react";
import { CATEGORIES, PRICE, fmt, missing } from "@/lib/data";
import { gsap, useGSAP, noMotion } from "@/lib/gsap";
import { useStore } from "@/components/Store";
import { Button, Field, OptionRow, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/Motion";

const LAST = CATEGORIES.length; // índice da etapa "Resumo"

export default function Montar() {
  const { draft, setDraft, draftObs, setDraftObs, editUid, cancelEdit, saveDraft, showToast, cart, total } = useStore();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<"added" | "updated" | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (noMotion()) return;
    gsap.fromTo(".build-panel", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out", clearProps: "transform" });
  }, { scope: root, dependencies: [step, done] });

  const cat = step < LAST ? CATEGORIES[step] : null;
  const picked = cat ? draft[cat.id] ?? [] : [];
  const single = !!cat && cat.max === 1;
  const lacking = missing(draft);
  const canNext = !cat || picked.length >= cat.min;

  const toggle = (item: string) => {
    if (!cat) return;
    const cur = draft[cat.id] ?? [];
    let next: string[];
    if (single) next = [item];
    else if (cur.includes(item)) next = cur.filter((x) => x !== item);
    else if (cur.length < cat.max) next = cur.concat([item]);
    else return;
    setDraft({ ...draft, [cat.id]: next });
  };

  const go = (n: number) => { setStep(n); window.scrollTo({ top: 0, behavior: noMotion() ? "auto" : "smooth" }); };

  const add = () => {
    if (lacking.length) { go(CATEGORIES.indexOf(lacking[0])); return; }
    const r = saveDraft();
    setDone(r);
    showToast(r === "added" ? "Marmita adicionada ao pedido!" : "Marmita atualizada!");
    window.scrollTo({ top: 0 });
  };

  /* -------------------------------------------------------- confirmação */
  if (done) {
    return (
      <div className="build" ref={root}>
        <div className="build-panel build-done">
          <span className="done-ic"><Check size={34} strokeWidth={3} /></span>
          <h2>{done === "added" ? "Marmita adicionada!" : "Marmita atualizada!"}</h2>
          <p className="lead" style={{ fontSize: 17 }}>
            Seu pedido tem {cart.length} {cart.length === 1 ? "marmita" : "marmitas"} · <b>{fmt(total)}</b>
          </p>
          <div className="hero-cta">
            {done === "added" && <Button size="lg" onClick={() => { setDone(null); go(0); }}><Plus size={18} strokeWidth={2.6} /> <span>Montar outra marmita</span></Button>}
            <Button size="lg" variant={done === "added" ? "outline" : "primary"} href="/carrinho"><ShoppingBag size={18} /> <span>Finalizar pedido</span></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="build" ref={root}>
      <div className="build-title">
        <SectionHeading kicker={editUid ? "Alterando sua marmita" : "Churrascaria Girassol"}>Montar minha marmita</SectionHeading>
        <div className="build-price"><b>{fmt(PRICE)}</b> <span>por marmita · preço único, qualquer combinação</span></div>
      </div>

      {/* progresso */}
      <ol className="progress" aria-label="Etapas">
        {[...CATEGORIES.map((c) => c.label), "Resumo"].map((l, i) => {
          const ok = i < LAST ? (draft[CATEGORIES[i].id]?.length ?? 0) >= CATEGORIES[i].min && (draft[CATEGORIES[i].id]?.length ?? 0) > 0 : lacking.length === 0;
          return (
            <li key={l} className={(i === step ? "on " : "") + (ok && i !== step ? "ok" : "")}>
              <button type="button" onClick={() => go(i)} aria-current={i === step ? "step" : undefined}>
                <span className="pn">{ok && i !== step ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
                <span className="pl">{l}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="build-panel">
        {cat ? (
          <>
            <div className="build-h">
              <h2>{cat.titulo}</h2>
              <p>{cat.dica}</p>
              <b className="count">{single ? "Escolha 1" : `${picked.length} de ${cat.max}`}{cat.min === 0 ? " · opcional" : ""}</b>
            </div>
            <div className="opt-grid">
              {cat.opcoes.map((o) => {
                const on = picked.includes(o);
                return <OptionRow key={o} type={single ? "radio" : "checkbox"} checked={on} disabled={!on && !single && picked.length >= cat.max} label={o} onChange={() => toggle(o)} />;
              })}
            </div>
            {!canNext && <p className="warn">Escolha {cat.min === 1 ? "uma opção" : `pelo menos ${cat.min} opções`} para continuar.</p>}
          </>
        ) : (
          <>
            <div className="build-h">
              <h2>Resumo da sua marmita</h2>
              <p>Confira as escolhas. Toque em <b>Alterar</b> para mudar qualquer item.</p>
            </div>
            <div className="summary">
              {CATEGORIES.map((c, i) => {
                const v = draft[c.id] ?? [];
                return (
                  <div className="sum-row" key={c.id}>
                    <div>
                      <span className="lbl">{c.label}</span>
                      <b className={v.length ? "" : "none"}>{v.length ? v.join(" · ") : "Sem " + c.label.toLowerCase()}</b>
                    </div>
                    <button type="button" className="sum-edit" onClick={() => go(i)}><Pencil size={14} /> Alterar</button>
                  </div>
                );
              })}
            </div>
            <Field label="Observação desta marmita (opcional)" multiline placeholder="Ex.: sem pimenta, pouco sal, bem passado..." value={draftObs} onChange={(e) => setDraftObs(e.target.value)} />
            {lacking.length > 0 && <p className="warn">Falta escolher: {lacking.map((c) => c.label.toLowerCase()).join(", ")}.</p>}
          </>
        )}
      </div>

      {/* barra de ações */}
      <div className="build-bar">
        <div className="build-bar-in">
          {step > 0 ? <Button variant="outline" size="lg" onClick={() => go(step - 1)}><ArrowLeft size={18} /> <span>Voltar</span></Button> : <span />}
          {step < LAST ? (
            <Button size="lg" disabled={!canNext} onClick={() => go(step + 1)}><span>{step === LAST - 1 ? "Ver resumo" : "Continuar"}</span> <ArrowRight size={18} /></Button>
          ) : (
            <Button size="lg" disabled={lacking.length > 0} onClick={add}>
              <Plus size={18} strokeWidth={2.6} /> <span>{editUid ? "Salvar alterações" : "Adicionar"} · {fmt(PRICE)}</span>
            </Button>
          )}
        </div>
        {editUid && <button type="button" className="build-cancel" onClick={() => { cancelEdit(); setStep(0); }}>Cancelar alteração</button>}
      </div>

      {cart.length > 0 && step < LAST && !editUid && (
        <Reveal><p className="note"><Link href="/carrinho">Você já tem {cart.length} {cart.length === 1 ? "marmita" : "marmitas"} no pedido · ver pedido</Link></p></Reveal>
      )}
    </div>
  );
}
