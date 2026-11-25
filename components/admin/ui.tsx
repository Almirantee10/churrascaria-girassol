"use client";

import { useRef, useState, type ReactNode } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";

export const uid = () => Math.random().toString(36).slice(2, 10);

/** Reduz a foto no navegador (até 640 px, JPEG) para caber no armazenamento. */
export async function fileToDataUrl(file: File, maxW = 640, maxBytes = 300_000): Promise<string> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, maxW / Math.max(bmp.width, bmp.height));
  const cv = document.createElement("canvas");
  cv.width = Math.round(bmp.width * k);
  cv.height = Math.round(bmp.height * k);
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
  let q = 0.85;
  let out = cv.toDataURL("image/jpeg", q);
  while (out.length > maxBytes * 1.37 && q > 0.35) { q -= 0.1; out = cv.toDataURL("image/jpeg", q); }
  return out;
}

export function Card({ title, hint, children, actions }: { title?: string; hint?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="adm-card">
      {(title || actions) && (
        <header>
          <div>{title && <h3>{title}</h3>}{hint && <p>{hint}</p>}</div>
          {actions && <div className="adm-actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Txt({ label, value, onChange, placeholder, type = "text", multi, hint, prefix }: { label: string; value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string; multi?: boolean; hint?: string; prefix?: string }) {
  return (
    <label className="adm-f">
      <span>{label}</span>
      <span className="adm-box">
        {prefix && <i>{prefix}</i>}
        {multi
          ? <textarea rows={3} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
          : <input type={type} inputMode={type === "number" ? "decimal" : undefined} step={type === "number" ? "0.01" : undefined} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
      </span>
      {hint && <small>{hint}</small>}
    </label>
  );
}

/** Campo de valor em reais. Guarda número; aceita vírgula. */
export function Money({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  const [txt, setTxt] = useState<string | null>(null);
  return (
    <Txt label={label} hint={hint} prefix="R$" value={txt ?? String(value).replace(".", ",")}
      onChange={(v) => { setTxt(v); const n = parseFloat(v.replace(",", ".")); if (Number.isFinite(n) && n >= 0) onChange(Math.round(n * 100) / 100); else if (v === "") onChange(0); }} />
  );
}

export function Switch({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} className={"adm-sw" + (on ? " on" : "")} onClick={() => onChange(!on)}>
      <span className="sw-track"><i /></span>
      <span className="sw-txt"><b>{label}</b>{sub && <small>{sub}</small>}</span>
    </button>
  );
}

export function ImageField({ label, value, onChange, round }: { label: string; value: string; onChange: (v: string) => void; round?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");
  const pick = async (f?: File) => {
    if (!f) return;
    setErr("");
    try { onChange(await fileToDataUrl(f)); } catch { setErr("Não foi possível ler essa imagem."); }
  };
  return (
    <div className="adm-f">
      <span>{label}</span>
      <div className="adm-img">
        <div className={"adm-thumb" + (round ? " round" : "")} style={value ? { backgroundImage: `url('${value}')` } : undefined}>{!value && <ImagePlus size={22} />}</div>
        <div className="adm-actions">
          <button type="button" className="adm-btn" onClick={() => ref.current?.click()}>{value ? "Trocar imagem" : "Enviar imagem"}</button>
          {value && <button type="button" className="adm-btn ghost" onClick={() => onChange("")}><Trash2 size={14} /> Remover</button>}
        </div>
        <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      {err && <small className="adm-err">{err}</small>}
    </div>
  );
}

export function Modal({ title, onClose, children, foot }: { title: string; onClose: () => void; children: ReactNode; foot?: ReactNode }) {
  return (
    <div className="adm-modal" role="dialog" aria-modal aria-label={title}>
      <div className="adm-modal-back" onClick={onClose} />
      <div className="adm-modal-box">
        <header><h3>{title}</h3><button className="adm-x" onClick={onClose} aria-label="Fechar"><X size={18} /></button></header>
        <div className="adm-modal-body">{children}</div>
        {foot && <footer>{foot}</footer>}
      </div>
    </div>
  );
}

/** Troca de posição de um item de uma lista (para reordenar). */
export function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const a = list.slice();
  const [x] = a.splice(from, 1);
  a.splice(to, 0, x);
  return a;
}
