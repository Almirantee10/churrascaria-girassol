"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./admin.css";
import { BarChart3, ClipboardList, KeyRound, LogOut, Palette, Settings, Store, Tags, Tag, UtensilsCrossed, Layers } from "lucide-react";
import { fmt } from "@/lib/data";
import type { Catalogo, Pedido, Status } from "@/lib/types";
import { Card } from "@/components/admin/ui";
import { Pedidos, PedidoCard, ativo } from "@/components/admin/Pedidos";
import { CardapioTab, CategoriasTab, MontagemTab, PrecosTab } from "@/components/admin/Cardapio";
import { ConfigTab, LojaTab, PersonalizacaoTab, UsuarioTab } from "@/components/admin/Config";

type TabId = "dashboard" | "pedidos" | "cardapio" | "categorias" | "montagem" | "precos" | "loja" | "personalizacao" | "config" | "usuario";
const TABS: { id: TabId; label: string; Icon: typeof Store }[] = [
  { id: "dashboard", label: "Dashboard", Icon: BarChart3 },
  { id: "pedidos", label: "Pedidos", Icon: ClipboardList },
  { id: "cardapio", label: "Cardápio", Icon: UtensilsCrossed },
  { id: "categorias", label: "Categorias", Icon: Tags },
  { id: "montagem", label: "Montagem da marmita", Icon: Layers },
  { id: "precos", label: "Preços", Icon: Tag },
  { id: "loja", label: "Loja", Icon: Store },
  { id: "personalizacao", label: "Personalização", Icon: Palette },
  { id: "config", label: "Configurações", Icon: Settings },
  { id: "usuario", label: "Usuário e senha", Icon: KeyRound },
];

const hojeBR = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Araguaina" }).format(new Date());
const diaBR = (iso: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Araguaina" }).format(new Date(iso));

function beep() {
  try {
    const A = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new A();
    [660, 880].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.18); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.16);
      o.start(ctx.currentTime + i * 0.18); o.stop(ctx.currentTime + i * 0.18 + 0.17);
    });
  } catch {}
}

/* ------------------------------------------------------------------ Login */
function Login({ onOk }: { onOk: () => void }) {
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);
  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErro("");
    try {
      const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ login, senha }) });
      if (r.ok) onOk();
      else setErro((await r.json()).erro || "Não foi possível entrar.");
    } catch { setErro("Sem conexão. Tente de novo."); }
    setBusy(false);
  };
  return (
    <div className="adm-login">
      <form onSubmit={entrar} className="adm-card">
        <h1>Área Restrita</h1>
        <p>Acesso exclusivo do administrador.</p>
        <label className="adm-f"><span>Login</span><span className="adm-box"><input autoComplete="username" autoCapitalize="none" value={login} onChange={(e) => setLogin(e.target.value)} /></span></label>
        <label className="adm-f"><span>Senha</span><span className="adm-box"><input type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} /></span></label>
        {erro && <p className="adm-err" role="alert">{erro}</p>}
        <button className="adm-btn primary big" disabled={busy || !login || !senha}>{busy ? "Entrando..." : "Entrar"}</button>
        <Link href="/" className="adm-back">← Voltar ao cardápio</Link>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ Dashboard */
function Dashboard({ cfg, pedidos, goto, onStatus, busy }: { cfg: Catalogo; pedidos: Pedido[] | null; goto: (t: TabId) => void; onStatus: (id: string, s: Status) => void; busy: string | null }) {
  const [open, setOpen] = useState<string | null>(null);
  const [agora] = useState(() => Date.now());
  const lista = pedidos ?? [];
  const hoje = lista.filter((p) => diaBR(p.criadoEm) === hojeBR());
  const validos = hoje.filter((p) => p.status !== "cancelado");
  const receita = validos.reduce((a, p) => a + p.total, 0);
  const abertos = lista.filter(ativo);
  const novos = lista.filter((p) => p.status === "recebido");
  const semana = lista.filter((p) => agora - new Date(p.criadoEm).getTime() < 7 * 864e5 && p.status !== "cancelado");
  const off = cfg.itens.filter((i) => !i.disponivel).length + cfg.adicionais.filter((a) => !a.disponivel).length;
  return (
    <>
      <div className={"adm-status " + (cfg.loja.aberta ? "open" : "closed")}>
        <b>{cfg.loja.aberta ? "🟢 Loja aberta" : "🔴 Loja fechada"}</b>
        <button className="adm-btn" onClick={() => goto("loja")}>Alterar</button>
      </div>
      <div className="adm-stats">
        <div><small>Pedidos hoje</small><b>{validos.length}</b></div>
        <div><small>Faturamento hoje</small><b>{fmt(receita)}</b></div>
        <div className={novos.length ? "hot" : ""}><small>Novos (não atendidos)</small><b>{novos.length}</b></div>
        <div><small>Em andamento</small><b>{abertos.length}</b></div>
        <div><small>Últimos 7 dias</small><b>{semana.length} · {fmt(semana.reduce((a, p) => a + p.total, 0))}</b></div>
        <div><small>Itens indisponíveis</small><b>{off}</b></div>
      </div>
      <Card title="Pedidos em andamento" actions={<button className="adm-btn" onClick={() => goto("pedidos")}>Ver todos</button>}>
        {pedidos === null && <p className="adm-empty">Carregando...</p>}
        {pedidos !== null && abertos.length === 0 && <p className="adm-empty">Nenhum pedido em andamento.</p>}
        <div className="adm-orders">
          {abertos.slice(0, 5).map((p) => <PedidoCard key={p.id} p={p} open={open === p.id} toggle={() => setOpen(open === p.id ? null : p.id)} busy={busy === p.id} onStatus={(s) => onStatus(p.id, s)} />)}
        </div>
      </Card>
      <Card title="Resumo do cardápio">
        <p>Preço da marmita: <b>{fmt(cfg.loja.preco)}</b></p>
        <ul className="adm-sumlist">
          {cfg.grupos.map((g) => <li key={g.id}><b>{g.label}</b> — {cfg.itens.filter((i) => i.grupoId === g.id && i.disponivel).length} opções disponíveis · {g.min === 0 ? "opcional" : `mín. ${g.min}`}, máx. {g.max}{g.ativo ? "" : " · desativada"}</li>)}
        </ul>
        <p className="adm-rule">{cfg.loja.entrega ? `Entrega ${cfg.loja.taxaEntrega > 0 ? "(taxa " + fmt(cfg.loja.taxaEntrega) + ")" : "grátis"}` : "Sem entrega"} · {cfg.loja.retirada ? "Retirada no local" : "Sem retirada"}</p>
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ Painel */
export default function Admin() {
  const [auth, setAuth] = useState<"checking" | "out" | { login: string }>("checking");
  const [tab, setTab] = useState<TabId>("dashboard");
  const [cfg, setCfgState] = useState<Catalogo | null>(null);
  const [save, setSave] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveErr, setSaveErr] = useState("");
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [pedErr, setPedErr] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const known = useRef<Set<string> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef<Catalogo | null>(null);

  const check = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/me", { cache: "no-store" });
      setAuth(r.ok ? { login: (await r.json()).login } : "out");
    } catch { setAuth("out"); }
  }, []);
  useEffect(() => { check(); }, [check]); // eslint-disable-line react-hooks/set-state-in-effect

  const logged = typeof auth === "object";

  useEffect(() => {
    if (!logged) return;
    fetch("/api/admin/config", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((c) => { if (c) { latest.current = c; setCfgState(c); } });
  }, [logged]);

  const loadPedidos = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/pedidos", { cache: "no-store" });
      if (r.status === 401) { setAuth("out"); return; }
      if (!r.ok) throw new Error();
      const list = (await r.json()) as Pedido[];
      setPedErr("");
      if (known.current) {
        const novos = list.filter((p) => !known.current!.has(p.id));
        if (novos.length) { beep(); setToast(`Novo pedido #${novos[0].numero}${novos.length > 1 ? ` (+${novos.length - 1})` : ""}!`); setTimeout(() => setToast(""), 6000); }
      }
      known.current = new Set(list.map((p) => p.id));
      setPedidos(list);
    } catch { setPedErr("Não foi possível atualizar os pedidos. Tentando de novo..."); }
  }, []);

  useEffect(() => {
    if (!logged) return;
    loadPedidos(); // eslint-disable-line react-hooks/set-state-in-effect
    const t = setInterval(loadPedidos, 5000);
    return () => clearInterval(t);
  }, [logged, loadPedidos]);

  /** Qualquer alteração é salva sozinha, um instante depois de parar de mexer. */
  const setCfg = useCallback((next: Catalogo) => {
    latest.current = next;
    setCfgState(next);
    setSave("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch("/api/admin/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(latest.current) });
        if (r.status === 401) { setAuth("out"); return; }
        if (!r.ok) throw new Error((await r.json()).erro);
        setSave("saved"); setSaveErr("");
      } catch (e) { setSave("error"); setSaveErr(e instanceof Error && e.message ? e.message : "Sem conexão."); }
    }, 700);
  }, []);

  const onStatus = async (id: string, status: Status) => {
    setBusy(id);
    try {
      const r = await fetch(`/api/admin/pedidos/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (r.ok) { const p = (await r.json()) as Pedido; setPedidos((l) => (l ? l.map((x) => (x.id === p.id ? p : x)) : l)); }
      else setPedErr((await r.json()).erro || "Erro ao atualizar o pedido.");
    } catch { setPedErr("Sem conexão."); }
    setBusy(null);
  };

  const sair = async () => { await fetch("/api/admin/logout", { method: "POST" }); setAuth("out"); setCfgState(null); setPedidos(null); known.current = null; };

  if (auth === "checking") return <div className="adm-login"><p className="adm-empty">Carregando...</p></div>;
  if (auth === "out") return <Login onOk={check} />;

  const novos = (pedidos ?? []).filter((p) => p.status === "recebido").length;

  return (
    <div className="adm">
      <header className="adm-top">
        <div><b>{cfg?.loja.nome ?? "Painel"}</b><small>Área Restrita · {auth.login}</small></div>
        <div className="adm-actions">
          <span className={"adm-save " + save}>{save === "saving" ? "Salvando..." : save === "saved" ? "✓ Salvo" : save === "error" ? "Erro ao salvar" : ""}</span>
          <Link href="/" className="adm-btn ghost" target="_blank">Ver cardápio</Link>
          <button className="adm-btn ghost" onClick={sair}><LogOut size={15} /> Sair</button>
        </div>
      </header>
      {save === "error" && <p className="adm-err adm-pad">{saveErr} As últimas alterações NÃO foram salvas. Faça uma alteração de novo para tentar outra vez.</p>}
      {toast && <div className="adm-toast" role="status" onClick={() => { setTab("pedidos"); setToast(""); }}>🔔 {toast}</div>}
      <nav className="adm-nav" aria-label="Seções">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
            <Icon size={16} /> {label}{id === "pedidos" && novos > 0 && <i>{novos}</i>}
          </button>
        ))}
      </nav>
      <main className="adm-main">
        {!cfg ? <p className="adm-empty">Carregando painel...</p> : (
          <>
            {tab === "dashboard" && <Dashboard cfg={cfg} pedidos={pedidos} goto={setTab} onStatus={onStatus} busy={busy} />}
            {tab === "pedidos" && <Pedidos pedidos={pedidos} onStatus={onStatus} busy={busy} erro={pedErr} />}
            {tab === "cardapio" && <CardapioTab cfg={cfg} set={setCfg} />}
            {tab === "categorias" && <CategoriasTab cfg={cfg} set={setCfg} />}
            {tab === "montagem" && <MontagemTab cfg={cfg} set={setCfg} />}
            {tab === "precos" && <PrecosTab cfg={cfg} set={setCfg} />}
            {tab === "loja" && <LojaTab cfg={cfg} set={setCfg} />}
            {tab === "personalizacao" && <PersonalizacaoTab cfg={cfg} set={setCfg} />}
            {tab === "config" && <ConfigTab cfg={cfg} set={setCfg} />}
            {tab === "usuario" && <UsuarioTab login={auth.login} onChanged={(l) => setAuth({ login: l })} />}
          </>
        )}
      </main>
    </div>
  );
}
