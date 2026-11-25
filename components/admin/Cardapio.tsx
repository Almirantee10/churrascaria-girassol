"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { fmt } from "@/lib/data";
import type { Adicional, Catalogo, Grupo, Item } from "@/lib/types";
import { Card, ImageField, Modal, Money, Switch, Txt, move, uid } from "./ui";

type P = { cfg: Catalogo; set: (c: Catalogo) => void };

const Confirm = ({ msg, onYes, onNo }: { msg: string; onYes: () => void; onNo: () => void }) => (
  <Modal title="Confirmar exclusão" onClose={onNo} foot={<><button className="adm-btn danger" onClick={onYes}>Excluir</button><button className="adm-btn ghost" onClick={onNo}>Cancelar</button></>}>
    <p>{msg}</p>
  </Modal>
);

/* ------------------------------------------------------------------ Cardápio (itens + adicionais) */
export function CardapioTab({ cfg, set }: P) {
  const [vista, setVista] = useState<string>(cfg.grupos[0]?.id ?? "adicionais");
  const [edit, setEdit] = useState<{ tipo: "item"; v: Item; novo: boolean } | { tipo: "adic"; v: Adicional; novo: boolean } | null>(null);
  const [del, setDel] = useState<{ tipo: "item" | "adic"; id: string; nome: string } | null>(null);

  const grupo = cfg.grupos.find((g) => g.id === vista);
  const itens = cfg.itens.filter((i) => i.grupoId === vista);

  /** Reordena dentro do grupo, preservando a posição dos demais itens. */
  const moveItem = (id: string, dir: -1 | 1) => {
    const idxs = cfg.itens.map((i, k) => (i.grupoId === vista ? k : -1)).filter((k) => k >= 0);
    const pos = idxs.findIndex((k) => cfg.itens[k].id === id);
    const to = pos + dir;
    if (to < 0 || to >= idxs.length) return;
    const a = cfg.itens.slice();
    [a[idxs[pos]], a[idxs[to]]] = [a[idxs[to]], a[idxs[pos]]];
    set({ ...cfg, itens: a });
  };
  const patchItem = (id: string, p: Partial<Item>) => set({ ...cfg, itens: cfg.itens.map((i) => (i.id === id ? { ...i, ...p } : i)) });
  const patchAdic = (id: string, p: Partial<Adicional>) => set({ ...cfg, adicionais: cfg.adicionais.map((a) => (a.id === id ? { ...a, ...p } : a)) });
  const dupItem = (i: Item) => { const k = cfg.itens.findIndex((x) => x.id === i.id); const a = cfg.itens.slice(); a.splice(k + 1, 0, { ...i, id: uid(), nome: i.nome + " (cópia)" }); set({ ...cfg, itens: a }); };
  const dupAdic = (x: Adicional) => { const k = cfg.adicionais.findIndex((y) => y.id === x.id); const a = cfg.adicionais.slice(); a.splice(k + 1, 0, { ...x, id: uid(), nome: x.nome + " (cópia)" }); set({ ...cfg, adicionais: a }); };

  const salvar = () => {
    if (!edit || !edit.v.nome.trim()) return;
    if (edit.tipo === "item") set({ ...cfg, itens: edit.novo ? cfg.itens.concat([edit.v]) : cfg.itens.map((i) => (i.id === edit.v.id ? edit.v : i)) });
    else set({ ...cfg, adicionais: edit.novo ? cfg.adicionais.concat([edit.v]) : cfg.adicionais.map((a) => (a.id === edit.v.id ? edit.v : a)) });
    setEdit(null);
  };

  return (
    <>
      <Card title="Cardápio" hint="Itens que o cliente escolhe na montagem da marmita, e adicionais com valor extra."
        actions={<button className="adm-btn primary" onClick={() => setEdit(vista === "adicionais" ? { tipo: "adic", novo: true, v: { id: uid(), nome: "", descricao: "", imagem: "", preco: 0, disponivel: true } } : { tipo: "item", novo: true, v: { id: uid(), grupoId: vista, nome: "", descricao: "", imagem: "", disponivel: true, precoExtra: 0 } })}><Plus size={16} /> Novo {vista === "adicionais" ? "adicional" : "item"}</button>}>
        <div className="adm-tabs-s">
          {cfg.grupos.map((g) => <button key={g.id} className={vista === g.id ? "on" : ""} onClick={() => setVista(g.id)}>{g.label}{!g.ativo && " (off)"}</button>)}
          <button className={vista === "adicionais" ? "on" : ""} onClick={() => setVista("adicionais")}>Adicionais</button>
        </div>

        {vista !== "adicionais" && (
          <>
            {grupo && <p className="adm-rule">Regra: {grupo.min === 0 ? "opcional" : `mínimo ${grupo.min}`}, máximo {grupo.max}. (Altere em Categorias.)</p>}
            {itens.length === 0 && <p className="adm-empty">Nenhum item nesta categoria. Toque em “Novo item”.</p>}
            <ul className="adm-list">
              {itens.map((i, k) => (
                <li key={i.id} className={i.disponivel ? "" : "off"}>
                  <span className="adm-thumb sm" style={i.imagem ? { backgroundImage: `url('${i.imagem}')` } : undefined} />
                  <span className="grow"><b>{i.nome}</b><small>{i.descricao || "sem descrição"}{i.precoExtra > 0 ? ` · +${fmt(i.precoExtra)}` : ""}</small></span>
                  <Switch on={i.disponivel} onChange={(v) => patchItem(i.id, { disponivel: v })} label={i.disponivel ? "Disponível" : "Indisponível"} />
                  <span className="adm-actions">
                    <button className="adm-ic" aria-label="Subir" disabled={k === 0} onClick={() => moveItem(i.id, -1)}><ArrowUp size={16} /></button>
                    <button className="adm-ic" aria-label="Descer" disabled={k === itens.length - 1} onClick={() => moveItem(i.id, 1)}><ArrowDown size={16} /></button>
                    <button className="adm-ic" aria-label="Editar" onClick={() => setEdit({ tipo: "item", novo: false, v: i })}><Pencil size={16} /></button>
                    <button className="adm-ic" aria-label="Duplicar" onClick={() => dupItem(i)}><Copy size={16} /></button>
                    <button className="adm-ic danger" aria-label="Excluir" onClick={() => setDel({ tipo: "item", id: i.id, nome: i.nome })}><Trash2 size={16} /></button>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {vista === "adicionais" && (
          <>
            {cfg.adicionais.length === 0 && <p className="adm-empty">Nenhum adicional. Crie extras com valor, como ovo, bebida ou sobremesa. Eles aparecem como uma etapa opcional na montagem.</p>}
            <ul className="adm-list">
              {cfg.adicionais.map((a, k) => (
                <li key={a.id} className={a.disponivel ? "" : "off"}>
                  <span className="adm-thumb sm" style={a.imagem ? { backgroundImage: `url('${a.imagem}')` } : undefined} />
                  <span className="grow"><b>{a.nome}</b><small>{a.descricao || "sem descrição"} · +{fmt(a.preco)}</small></span>
                  <Switch on={a.disponivel} onChange={(v) => patchAdic(a.id, { disponivel: v })} label={a.disponivel ? "Disponível" : "Indisponível"} />
                  <span className="adm-actions">
                    <button className="adm-ic" aria-label="Subir" disabled={k === 0} onClick={() => set({ ...cfg, adicionais: move(cfg.adicionais, k, k - 1) })}><ArrowUp size={16} /></button>
                    <button className="adm-ic" aria-label="Descer" disabled={k === cfg.adicionais.length - 1} onClick={() => set({ ...cfg, adicionais: move(cfg.adicionais, k, k + 1) })}><ArrowDown size={16} /></button>
                    <button className="adm-ic" aria-label="Editar" onClick={() => setEdit({ tipo: "adic", novo: false, v: a })}><Pencil size={16} /></button>
                    <button className="adm-ic" aria-label="Duplicar" onClick={() => dupAdic(a)}><Copy size={16} /></button>
                    <button className="adm-ic danger" aria-label="Excluir" onClick={() => setDel({ tipo: "adic", id: a.id, nome: a.nome })}><Trash2 size={16} /></button>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {edit && (
        <Modal title={(edit.novo ? "Novo " : "Editar ") + (edit.tipo === "item" ? "item" : "adicional")} onClose={() => setEdit(null)}
          foot={<><button className="adm-btn primary" disabled={!edit.v.nome.trim()} onClick={salvar}>Salvar</button><button className="adm-btn ghost" onClick={() => setEdit(null)}>Cancelar</button></>}>
          <Txt label="Nome" value={edit.v.nome} onChange={(v) => setEdit({ ...edit, v: { ...edit.v, nome: v } } as typeof edit)} />
          <Txt label="Descrição (opcional)" multi value={edit.v.descricao} onChange={(v) => setEdit({ ...edit, v: { ...edit.v, descricao: v } } as typeof edit)} />
          {edit.tipo === "item" ? (
            <>
              <label className="adm-f"><span>Categoria</span>
                <select className="adm-select" value={edit.v.grupoId} onChange={(e) => setEdit({ ...edit, v: { ...edit.v, grupoId: e.target.value } })}>
                  {cfg.grupos.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                </select>
              </label>
              <Money label="Valor extra (opcional)" hint="Deixe 0 para não cobrar nada além do preço da marmita." value={edit.v.precoExtra} onChange={(v) => setEdit({ ...edit, v: { ...edit.v, precoExtra: v } })} />
            </>
          ) : (
            <Money label="Preço do adicional" value={edit.v.preco} onChange={(v) => setEdit({ ...edit, v: { ...edit.v, preco: v } })} />
          )}
          <ImageField label="Imagem (opcional)" value={edit.v.imagem} onChange={(v) => setEdit({ ...edit, v: { ...edit.v, imagem: v } } as typeof edit)} round />
          <Switch on={edit.v.disponivel} onChange={(v) => setEdit({ ...edit, v: { ...edit.v, disponivel: v } } as typeof edit)} label="Disponível para pedido" />
        </Modal>
      )}
      {del && (
        <Confirm msg={`Excluir “${del.nome}”? Isso não pode ser desfeito. Para só tirar do ar por hoje, use o botão Disponível/Indisponível.`} onNo={() => setDel(null)}
          onYes={() => { set(del.tipo === "item" ? { ...cfg, itens: cfg.itens.filter((i) => i.id !== del.id) } : { ...cfg, adicionais: cfg.adicionais.filter((a) => a.id !== del.id) }); setDel(null); }} />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ Categorias */
export function CategoriasTab({ cfg, set }: P) {
  const [del, setDel] = useState<Grupo | null>(null);
  const patch = (id: string, p: Partial<Grupo>) => set({ ...cfg, grupos: cfg.grupos.map((g) => (g.id === id ? { ...g, ...p } : g)) });
  const num = (v: string, d: number) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.max(0, Math.min(50, n)) : d; };

  return (
    <>
      <Card title="Categorias da marmita" hint="Cada categoria é uma etapa da montagem (carne, farofa, acompanhamento, salada...). A ordem aqui é a ordem que o cliente vê."
        actions={<button className="adm-btn primary" onClick={() => set({ ...cfg, grupos: cfg.grupos.concat([{ id: uid(), label: "Nova categoria", titulo: "Nova categoria", dica: "", min: 0, max: 1, ativo: true }]) })}><Plus size={16} /> Nova categoria</button>}>
        {cfg.grupos.map((g, k) => (
          <div className={"adm-group" + (g.ativo ? "" : " off")} key={g.id}>
            <div className="adm-group-h">
              <b>{g.label || "Categoria"}</b>
              <span className="adm-actions">
                <button className="adm-ic" aria-label="Subir" disabled={k === 0} onClick={() => set({ ...cfg, grupos: move(cfg.grupos, k, k - 1) })}><ArrowUp size={16} /></button>
                <button className="adm-ic" aria-label="Descer" disabled={k === cfg.grupos.length - 1} onClick={() => set({ ...cfg, grupos: move(cfg.grupos, k, k + 1) })}><ArrowDown size={16} /></button>
                <button className="adm-ic danger" aria-label="Excluir" onClick={() => setDel(g)}><Trash2 size={16} /></button>
              </span>
            </div>
            <div className="adm-grid">
              <Txt label="Nome curto (etapas)" value={g.label} onChange={(v) => patch(g.id, { label: v })} />
              <Txt label="Título" value={g.titulo} onChange={(v) => patch(g.id, { titulo: v })} />
            </div>
            <Txt label="Dica para o cliente" value={g.dica} onChange={(v) => patch(g.id, { dica: v })} placeholder="Ex.: Escolha até 2 carnes" />
            <div className="adm-grid">
              <Txt label="Mínimo de escolhas" type="number" value={g.min} hint="0 = o cliente pode não escolher nada" onChange={(v) => patch(g.id, { min: Math.min(num(v, 0), g.max) })} />
              <Txt label="Máximo de escolhas" type="number" value={g.max} hint="1 = escolhe só uma opção" onChange={(v) => { const m = Math.max(1, num(v, 1)); patch(g.id, { max: m, min: Math.min(g.min, m) }); }} />
            </div>
            <Switch on={g.ativo} onChange={(v) => patch(g.id, { ativo: v })} label={g.ativo ? "Categoria ativa" : "Categoria desativada (oculta para o cliente)"} />
          </div>
        ))}
      </Card>
      {del && <Confirm msg={`Excluir a categoria “${del.label}” e todos os itens dela (${cfg.itens.filter((i) => i.grupoId === del.id).length})? Para ocultar sem apagar, desative a categoria.`} onNo={() => setDel(null)}
        onYes={() => { set({ ...cfg, grupos: cfg.grupos.filter((g) => g.id !== del.id), itens: cfg.itens.filter((i) => i.grupoId !== del.id) }); setDel(null); }} />}
    </>
  );
}

/* ------------------------------------------------------------------ Montagem da marmita */
export function MontagemTab({ cfg, set }: P) {
  const [novo, setNovo] = useState<Record<string, string>>({});
  const patchItem = (id: string, p: Partial<Item>) => set({ ...cfg, itens: cfg.itens.map((i) => (i.id === id ? { ...i, ...p } : i)) });
  const add = (g: Grupo) => {
    const nome = (novo[g.id] ?? "").trim();
    if (!nome) return;
    set({ ...cfg, itens: cfg.itens.concat([{ id: uid(), grupoId: g.id, nome, descricao: "", imagem: "", disponivel: true, precoExtra: 0 }]) });
    setNovo({ ...novo, [g.id]: "" });
  };
  return (
    <>
      <Card title="Montagem da marmita" hint="Controle rápido do que está disponível hoje em cada categoria. Desligue o que acabou e ligue de novo quando voltar." >
        <p className="adm-rule">Preço da marmita: <b>{fmt(cfg.loja.preco)}</b> (altere na aba Preços).</p>
      </Card>
      {cfg.grupos.map((g) => (
        <Card key={g.id} title={g.label + (g.ativo ? "" : " (desativada)")} hint={`${g.min === 0 ? "Opcional" : `Mínimo ${g.min}`} · máximo ${g.max}`}>
          <ul className="adm-list compact">
            {cfg.itens.filter((i) => i.grupoId === g.id).map((i) => (
              <li key={i.id} className={i.disponivel ? "" : "off"}>
                <span className="grow"><b>{i.nome}</b></span>
                <Switch on={i.disponivel} onChange={(v) => patchItem(i.id, { disponivel: v })} label={i.disponivel ? "Tem hoje" : "Acabou"} />
                <button className="adm-ic danger" aria-label={"Remover " + i.nome} onClick={() => set({ ...cfg, itens: cfg.itens.filter((x) => x.id !== i.id) })}><Trash2 size={16} /></button>
              </li>
            ))}
          </ul>
          <div className="adm-add">
            <input placeholder={`Adicionar em ${g.label.toLowerCase()}...`} value={novo[g.id] ?? ""} onChange={(e) => setNovo({ ...novo, [g.id]: e.target.value })} onKeyDown={(e) => e.key === "Enter" && add(g)} />
            <button className="adm-btn primary" onClick={() => add(g)}><Plus size={16} /> Adicionar</button>
          </div>
        </Card>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ Preços */
export function PrecosTab({ cfg, set }: P) {
  const patchItem = (id: string, p: Partial<Item>) => set({ ...cfg, itens: cfg.itens.map((i) => (i.id === id ? { ...i, ...p } : i)) });
  const patchAdic = (id: string, p: Partial<Adicional>) => set({ ...cfg, adicionais: cfg.adicionais.map((a) => (a.id === id ? { ...a, ...p } : a)) });
  return (
    <>
      <Card title="Preço da marmita" hint="Vale para toda marmita, independentemente das escolhas. Os clientes veem o novo valor em poucos segundos.">
        <Money label="Preço da marmita" value={cfg.loja.preco} onChange={(v) => set({ ...cfg, loja: { ...cfg.loja, preco: v } })} />
      </Card>
      <Card title="Adicionais" hint="Valores cobrados a mais.">
        {cfg.adicionais.length === 0 && <p className="adm-empty">Nenhum adicional criado. Crie na aba Cardápio → Adicionais.</p>}
        {cfg.adicionais.map((a) => <div className="adm-price" key={a.id}><b>{a.nome}</b><Money label="Preço" value={a.preco} onChange={(v) => patchAdic(a.id, { preco: v })} /></div>)}
      </Card>
      <Card title="Valor extra por item" hint="Opcional. Use para itens que custam mais (ex.: uma carne especial). 0 = sem valor extra.">
        {cfg.grupos.map((g) => (
          <div key={g.id}>
            <h4 className="adm-sub">{g.label}</h4>
            {cfg.itens.filter((i) => i.grupoId === g.id).map((i) => <div className="adm-price" key={i.id}><b>{i.nome}</b><Money label="Extra" value={i.precoExtra} onChange={(v) => patchItem(i.id, { precoExtra: v })} /></div>)}
          </div>
        ))}
      </Card>
    </>
  );
}
