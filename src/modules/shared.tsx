"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

export function IconButton({ children, onClick, title, active, className = "" }: {
  children: ReactNode; onClick?: () => void; title?: string; active?: boolean; className?: string;
}) {
  return <button type="button" className={`icon-button ${active ? "is-active" : ""} ${className}`} onClick={onClick} title={title} aria-label={title}>{children}</button>;
}

export function Pill({ children, tone = "neutral", className = "" }: { children: ReactNode; tone?: string; className?: string }) {
  return <span className={`pill pill-${tone} ${className}`}>{children}</span>;
}

export function Modal({ children, onClose, className = "", backdropClassName = "", label }: {
  children: ReactNode; onClose: () => void; className?: string; backdropClassName?: string; label?: string;
}) {
  return (
    <div className={`modal-backdrop ${backdropClassName}`} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} role="presentation">
      <div className={`modal-panel ${className}`} role="dialog" aria-modal="true" aria-label={label}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="field"><span className="field-label">{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" className={`toggle-row ${checked ? "is-on" : ""}`} onClick={() => onChange(!checked)} aria-pressed={checked}>
      <span className="toggle-track"><span className="toggle-thumb" /></span><span>{label}</span>
    </button>
  );
}

export function SectionTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="section-heading">
      <div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h2>{title}</h2>{description && <p>{description}</p>}</div>
      {action}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="empty-state"><span>◇</span><p>{text}</p></div>;
}
