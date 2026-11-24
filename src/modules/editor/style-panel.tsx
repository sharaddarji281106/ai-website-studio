"use client";
import { ChevronDown, ChevronRight, Monitor, RotateCcw, Smartphone, Tablet, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { FONTS, type FontName, type SectionType, type Theme } from "@/modules/site/schema";
import {
  GRID_TYPES, RANGE, cleanHide, cleanStyle, clearResponsive, hasOverride, isHex, isLocked, safeUrl, setResponsive, valueAt,
  type Device, type Hide, type ResponsiveKey, type SectionStyle,
} from "@/modules/site/style";
import { SECTION_META } from "./defaults";
import { selectActivePage, useEditor } from "./store";

/* The property panel. Every control edits `props.__style` on the selected section (see site/style.ts), so it works
   the same on AI-generated sections and on blocks added by hand to a blank canvas. Nothing here assumes the AI ran. */

/* ---------------- writing to the document ---------------- */

/** Reads the section fresh from the store (never a stale render copy), applies fn to its style, and saves it as one undo step. */
function patchStyle(sectionId: string, fn: (s: SectionStyle) => SectionStyle, key?: string) {
  const st = useEditor.getState();
  const sec = selectActivePage(st).sections.find((x) => x.id === sectionId);
  if (!sec) return;
  const next = fn(cleanStyle(sec.props.__style));
  const props = { ...sec.props };
  if (Object.keys(next).length) props.__style = next;
  else delete props.__style;
  st.replaceProps(sectionId, props, key);
}

function patchHide(sectionId: string, device: Device, hidden: boolean) {
  const st = useEditor.getState();
  const sec = selectActivePage(st).sections.find((x) => x.id === sectionId);
  if (!sec) return;
  const next: Hide = cleanHide(sec.props.__hide);
  if (hidden) next[device] = true;
  else delete next[device];
  const props = { ...sec.props };
  if (Object.keys(next).length) props.__hide = next;
  else delete props.__hide;
  st.replaceProps(sectionId, props);
}

/** Sets a style key, or removes it when the value is undefined (back to automatic). */
function put<K extends keyof SectionStyle>(s: SectionStyle, k: K, v: SectionStyle[K]): SectionStyle {
  const n = { ...s };
  if (v === undefined) delete n[k];
  else n[k] = v;
  return n;
}

/* ---------------- small controls ---------------- */

function Group({ title, open, onToggle, disabled, children }: { title: string; open: boolean; onToggle: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <div className="border-t border-slate-200 dark:border-slate-800">
      <button type="button" className="flex w-full items-center justify-between px-3 py-2.5 text-left" aria-expanded={open} onClick={onToggle}>
        <span className="panel-title">{title}</span>
        {open ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
      </button>
      {open && <fieldset disabled={disabled} className="grid min-w-0 gap-3.5 px-3 pb-4 disabled:opacity-60">{children}</fieldset>}
    </div>
  );
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; label?: string }) {
  return (
    <div className="grid gap-1">
      {label && <span className="field-label">{label}</span>}
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            aria-pressed={value === o.v}
            onClick={() => onChange(o.v)}
            className={`rounded-md px-2 py-1 text-xs font-medium transition ${value === o.v ? "bg-white shadow-sm dark:bg-slate-700" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: { v: string; l: string }[]; onChange: (v: string) => void }) {
  return (
    <label className="grid gap-1">
      <span className="field-label">{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}

const fmt = (n: number) => String(Math.round(n * 1000) / 1000);

function Slider({
  label, value, min, max, step, unit = "", auto = "Auto", idle, overridden, onChange, onReset,
}: {
  label: string; value: number | undefined; min: number; max: number; step: number; unit?: string;
  /** text shown while the value is unset */ auto?: string;
  /** where the thumb rests while the value is automatic */ idle?: number;
  /** true when this screen size has its own value */ overridden?: boolean;
  onChange: (v: number) => void; onReset?: () => void;
}) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="field-label">
          {label}
          {overridden && <span className="ml-1 text-indigo-500" title="Set only for this screen size" aria-label="Set only for this screen size">●</span>}
        </span>
        <span className="flex items-center gap-1">
          <span className="text-xs tabular-nums text-slate-500">{value === undefined ? auto : `${fmt(value)}${unit}`}</span>
          {value !== undefined && onReset && (
            <button type="button" className="icon-btn" aria-label={`Reset ${label}`} title="Reset" onClick={onReset}><RotateCcw size={12} /></button>
          )}
        </span>
      </div>
      <input
        type="range" aria-label={label} className="w-full accent-indigo-600"
        min={min} max={max} step={step} value={value ?? idle ?? min}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function ColorField({ label, value, fallback, onChange, onClear }: { label: string; value: string | undefined; fallback: string; onChange: (v: string) => void; onClear?: () => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className="grid gap-1">
      <span className="field-label">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color" aria-label={`${label} picker`} value={value ?? fallback}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-transparent p-0.5 dark:border-slate-700"
        />
        <input
          className="input" aria-label={`${label} hex code`} placeholder="Auto" maxLength={7} value={draft ?? value ?? ""}
          onChange={(e) => {
            const v = e.target.value.trim();
            setDraft(v);
            const withHash = v.startsWith("#") ? v : `#${v}`;
            if (isHex(withHash)) onChange(withHash.toLowerCase());
          }}
          onBlur={() => setDraft(null)}
        />
        {onClear && value !== undefined && (
          <button type="button" className="icon-btn" aria-label={`Clear ${label}`} title="Back to automatic" onClick={() => { setDraft(null); onClear(); }}><X size={14} /></button>
        )}
      </div>
    </div>
  );
}

/* ---------------- option lists ---------------- */

const FONT_OPTIONS = (first: string) => [{ v: "", l: first }, ...FONTS.map((f) => ({ v: f, l: f }))];
const WEIGHT_OPTIONS = [
  { v: "", l: "Default" }, { v: "300", l: "300 · Light" }, { v: "400", l: "400 · Regular" }, { v: "500", l: "500 · Medium" },
  { v: "600", l: "600 · Semibold" }, { v: "700", l: "700 · Bold" }, { v: "800", l: "800 · Extra bold" }, { v: "900", l: "900 · Black" },
];
type Width = NonNullable<SectionStyle["width"]>;
type Pad = NonNullable<SectionStyle["pad"]>;
type Align = NonNullable<SectionStyle["align"]>;
type Bg = NonNullable<SectionStyle["bg"]>;
type Transform = NonNullable<SectionStyle["headingTransform"]>;
type Shadow = NonNullable<SectionStyle["shadow"]>;
type BgMode = "preset" | "color" | "gradient" | "image";

const DEVICES = [
  { v: "desktop", icon: Monitor, label: "Desktop" },
  { v: "tablet", icon: Tablet, label: "Tablet" },
  { v: "mobile", icon: Smartphone, label: "Mobile" },
] as const;

function DeviceBar() {
  const device = useEditor((s) => s.device);
  const setDevice = useEditor((s) => s.setDevice);
  const note =
    device === "desktop"
      ? "These values apply on every screen size until you change them on tablet or mobile."
      : `Editing ${device}. A dot ● marks a value set only for ${device}; everything else is shared.`;
  return (
    <div className="sticky top-0 z-10 grid gap-1.5 border-b border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950">
      <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800" role="group" aria-label="Screen size to edit">
        {DEVICES.map(({ v, icon: Icon, label }) => (
          <button
            key={v} type="button" aria-pressed={device === v} onClick={() => setDevice(v)}
            className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition ${device === v ? "bg-white shadow-sm dark:bg-slate-700" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"}`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>
      <p className="text-[11px] leading-snug text-slate-500">{note}</p>
    </div>
  );
}

/* ---------------- website theme ---------------- */

function ThemeControls() {
  const theme = useEditor((s) => s.doc.theme);
  const { updateTheme } = useEditor.getState();
  return (
    <>
      <ColorField label="Brand color" value={theme.primaryColor} fallback="#4f46e5" onChange={(primaryColor) => updateTheme({ primaryColor })} />
      <Segmented<Theme["mode"]> label="Mode" value={theme.mode} onChange={(mode) => updateTheme({ mode })} options={[{ v: "light", l: "Light" }, { v: "dark", l: "Dark" }]} />
      <Select label="Body font" value={theme.fontFamily} options={FONTS.map((f) => ({ v: f, l: f }))} onChange={(v) => updateTheme({ fontFamily: v as FontName })} />
      <Select label="Heading font" value={theme.headingFont ?? ""} options={FONT_OPTIONS("Same as body")} onChange={(v) => updateTheme({ headingFont: v === "" ? undefined : (v as FontName) })} />
    </>
  );
}

/* ---------------- selected section ---------------- */

function SectionControls({ sectionId, type, isOpen, toggle }: { sectionId: string; type: SectionType; isOpen: (id: string, dflt: boolean) => boolean; toggle: (id: string, dflt: boolean) => void }) {
  const raw = useEditor((s) => selectActivePage(s).sections.find((x) => x.id === sectionId)?.props);
  const device = useEditor((s) => s.device);
  const theme = useEditor((s) => s.doc.theme);
  const style = cleanStyle(raw?.__style);
  const hide = cleanHide(raw?.__hide);
  const locked = isLocked(raw ?? {});

  // Background type is remembered here so "Image" stays selected before a link is pasted.
  const derived: BgMode = style.bgGradient ? "gradient" : style.bgImage ? "image" : style.bgColor ? "color" : "preset";
  const [picked, setPicked] = useState<BgMode | null>(null);
  const bgMode = picked ?? derived;
  const [urlDraft, setUrlDraft] = useState(style.bgImage ?? "");

  const set = <K extends keyof SectionStyle>(k: K, v: SectionStyle[K]) => patchStyle(sectionId, (s) => put(s, k, v), String(k));
  const resp = (k: ResponsiveKey) => ({
    value: valueAt(style, k, device),
    overridden: hasOverride(style, k, device),
    onChange: (n: number) => patchStyle(sectionId, (s) => setResponsive(s, k, n, device, type), `${k}-${device}`),
    onReset: () => patchStyle(sectionId, (s) => clearResponsive(s, k, device)),
  });
  const range = (k: keyof typeof RANGE) => RANGE[k];

  const changeBgMode = (m: BgMode) => {
    setPicked(m);
    patchStyle(sectionId, (s) => {
      const n = { ...s };
      delete n.bgColor; delete n.bgGradient; delete n.bgImage; delete n.bgOverlay; delete n.bgSize; delete n.bgPosition;
      if (m === "color") n.bgColor = theme.mode === "dark" ? "#111827" : "#f1f5f9";
      if (m === "gradient") n.bgGradient = { from: theme.primaryColor, to: "#0f172a", angle: 135 };
      return n;
    });
    setUrlDraft("");
  };

  const dark = theme.mode === "dark";
  const textFallback = dark ? "#e5e7eb" : "#0f172a";
  const urlOk = urlDraft.trim() === "" || safeUrl(urlDraft) !== undefined;

  const g = (id: string, dflt = false) => ({ open: isOpen(id, dflt), onToggle: () => toggle(id, dflt), disabled: locked });
  const hasGrid = GRID_TYPES.includes(type);
  const hs = resp("headingSize"), bs = resp("bodySize"), pt = resp("padTop"), pb = resp("padBottom"), mt = resp("marginTop"), mb = resp("marginBottom");
  const grad = style.bgGradient;

  return (
    <>
      <div className="flex items-center justify-between border-t border-slate-200 px-3 pb-1 pt-3 dark:border-slate-800">
        <h3 className="panel-title">{SECTION_META[type].label} section</h3>
        <button type="button" className="btn-mini" disabled={locked} title="Remove every style you set on this section (you can undo)" onClick={() => { setPicked(null); setUrlDraft(""); patchStyle(sectionId, () => ({})); }}>
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      {locked && (
        <p className="mx-3 mb-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          This section is locked. Unlock it in the Layers tab to change it.
        </p>
      )}

      <Group title="Layout & spacing" {...g("layout", true)}>
        <Segmented<Width> label="Content width" value={style.width ?? "default"} onChange={(v) => set("width", v === "default" ? undefined : v)} options={[{ v: "narrow", l: "Narrow" }, { v: "default", l: "Default" }, { v: "wide", l: "Wide" }, { v: "full", l: "Full" }]} />
        <Segmented<Pad> label="Spacing preset" value={style.pad ?? "md"} onChange={(v) => set("pad", v)} options={[{ v: "none", l: "None" }, { v: "sm", l: "S" }, { v: "md", l: "M" }, { v: "lg", l: "L" }]} />
        <Slider label="Padding top" unit="px" idle={64} {...range("padTop")} {...pt} />
        <Slider label="Padding bottom" unit="px" idle={64} {...range("padBottom")} {...pb} />
        <Slider label="Margin top" unit="px" auto="None" {...range("marginTop")} {...mt} />
        <Slider label="Margin bottom" unit="px" auto="None" {...range("marginBottom")} {...mb} />
        <Slider label="Side inset" unit="px" auto="None" value={style.marginX} {...range("marginX")} onChange={(v) => set("marginX", v)} onReset={() => set("marginX", undefined)} />
        {hasGrid && (
          <>
            <Segmented<string> label="Columns" value={style.cols ? String(style.cols) : "auto"} onChange={(v) => set("cols", v === "auto" ? undefined : Number(v))} options={[{ v: "auto", l: "Auto" }, ...[1, 2, 3, 4, 5, 6].map((n) => ({ v: String(n), l: String(n) }))]} />
            <Slider label="Gap between items" unit="px" value={style.gap} {...range("gap")} idle={20} onChange={(v) => set("gap", v)} onReset={() => set("gap", undefined)} />
            <Segmented<string> label="Vertical alignment" value={style.colAlign ?? "auto"} onChange={(v) => set("colAlign", v === "auto" ? undefined : (v as NonNullable<SectionStyle["colAlign"]>))} options={[{ v: "auto", l: "Stretch" }, { v: "start", l: "Top" }, { v: "center", l: "Middle" }, { v: "end", l: "Bottom" }]} />
          </>
        )}
        <Segmented<Align> label="Alignment" value={style.align ?? "default"} onChange={(v) => set("align", v)} options={[{ v: "default", l: "Auto" }, { v: "left", l: "Left" }, { v: "center", l: "Center" }, { v: "right", l: "Right" }]} />
      </Group>

      <Group title="Typography" {...g("type", true)}>
        <p className="field-label !font-semibold">Headings</p>
        <Select label="Font" value={style.headingFont ?? ""} options={FONT_OPTIONS("Site default")} onChange={(v) => set("headingFont", v === "" ? undefined : (v as FontName))} />
        <Slider label="Size" unit="px" idle={type === "hero" ? 56 : 36} {...range("headingSize")} {...hs} />
        <Select label="Weight" value={style.headingWeight ? String(style.headingWeight) : ""} options={WEIGHT_OPTIONS} onChange={(v) => set("headingWeight", v === "" ? undefined : Number(v))} />
        <Slider label="Line height" idle={1.2} value={style.headingLineHeight} {...range("headingLineHeight")} onChange={(v) => set("headingLineHeight", v)} onReset={() => set("headingLineHeight", undefined)} />
        <Slider label="Letter spacing" unit="em" idle={0} value={style.headingSpacing} {...range("headingSpacing")} onChange={(v) => set("headingSpacing", v)} onReset={() => set("headingSpacing", undefined)} />
        <Segmented<Transform> label="Case" value={style.headingTransform ?? "none"} onChange={(v) => set("headingTransform", v === "none" ? undefined : v)} options={[{ v: "none", l: "Normal" }, { v: "uppercase", l: "UPPER" }, { v: "capitalize", l: "Title" }]} />
        <p className="field-label !font-semibold">Body text</p>
        <Select label="Font" value={style.bodyFont ?? ""} options={FONT_OPTIONS("Site default")} onChange={(v) => set("bodyFont", v === "" ? undefined : (v as FontName))} />
        <Slider label="Size" unit="px" idle={16} {...range("bodySize")} {...bs} />
        <Select label="Weight" value={style.bodyWeight ? String(style.bodyWeight) : ""} options={WEIGHT_OPTIONS} onChange={(v) => set("bodyWeight", v === "" ? undefined : Number(v))} />
        <Slider label="Line height" idle={1.6} value={style.bodyLineHeight} {...range("bodyLineHeight")} onChange={(v) => set("bodyLineHeight", v)} onReset={() => set("bodyLineHeight", undefined)} />
      </Group>

      <Group title="Colors" {...g("colors")}>
        <ColorField label="Text" value={style.textColor} fallback={textFallback} onChange={(v) => set("textColor", v)} onClear={() => set("textColor", undefined)} />
        <ColorField label="Headings" value={style.headingColor} fallback={textFallback} onChange={(v) => set("headingColor", v)} onClear={() => set("headingColor", undefined)} />
        <ColorField label="Accent (buttons, icons)" value={style.accentColor} fallback={theme.primaryColor} onChange={(v) => set("accentColor", v)} onClear={() => set("accentColor", undefined)} />
      </Group>

      <Group title="Background" {...g("bg")}>
        <Segmented<BgMode> value={bgMode} onChange={changeBgMode} options={[{ v: "preset", l: "Preset" }, { v: "color", l: "Color" }, { v: "gradient", l: "Gradient" }, { v: "image", l: "Image" }]} />
        {bgMode === "preset" && (
          <Segmented<Bg> value={style.bg ?? "default"} onChange={(v) => set("bg", v)} options={[{ v: "default", l: "Default" }, { v: "muted", l: "Muted" }, { v: "primary", l: "Brand" }, { v: "dark", l: "Dark" }]} />
        )}
        {bgMode === "color" && (
          <ColorField label="Background color" value={style.bgColor} fallback="#f1f5f9" onChange={(v) => set("bgColor", v)} />
        )}
        {bgMode === "gradient" && grad && (
          <>
            <ColorField label="From" value={grad.from} fallback={theme.primaryColor} onChange={(from) => set("bgGradient", { ...grad, from })} />
            <ColorField label="To" value={grad.to} fallback="#0f172a" onChange={(to) => set("bgGradient", { ...grad, to })} />
            <Slider label="Angle" unit="°" value={grad.angle} {...range("angle")} onChange={(angle) => set("bgGradient", { ...grad, angle })} />
          </>
        )}
        {bgMode === "image" && (
          <>
            <label className="grid gap-1">
              <span className="field-label">Image link</span>
              <input
                className="input" inputMode="url" placeholder="https://…/photo.jpg" value={urlDraft} aria-invalid={!urlOk}
                onChange={(e) => {
                  const v = e.target.value;
                  setUrlDraft(v);
                  const ok = safeUrl(v);
                  if (ok) set("bgImage", ok);
                  else if (v.trim() === "") set("bgImage", undefined);
                }}
              />
              {!urlOk && <span className="text-xs text-red-500">Use a link that starts with https://</span>}
            </label>
            <Slider label="Dark overlay" unit="%" auto="None" idle={0} value={style.bgOverlay} {...range("bgOverlay")} onChange={(v) => set("bgOverlay", v)} onReset={() => set("bgOverlay", undefined)} />
            <Select label="Fit" value={style.bgSize ?? "cover"} options={[{ v: "cover", l: "Fill the section" }, { v: "contain", l: "Show whole image" }]} onChange={(v) => set("bgSize", v === "cover" ? undefined : (v as "contain"))} />
            <Select label="Focus" value={style.bgPosition ?? "center"} options={[{ v: "center", l: "Center" }, { v: "top", l: "Top" }, { v: "bottom", l: "Bottom" }, { v: "left", l: "Left" }, { v: "right", l: "Right" }]} onChange={(v) => set("bgPosition", v === "center" ? undefined : (v as NonNullable<SectionStyle["bgPosition"]>))} />
          </>
        )}
      </Group>

      <Group title="Border & effects" {...g("border")}>
        <Slider label="Border width" unit="px" auto="None" value={style.borderWidth} {...range("borderWidth")} onChange={(v) => set("borderWidth", v === 0 ? undefined : v)} onReset={() => set("borderWidth", undefined)} />
        {!!style.borderWidth && (
          <>
            <Select label="Border style" value={style.borderStyle ?? "solid"} options={[{ v: "solid", l: "Solid" }, { v: "dashed", l: "Dashed" }, { v: "dotted", l: "Dotted" }]} onChange={(v) => set("borderStyle", v === "solid" ? undefined : (v as NonNullable<SectionStyle["borderStyle"]>))} />
            <ColorField label="Border color" value={style.borderColor} fallback={dark ? "#334155" : "#cbd5e1"} onChange={(v) => set("borderColor", v)} onClear={() => set("borderColor", undefined)} />
          </>
        )}
        <Slider label="Corner radius" unit="px" auto="None" value={style.radius} {...range("radius")} onChange={(v) => set("radius", v === 0 ? undefined : v)} onReset={() => set("radius", undefined)} />
        <Segmented<Shadow> label="Shadow" value={style.shadow ?? "none"} onChange={(v) => set("shadow", v === "none" ? undefined : v)} options={[{ v: "none", l: "None" }, { v: "sm", l: "S" }, { v: "md", l: "M" }, { v: "lg", l: "L" }]} />
        <Slider label="Opacity" unit="%" auto="100%" idle={100} value={style.opacity} {...range("opacity")} onChange={(v) => set("opacity", v >= 100 ? undefined : v)} onReset={() => set("opacity", undefined)} />
        {(!!style.radius || style.shadow !== undefined) && !style.marginX && (
          <p className="text-[11px] leading-snug text-slate-500">Tip: add a side inset under Layout so rounded corners and shadows are visible.</p>
        )}
      </Group>

      <Group title="Visibility" {...g("visibility")}>
        <div className="flex gap-3 text-sm">
          {DEVICES.map(({ v, label }) => (
            <label key={v} className="flex items-center gap-1.5"><input type="checkbox" checked={!!hide[v]} onChange={(e) => patchHide(sectionId, v, e.target.checked)} />Hide on {label.toLowerCase()}</label>
          ))}
        </div>
      </Group>
    </>
  );
}

export function StylePanel() {
  const selectedId = useEditor((s) => s.selectedId);
  const type = useEditor((s) => selectActivePage(s).sections.find((x) => x.id === s.selectedId)?.type ?? null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const isOpen = (id: string, dflt: boolean) => open[id] ?? dflt;
  const toggle = (id: string, dflt: boolean) => setOpen((o) => ({ ...o, [id]: !(o[id] ?? dflt) }));

  return (
    <div className="pb-6">
      <DeviceBar />
      <Group title="Website theme" open={isOpen("theme", !selectedId)} onToggle={() => toggle("theme", !selectedId)}>
        <ThemeControls />
      </Group>
      {selectedId && type ? (
        // key resets the background-type memory whenever another section is selected
        <SectionControls key={selectedId} sectionId={selectedId} type={type} isOpen={isOpen} toggle={toggle} />
      ) : (
        <p className="border-t border-slate-200 p-3 text-sm text-slate-500 dark:border-slate-800">
          Select a section on the canvas to change its typography, spacing, colors, background and borders.
        </p>
      )}
    </div>
  );
}
