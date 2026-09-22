"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Skill } from "@/lib/types";

export default function SkillMultiSelect({ label, skills, selected, onChange, selectedLegacy = [], limit = 30 }: {
  label: string; skills: Skill[]; selected: string[];
  onChange: (ids: string[]) => void; selectedLegacy?: Skill[]; limit?: number;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const available = skills.filter(skill => !selected.includes(String(skill.id)));
  const chosen = selected.map(value => skills.find(skill => String(skill.id) === value)
    ?? selectedLegacy.find(skill => String(skill.id) === value)).filter((skill): skill is Skill => Boolean(skill));
  const groups = useMemo(() => {
    const ordered: { category: string; options: Skill[] }[] = [];
    const search = query.trim().toLocaleLowerCase();
    for (const skill of available) {
      for (const category of skill.categories?.length ? skill.categories : ["Other skills"]) {
        if (search && !skill.name.toLocaleLowerCase().includes(search) && !category.toLocaleLowerCase().includes(search)) continue;
        let group = ordered.find(item => item.category === category);
        if (!group) { group = { category, options: [] }; ordered.push(group); }
        group.options.push(skill);
      }
    }
    return ordered;
  }, [available, query]);
  const options = groups.flatMap(group => group.options.map(skill => ({ skill, category: group.category })));

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  function choose(skill: Skill) {
    const value = String(skill.id);
    if (selected.includes(value) || selected.length >= limit) return;
    onChange([...selected, value]);
    setQuery(""); setActive(0); setOpen(false);
  }

  return <div ref={root} className="skill-select">
    <label htmlFor={id} className="block text-sm font-semibold text-slate-700">{label}</label>
    <div className="skill-select-control">
      {chosen.map(skill => <span className="skill-chip" key={skill.id}>
        {skill.name}{selectedLegacy.some(legacy => legacy.id === skill.id) && <small className="skill-chip-legacy">Saved earlier</small>}
        <button type="button" aria-label={`Remove ${skill.name}`}
          onClick={() => onChange(selected.filter(value => value !== String(skill.id)))}>×</button>
      </span>)}
      <input ref={input} id={id} value={query} placeholder={chosen.length ? "Search more skills" : "Choose skills"}
        role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-options`}
        aria-activedescendant={open && options[active] ? `${id}-option-${active}` : undefined}
        disabled={selected.length >= limit}
        onFocus={() => setOpen(true)}
        onChange={event => { setQuery(event.target.value); setActive(0); setOpen(true); }}
        onKeyDown={event => {
          if (event.key === "Escape") { setOpen(false); return; }
          if (event.key === "ArrowDown" && options.length) { event.preventDefault(); setOpen(true); setActive(value => Math.min(value + 1, options.length - 1)); }
          if (event.key === "ArrowUp") { event.preventDefault(); setActive(value => Math.max(value - 1, 0)); }
          if (event.key === "Enter") {
            event.preventDefault();
            if (open && options[active]) choose(options[active].skill);
          }
        }} />
      <button type="button" className="skill-select-toggle" aria-label="Show skill options"
        onClick={() => { if (!open) input.current?.focus(); setOpen(value => !value); }}>⌄</button>
    </div>
    {open && <div id={`${id}-options`} role="listbox" aria-label={label} className="skill-select-list">
      {groups.length ? groups.map(group => <div key={group.category}>
        <p className="skill-select-category">{group.category}</p>
        {group.options.map(skill => {
          const index = options.findIndex(option => option.skill.id === skill.id && option.category === group.category);
          return <button type="button" role="option" aria-selected={index === active}
            id={`${id}-option-${index}`} className={index === active ? "skill-select-option is-active" : "skill-select-option"}
            key={skill.id} onMouseEnter={() => setActive(index)}
            onClick={() => choose(skill)}>{skill.name}</button>;
        })}
      </div>) : <p className="skill-select-empty">No matching skills in the catalogue.</p>}
    </div>}
    <p className="skill-select-help">{selected.length}/{limit} selected. Search and select from the catalogue only.</p>
  </div>;
}
