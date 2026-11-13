"use client";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const LABELS: Record<string, string> = {
  ctaLabel: "Button label", ctaHref: "Button link", imageQuery: "Image description", image: "Image URL (https://…)",
  href: "Link", brand: "Brand name", subheading: "Subheading", imageQueryAlt: "Image description",
};
const humanize = (k: string) => LABELS[k] ?? k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
const LONG = /body|description|quote|answer|excerpt|subheading/i;

type Props = { label: string; value: unknown; onChange: (v: unknown) => void; fallback?: unknown };

function blankLike(v: unknown): unknown {
  if (typeof v === "string") return "";
  if (typeof v === "number") return 0;
  if (typeof v === "boolean") return false;
  if (Array.isArray(v)) return [];
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v as object).map(([k, x]) => [k, blankLike(x)]));
  return "";
}

function summary(v: unknown, i: number): string {
  if (typeof v === "string") return v || `Item ${i + 1}`;
  if (v && typeof v === "object") {
    const first = Object.values(v as object).find((x) => typeof x === "string" && x);
    if (typeof first === "string") return first.slice(0, 32);
  }
  return `Item ${i + 1}`;
}

export function Field({ label, value, onChange, fallback }: Props) {
  if (typeof value === "string") {
    const long = value.length > 70 || LONG.test(label);
    return (
      <label className="grid gap-1">
        <span className="field-label">{humanize(label)}</span>
        {long ? (
          <textarea className="input min-h-[84px]" value={value} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
        )}
      </label>
    );
  }
  if (typeof value === "number") {
    return (
      <label className="grid gap-1">
        <span className="field-label">{humanize(label)}</span>
        <input type="number" className="input" value={value} onChange={(e) => onChange(Number(e.target.value))} />
      </label>
    );
  }
  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} /> {humanize(label)}
      </label>
    );
  }
  if (Array.isArray(value)) return <ArrayField label={label} value={value} onChange={onChange} fallback={fallback} />;
  if (value && typeof value === "object") return <ObjectFields value={value as Record<string, unknown>} onChange={onChange} />;
  return null;
}

function ObjectFields({ value, onChange }: { value: Record<string, unknown>; onChange: (v: unknown) => void }) {
  return (
    <div className="grid gap-3">
      {Object.entries(value)
        .filter(([k]) => !k.startsWith("__"))
        .map(([k, v]) => (
          <Field key={k} label={k} value={v} onChange={(nv) => onChange({ ...value, [k]: nv })} />
        ))}
    </div>
  );
}

function ArrayField({ label, value, onChange, fallback }: { label: string; value: unknown[]; onChange: (v: unknown) => void; fallback?: unknown }) {
  const [open, setOpen] = useState<number | null>(0);
  const template = value.length ? blankLike(value[0]) : Array.isArray(fallback) && fallback.length ? blankLike(fallback[0]) : "";
  const swap = (i: number, j: number) => {
    if (j < 0 || j >= value.length) return;
    const n = [...value];
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
    setOpen(j);
  };
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <span className="field-label">{humanize(label)}</span>
        <button type="button" className="btn-mini" onClick={() => { onChange([...value, template]); setOpen(value.length); }}>
          <Plus size={12} /> Add
        </button>
      </div>
      {value.map((item, i) => {
        const isPrimitive = typeof item !== "object" || item === null;
        return (
          <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1 px-2 py-1.5">
              <button type="button" className="flex-1 truncate text-left text-sm font-medium" onClick={() => setOpen(open === i ? null : i)}>
                {isPrimitive ? <span className="text-slate-500">{i + 1}.</span> : null} {isPrimitive ? "" : summary(item, i)}
              </button>
              <button type="button" className="icon-btn" aria-label="Move up" onClick={() => swap(i, i - 1)}><ChevronUp size={14} /></button>
              <button type="button" className="icon-btn" aria-label="Move down" onClick={() => swap(i, i + 1)}><ChevronDown size={14} /></button>
              <button type="button" className="icon-btn text-red-500" aria-label="Remove" onClick={() => onChange(value.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
            </div>
            {(isPrimitive || open === i) && (
              <div className="border-t border-slate-200 p-2 dark:border-slate-700">
                <Field
                  label={isPrimitive ? "Text" : label}
                  value={item}
                  onChange={(nv) => onChange(value.map((x, j) => (j === i ? nv : x)))}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Generic editor for any section's props: strings, numbers, nested lists and objects. Keys starting "__" are style data. */
export function PropsEditor({ value, defaults, onChange }: { value: Record<string, unknown>; defaults: Record<string, unknown>; onChange: (v: Record<string, unknown>, key: string) => void }) {
  return (
    <div className="grid gap-4">
      {Object.entries(value)
        .filter(([k]) => !k.startsWith("__"))
        .map(([k, v]) => (
          <Field key={k} label={k} value={v} fallback={defaults[k]} onChange={(nv) => onChange({ ...value, [k]: nv }, k)} />
        ))}
    </div>
  );
}
