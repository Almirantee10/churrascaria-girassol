"use client";

import { useMemo, useState } from "react";
import { Ban, Bike, CheckCheck, ChefHat, MapPin, Phone } from "lucide-react";
import { fmt } from "@/lib/data";
import { STATUS_LABEL, type Pedido, type Status } from "@/lib/types";
import { Card } from "./ui";

const FLUXO: { s: Status; label: string; Icon: typeof ChefHat }[] = [
  { s: "recebido", label: "Recebido", Icon: CheckCheck },
  { s: "preparo", label: "Em preparo", Icon: ChefHat },
  { s: "entrega", label: "Saiu para entrega", Icon: Bike },
  { s: "concluido", label: "Concluído", Icon: CheckCheck },
];

const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Araguaina" });
const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Araguaina" });
export const ativo = (p: Pedido) => p.status !== "concluido" && p.status !== "cancelado";

export function PedidoCard({ p, onStatus, open, toggle, busy }: { p: Pedido; onStatus: (s: Status) => void; open: boolean; toggle: () => void; busy: boolean }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  return (
    <article className={"adm-order st-" + p.status}>
      <button className="adm-order-h" onClick={toggle} aria-expanded={open}>
        <span className="num">#{p.numero}</span>
        <span className="who"><b>{p.cliente.nome || "Sem nome"}</b><small>{dia(p.criadoEm)} {hora(p.criadoEm)} · {p.itens.length} {p.itens.length === 1 ? "marmita" : "marmitas"} · {p.recebimento === "entrega" ? "Entrega" : "Retirada"}</small></span>
        <span className="tot"><b>{fmt(p.total)}</b><em className={"tag st-" + p.status}>{STATUS_LABEL[p.status]}</em></span>
      </button>
      {open && (
        <div className="adm-order-b">
          {p.itens.map((it) => (
            <div className="adm-line" key={it.n}>
              <b>Marmita {it.n} · {fmt(it.preco)}</b>
              {it.grupos.map((g) => <span key={g.label}>{g.label}: {g.itens.length ? g.itens.join(", ") : "sem"}</span>)}
              {it.adicionais.length > 0 && <span>Adicionais: {it.adicionais.map((a) => `${a.nome} (+${fmt(a.preco)})`).join(", ")}</span>}
              {it.obs && <span className="obs">📝 {it.obs}</span>}
            </div>
          ))}
          <div className="adm-meta">
            {p.cliente.telefone && <a href={`tel:${p.cliente.telefone}`}><Phone size={14} /> {p.cliente.telefone}</a>}
            {p.recebimento === "entrega" && (
              <span><MapPin size={14} /> {p.endereco || "Endereço não informado"}{p.coords && <> · <a href={`https://www.google.com/maps?q=${p.coords}`} target="_blank" rel="noopener noreferrer">ver no mapa</a></>}</span>
            )}
            <span>💳 {p.pagamento}{p.troco ? ` · troco para ${p.troco}` : ""}</span>
            {p.obs && <span className="obs">📝 {p.obs}</span>}
            <span>Subtotal {fmt(p.subtotal)}{p.taxa > 0 ? ` + entrega ${fmt(p.taxa)}` : ""} = <b>{fmt(p.total)}</b></span>
          </div>
          <div className="adm-flow">
            {FLUXO.filter((f) => f.s !== "entrega" || p.recebimento === "entrega").map(({ s, label, Icon }) => (
              <button key={s} disabled={busy || p.status === s || p.status === "cancelado"} className={"adm-btn" + (p.status === s ? " on" : "")} onClick={() => onStatus(s)}><Icon size={15} /> {label}</button>
            ))}
            {p.status !== "cancelado" && p.status !== "concluido" && (
              confirmCancel
                ? <><button className="adm-btn danger" disabled={busy} onClick={() => { onStatus("cancelado"); setConfirmCancel(false); }}>Confirmar cancelamento</button><button className="adm-btn ghost" onClick={() => setConfirmCancel(false)}>Voltar</button></>
                : <button className="adm-btn ghost danger" onClick={() => setConfirmCancel(true)}><Ban size={15} /> Cancelar pedido</button>
            )}
            {p.status === "cancelado" && <button className="adm-btn" disabled={busy} onClick={() => onStatus("recebido")}>Reabrir</button>}
          </div>
          <small className="adm-hist">Histórico: {p.historico.map((h) => `${STATUS_LABEL[h.status]} ${hora(h.em)}`).join(" → ")}</small>
        </div>
      )}
    </article>
  );
}

export function Pedidos({ pedidos, onStatus, busy, erro }: { pedidos: Pedido[] | null; onStatus: (id: string, s: Status) => void; busy: string | null; erro: string }) {
  const [aba, setAba] = useState<"ativos" | "anteriores">("ativos");
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const lista = useMemo(() => {
    const base = (pedidos ?? []).filter((p) => (aba === "ativos" ? ativo(p) : !ativo(p)));
    const t = q.trim().toLowerCase();
    return t ? base.filter((p) => (p.numero + " " + p.cliente.nome + " " + p.cliente.telefone).toLowerCase().includes(t)) : base;
  }, [pedidos, aba, q]);
  const nAtivos = (pedidos ?? []).filter(ativo).length;

  return (
    <Card title="Pedidos" hint="Atualiza sozinho a cada poucos segundos. Toque em um pedido para ver os detalhes."
      actions={<div className="adm-seg"><button className={aba === "ativos" ? "on" : ""} onClick={() => setAba("ativos")}>Em andamento{nAtivos > 0 && <i>{nAtivos}</i>}</button><button className={aba === "anteriores" ? "on" : ""} onClick={() => setAba("anteriores")}>Anteriores</button></div>}>
      {erro && <p className="adm-err">{erro}</p>}
      <input className="adm-search" placeholder="Buscar por número, nome ou telefone" value={q} onChange={(e) => setQ(e.target.value)} />
      {pedidos === null && <p className="adm-empty">Carregando pedidos...</p>}
      {pedidos !== null && lista.length === 0 && <p className="adm-empty">{aba === "ativos" ? "Nenhum pedido em andamento." : "Nenhum pedido anterior."}</p>}
      <div className="adm-orders">
        {lista.map((p) => <PedidoCard key={p.id} p={p} open={open === p.id} toggle={() => setOpen(open === p.id ? null : p.id)} busy={busy === p.id} onStatus={(s) => onStatus(p.id, s)} />)}
      </div>
    </Card>
  );
}
