"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Pencil, Plus, ShoppingBag } from "lucide-react";
import { fmt } from "@/lib/data";
import { gsap, useGSAP, noMotion } from "@/lib/gsap";
import { faltando, gruposAtivos, precoMarmita, resumo, useCatalog } from "@/components/Catalog";
import { useStore } from "@/components/Store";
import { Button, Field, OptionRow, SectionHeading } from "@/components/ui";
import { Reveal } from "@/components/Motion";

export default function Montar() {
  const { cat } = useCatalog();
  const { draft, setDraft, draftAdic, setDraftAdic, draftObs, setDraftObs, editUid, cancelEdit, saveDraft, showToast, cart, subtotal } = useStore();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<"added" | "updated" | null>(null);
  const root = useRef<HTMLDivElement>(null);

  const L = cat.loja;
  const grupos = gruposAtivos(cat);
  const adicionais = cat.adicionais.filter((a) => a.disponivel || draftAdic.includes(a.id));
  const hasAdic = adicionais.length > 0;
  const ADIC = grupos.length; // índice da etapa de adicionais (se existir)
  const LAST = grupos.length + (hasAdic ? 1 : 0); // índice do resumo
  const at = Math.min(step, LAST);

  useGSAP(() => {
    if (noMotion()) return;
    gsap.fromTo(".build-panel", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out", clearProps: "transform" });
  }, { scope: root, dependencies: [at, done] });

  const g = at < grupos.length ? grupos[at] : null;
  const onAdic = hasAdic && at === ADIC;
  const picked = g ? draft[g.id] ?? [] : [];
  const single = !!g && g.max === 1;
  const lacking = faltando(cat, draft);
  const canNext = !g || picked.length >= g.min;
  const price = precoMarmita(cat, draft, draftAdic);

  const toggle = (id: string) => {
    if (!g) return;
    const cur = draft[g.id] ?? [];
    let next: string[];
    if (single) next = cur.includes(id) && g.min === 0 ? [] : [id];
    else if (cur.includes(id)) next = cur.filter((x) => x !== id);
    else if (cur.length < g.max) next = cur.concat([id]);
    else return;
    setDraft({ ...draft, [g.id]: next });
  };

  const go = (n: number) => { setStep(n); window.scrollTo({ top: 0, behavior: noMotion() ? "auto" : "smooth" }); };

  const add = () => {
    if (!L.aberta) return;
    if (lacking.length) { go(grupos.indexOf(lacking[0])); return; }
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
            Seu pedido tem {cart.length} {cart.length === 1 ? "marmita" : "marmitas"} · <b>{fmt(subtotal)}</b>
          </p>
          <div className="hero-cta">
            {done === "added" && <Button size="lg" onClick={() => { setDone(null); go(0); }}><Plus size={18} strokeWidth={2.6} /> <span>Montar outra marmita</span></Button>}
            <Button size="lg" variant={done === "added" ? "outline" : "primary"} href="/carrinho"><ShoppingBag size={18} /> <span>Finalizar pedido</span></Button>
          </div>
        </div>
      </div>
    );
  }

  const labels = [...grupos.map((x) => x.label), ...(hasAdic ? ["Adicionais"] : []), "Resumo"];

  return (
    <div className="build" ref={root}>
      <div className="build-title">
        <SectionHeading kicker={editUid ? "Alterando sua marmita" : L.nome}>Montar minha marmita</SectionHeading>
        <div className="build-price"><b>{fmt(L.preco)}</b> <span>por marmita · preço único, qualquer combinação</span></div>
      </div>

      {!L.aberta && <p className="warn closed-warn">Loja fechada no momento: você pode montar a marmita, mas só consegue enviar o pedido quando abrirmos.</p>}

      {/* progresso */}
      <ol className="progress" aria-label="Etapas" style={{ gridTemplateColumns: `repeat(${labels.length}, 1fr)` }}>
        {labels.map((label, i) => {
          const isGroup = i < grupos.length;
          const n = isGroup ? (draft[grupos[i].id]?.length ?? 0) : 0;
          const ok = isGroup ? n > 0 && n >= grupos[i].min : i === ADIC && hasAdic ? draftAdic.length > 0 : lacking.length === 0;
          return (
            <li key={label + i} className={(i === at ? "on " : "") + (ok && i !== at ? "ok" : "")}>
              <button type="button" onClick={() => go(i)} aria-current={i === at ? "step" : undefined}>
                <span className="pn">{ok && i !== at ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
                <span className="pl">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="build-panel">
        {g ? (
          <>
            <div className="build-h">
              <h2>{g.titulo}</h2>
              {g.dica && <p>{g.dica}</p>}
              <b className="count">{single ? "Escolha 1" : `${picked.length} de ${g.max}`}{g.min === 0 ? " · opcional" : ""}</b>
            </div>
            <div className="chosen" aria-live="polite">
              {picked.length ? <>Selecionado: {picked.map((id) => <span className="chip" key={id}>{cat.itens.find((i) => i.id === id)?.nome}</span>)}</> : <span className="none">Nada selecionado ainda</span>}
            </div>
            <div className="opt-grid">
              {cat.itens.filter((i) => i.grupoId === g.id && (i.disponivel || picked.includes(i.id))).concat(cat.itens.filter((i) => i.grupoId === g.id && !i.disponivel && !picked.includes(i.id))).map((i) => {
                const on = picked.includes(i.id);
                const off = !i.disponivel;
                return (
                  <OptionRow key={i.id} type={single ? "radio" : "checkbox"} checked={on} img={i.imagem || undefined}
                    disabled={off || (!on && !single && picked.length >= g.max)} label={i.nome}
                    description={off ? "Indisponível hoje" : i.descricao || undefined}
                    meta={i.precoExtra > 0 ? "+ " + fmt(i.precoExtra) : undefined} onChange={() => toggle(i.id)} />
                );
              })}
            </div>
            {!canNext && <p className="warn">Escolha {g.min === 1 ? "uma opção" : `pelo menos ${g.min} opções`} para continuar.</p>}
          </>
        ) : onAdic ? (
          <>
            <div className="build-h">
              <h2>Adicionais</h2>
              <p>Quer incrementar a marmita? Os adicionais têm valor extra.</p>
              <b className="count">Opcional</b>
            </div>
            <div className="opt-grid">
              {adicionais.map((a) => {
                const on = draftAdic.includes(a.id);
                return (
                  <OptionRow key={a.id} type="checkbox" checked={on} img={a.imagem || undefined} disabled={!a.disponivel} label={a.nome}
                    description={!a.disponivel ? "Indisponível hoje" : a.descricao || undefined} meta={"+ " + fmt(a.preco)}
                    onChange={() => setDraftAdic(on ? draftAdic.filter((x) => x !== a.id) : draftAdic.concat([a.id]))} />
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="build-h">
              <h2>Resumo da sua marmita</h2>
              <p>Confira as escolhas. Toque em <b>Alterar</b> para mudar qualquer item.</p>
            </div>
            <div className="summary">
              {resumo(cat, draft).map(({ grupo, nomes }, i) => (
                <div className="sum-row" key={grupo.id}>
                  <div>
                    <span className="lbl">{grupo.label}</span>
                    <b className={nomes.length ? "" : "none"}>{nomes.length ? nomes.join(" · ") : "Sem " + grupo.label.toLowerCase()}</b>
                  </div>
                  <button type="button" className="sum-edit" onClick={() => go(i)}><Pencil size={14} /> Alterar</button>
                </div>
              ))}
              {hasAdic && (
                <div className="sum-row">
                  <div>
                    <span className="lbl">Adicionais</span>
                    <b className={draftAdic.length ? "" : "none"}>{draftAdic.length ? draftAdic.map((id) => cat.adicionais.find((a) => a.id === id)?.nome).filter(Boolean).join(" · ") : "Nenhum"}</b>
                  </div>
                  <button type="button" className="sum-edit" onClick={() => go(ADIC)}><Pencil size={14} /> Alterar</button>
                </div>
              )}
            </div>
            <Field label="Observação desta marmita (opcional)" multiline placeholder="Ex.: sem pimenta, pouco sal, bem passado..." value={draftObs} onChange={(e) => setDraftObs(e.target.value)} />
            {lacking.length > 0 && <p className="warn">Falta escolher: {lacking.map((c) => c.label.toLowerCase()).join(", ")}.</p>}
            <div className="total-row"><span>Valor da marmita</span><b className="price price-lg" style={{ fontSize: 28 }}>{fmt(price)}</b></div>
          </>
        )}
      </div>

      {/* barra de ações */}
      <div className="build-bar">
        <div className="build-bar-in">
          {at > 0 ? <Button variant="outline" size="lg" onClick={() => go(at - 1)}><ArrowLeft size={18} /> <span>Voltar</span></Button> : <span />}
          {at < LAST ? (
            <Button size="lg" disabled={!canNext} onClick={() => go(at + 1)}><span>{at === LAST - 1 ? "Ver resumo" : "Continuar"}</span> <ArrowRight size={18} /></Button>
          ) : (
            <Button size="lg" disabled={lacking.length > 0 || !L.aberta} onClick={add}>
              <Plus size={18} strokeWidth={2.6} /> <span>{!L.aberta ? "Loja fechada" : `${editUid ? "Salvar alterações" : "Adicionar"} · ${fmt(price)}`}</span>
            </Button>
          )}
        </div>
        {editUid && <button type="button" className="build-cancel" onClick={() => { cancelEdit(); setStep(0); }}>Cancelar alteração</button>}
      </div>

      {cart.length > 0 && at < LAST && !editUid && (
        <Reveal><p className="note"><Link href="/carrinho">Você já tem {cart.length} {cart.length === 1 ? "marmita" : "marmitas"} no pedido · ver pedido</Link></p></Reveal>
      )}
    </div>
  );
}
