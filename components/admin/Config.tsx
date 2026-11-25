"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Catalogo, Loja } from "@/lib/types";
import { Card, ImageField, Money, Switch, Txt, uid } from "./ui";

type P = { cfg: Catalogo; set: (c: Catalogo) => void };
const useLoja = ({ cfg, set }: P) => (p: Partial<Loja>) => set({ ...cfg, loja: { ...cfg.loja, ...p } });

/* ------------------------------------------------------------------ Loja: aberta/fechada */
export function LojaTab(props: P) {
  const L = props.cfg.loja;
  const up = useLoja(props);
  return (
    <>
      <Card title="Status da loja" hint="Muda na hora para todos os clientes que estão no cardápio.">
        <div className={"adm-status " + (L.aberta ? "open" : "closed")}>
          <b>{L.aberta ? "🟢 Loja aberta" : "🔴 Loja fechada"}</b>
          <span>{L.aberta ? "Os clientes podem montar e enviar pedidos." : "Os clientes veem o aviso de loja fechada e não conseguem enviar pedidos."}</span>
          <div className="adm-actions">
            <button className={"adm-btn big" + (L.aberta ? " on" : "")} onClick={() => up({ aberta: true })}>🟢 Abrir loja</button>
            <button className={"adm-btn big danger" + (!L.aberta ? " on" : "")} onClick={() => up({ aberta: false })}>🔴 Fechar loja</button>
          </div>
        </div>
      </Card>
      <Card title="Mensagens ao cliente">
        <Txt label="Mensagem quando a loja estiver fechada" multi value={L.mensagemFechada} onChange={(v) => up({ mensagemFechada: v })} />
        <Txt label="Aviso geral (faixa no topo do site, opcional)" value={L.aviso} placeholder="Ex.: Hoje não temos feijoada" onChange={(v) => up({ aviso: v })} hint="Aparece para todos enquanto a loja estiver aberta. Deixe vazio para não mostrar." />
        <Txt label="Horário de funcionamento" value={L.horario} placeholder="Ex.: Segunda a sábado, das 11h às 15h" onChange={(v) => up({ horario: v })} />
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ Personalização */
export function PersonalizacaoTab(props: P) {
  const L = props.cfg.loja;
  const up = useLoja(props);
  return (
    <>
      <Card title="Identidade visual">
        <ImageField label="Logotipo (aparece no topo e na página inicial)" value={L.logo} onChange={(v) => up({ logo: v })} round />
        <ImageField label="Banner da página inicial (opcional)" value={L.banner} onChange={(v) => up({ banner: v })} />
        <div className="adm-grid">
          <label className="adm-f"><span>Cor dos botões</span><input type="color" className="adm-color" value={L.corDestaque} onChange={(e) => up({ corDestaque: e.target.value })} /></label>
          <label className="adm-f"><span>Cor dos títulos</span><input type="color" className="adm-color" value={L.corTexto} onChange={(e) => up({ corTexto: e.target.value })} /></label>
        </div>
        <button className="adm-btn ghost" onClick={() => up({ corDestaque: "#F5B800", corTexto: "#B3202A" })}>Restaurar cores originais</button>
      </Card>
      <Card title="Textos da página inicial">
        <Txt label="Título principal" value={L.heroTitulo} onChange={(v) => up({ heroTitulo: v })} />
        <Txt label="Texto abaixo do título" multi value={L.heroTexto} onChange={(v) => up({ heroTexto: v })} />
        <Txt label="Título do convite final" value={L.ctaTitulo} onChange={(v) => up({ ctaTitulo: v })} />
        <Txt label="Texto do convite final" multi value={L.ctaTexto} onChange={(v) => up({ ctaTexto: v })} />
        <Txt label="Frase final da mensagem do pedido (WhatsApp)" value={L.mensagemPedido} onChange={(v) => up({ mensagemPedido: v })} />
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ Configurações */
export function ConfigTab(props: P) {
  const L = props.cfg.loja;
  const up = useLoja(props);
  return (
    <>
      <Card title="Informações da loja" hint="Aparecem no cardápio público.">
        <Txt label="Nome da loja" value={L.nome} onChange={(v) => up({ nome: v })} />
        <Txt label="Slogan" value={L.slogan} onChange={(v) => up({ slogan: v })} />
        <Txt label="Descrição" multi value={L.descricao} onChange={(v) => up({ descricao: v })} />
        <Txt label="Endereço" value={L.endereco} onChange={(v) => up({ endereco: v })} />
        <Txt label="Link do mapa (Google Maps)" value={L.mapsUrl} placeholder="https://maps.google.com/..." onChange={(v) => up({ mapsUrl: v })} />
      </Card>
      <Card title="Contato" hint="O WhatsApp é o número que recebe os pedidos.">
        <div className="adm-grid">
          <Txt label="Telefone (como aparece)" value={L.telefone} placeholder="(63) 99999-9999" onChange={(v) => up({ telefone: v })} />
          <Txt label="WhatsApp dos pedidos" value={L.whatsapp} placeholder="5563999999999" hint="Só números, com 55 + DDD + número." onChange={(v) => up({ whatsapp: v.replace(/\D/g, "") })} />
        </div>
      </Card>
      <Card title="Entrega e retirada">
        <Switch on={L.retirada} onChange={(v) => up({ retirada: v })} label="Retirada no local" sub="O cliente busca na churrascaria" />
        <Switch on={L.entrega} onChange={(v) => up({ entrega: v })} label="Entrega" sub="Você leva até o cliente" />
        <Money label="Taxa de entrega" value={L.taxaEntrega} onChange={(v) => up({ taxaEntrega: v })} hint="Somada ao total quando o cliente escolhe entrega. Use 0 para entrega grátis." />
      </Card>
      <Pagamentos {...props} />
    </>
  );
}

function Pagamentos({ cfg, set }: P) {
  const [nome, setNome] = useState("");
  const L = cfg.loja;
  const setP = (pagamentos: Loja["pagamentos"]) => set({ ...cfg, loja: { ...L, pagamentos } });
  return (
    <Card title="Formas de pagamento" hint="Desative as que você não aceita. Para o campo de troco aparecer, o nome deve conter “dinheiro”.">
      {L.pagamentos.map((p) => (
        <div className="adm-pay" key={p.id}>
          <input value={p.label} onChange={(e) => setP(L.pagamentos.map((x) => (x.id === p.id ? { ...x, label: e.target.value } : x)))} aria-label="Nome da forma de pagamento" />
          <Switch on={p.ativo} onChange={(v) => setP(L.pagamentos.map((x) => (x.id === p.id ? { ...x, ativo: v } : x)))} label={p.ativo ? "Aceita" : "Desativada"} />
          <button className="adm-ic danger" aria-label={"Excluir " + p.label} onClick={() => setP(L.pagamentos.filter((x) => x.id !== p.id))}><Trash2 size={16} /></button>
        </div>
      ))}
      <div className="adm-add">
        <input placeholder="Nova forma de pagamento (ex.: Vale-refeição)" value={nome} onChange={(e) => setNome(e.target.value)} />
        <button className="adm-btn primary" onClick={() => { if (nome.trim()) { setP(L.pagamentos.concat([{ id: uid(), label: nome.trim(), ativo: true }])); setNome(""); } }}><Plus size={16} /> Adicionar</button>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ Usuário e senha */
export function UsuarioTab({ login, onChanged }: { login: string; onChanged: (novo: string) => void }) {
  const [atual, setAtual] = useState("");
  const [novoLogin, setNovoLogin] = useState(login);
  const [nova, setNova] = useState("");
  const [rep, setRep] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const salvar = async () => {
    setMsg(null);
    if (nova.length < 8) return setMsg({ ok: false, t: "A nova senha precisa ter pelo menos 8 caracteres." });
    if (nova !== rep) return setMsg({ ok: false, t: "A confirmação da senha não confere." });
    setBusy(true);
    try {
      const r = await fetch("/api/admin/senha", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ senhaAtual: atual, novoLogin, novaSenha: nova }) });
      const j = await r.json();
      if (!r.ok) setMsg({ ok: false, t: j.erro || "Não foi possível alterar." });
      else { setMsg({ ok: true, t: "Senha alterada com sucesso." }); setAtual(""); setNova(""); setRep(""); onChanged(j.login); }
    } catch { setMsg({ ok: false, t: "Sem conexão. Tente de novo." }); }
    setBusy(false);
  };

  return (
    <Card title="Usuário e senha" hint="A senha nunca fica salva em texto: o sistema guarda apenas uma versão criptografada. Anote a nova senha em local seguro.">
      <Txt label="Login" value={novoLogin} onChange={setNovoLogin} />
      <Txt label="Senha atual" type="password" value={atual} onChange={setAtual} />
      <Txt label="Nova senha (mínimo 8 caracteres)" type="password" value={nova} onChange={setNova} />
      <Txt label="Repita a nova senha" type="password" value={rep} onChange={setRep} />
      {msg && <p className={msg.ok ? "adm-ok" : "adm-err"} role="status">{msg.t}</p>}
      <button className="adm-btn primary" disabled={busy || !atual || !nova} onClick={salvar}>{busy ? "Salvando..." : "Alterar login e senha"}</button>
    </Card>
  );
}
