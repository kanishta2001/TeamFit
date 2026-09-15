import type { ReactNode } from "react";

export const inputStyle = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";
export const buttonStyle = "rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryStyle = "rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";
export const panelStyle = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}{children}</label>;
}

export function Choices({ label, options, selected, onChange }: {
  label: string; options: { value: string; label: string }[]; selected: string[];
  onChange: (value: string[]) => void;
}) {
  return <fieldset className="space-y-3">
    <legend className="mb-2 text-sm font-semibold text-slate-700">{label}</legend>
    <div className="flex flex-wrap gap-3">
      {options.map(option => <label key={option.value} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
        <input type="checkbox" checked={selected.includes(option.value)}
          onChange={event => onChange(event.target.checked
            ? [...selected, option.value] : selected.filter(value => value !== option.value))}
          className="accent-indigo-600" />
        {option.label}
      </label>)}
      {options.length === 0 && <p className="text-sm text-slate-500">No options yet. Add a skill below.</p>}
    </div>
  </fieldset>;
}

export function Tags({ values }: { values: string[] }) {
  return <div className="flex flex-wrap gap-2">{values.map(value =>
    <span key={value} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{value}</span>)}</div>;
}

export function Notice({ text, error = false }: { text: string; error?: boolean }) {
  if (!text) return null;
  return <p role={error ? "alert" : "status"} className={`rounded-xl border p-4 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{text}</p>;
}
