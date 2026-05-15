"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Blocks,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Heading1,
  Sparkles as SparklesIcon,
  Users,
  MessageSquareQuote,
  Megaphone,
  Footprints,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { useEditMode } from "../editors/EditModeProvider";
import { useSaveContent } from "../editors/EditScopeProvider";
import type { BlockType, Section } from "../types/content";
import { BLOCK_LABELS, BLOCK_DESCRIPTIONS, createDefaultBlock } from "../blocks/registry";

const TYPE_ICONS: Record<BlockType, LucideIcon> = {
  Hero: Heading1,
  Features: SparklesIcon,
  Team: Users,
  Testimonial: MessageSquareQuote,
  Pricing: Tag,
  CallToAction: Megaphone,
  Footer: Footprints,
};

type Props = { sections: Section[]; locale: string };

type Status = "idle" | "saving" | "saved" | "error";

export function BlockManager({ sections: initial, locale }: Props) {
  const { editMode } = useEditMode();
  const router = useRouter();
  const save = useSaveContent();
  const [open, setOpen] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [sections, setSections] = useState(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const addMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSections(initial);
  }, [initial]);

  useEffect(() => {
    if (status !== "saved") return;
    const t = setTimeout(() => setStatus("idle"), 1500);
    return () => clearTimeout(t);
  }, [status]);

  useEffect(() => {
    if (!showAdd) return;
    function onDoc(e: MouseEvent) {
      if (!addMenuRef.current?.contains(e.target as Node)) setShowAdd(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showAdd]);

  if (!editMode) return null;

  async function saveSections(next: Section[]) {
    setStatus("saving");
    setError(null);
    try {
      const res = await save({ path: "sections", value: next, locale });
      const json = await res.json();
      if (res.ok && json.ok) {
        setSections(next);
        setStatus("saved");
        router.refresh();
      } else {
        setStatus("error");
        setError(json.error ?? "Speichern fehlgeschlagen");
        setSections(initial);
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
      setSections(initial);
    }
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    saveSections(next);
  }

  function remove(index: number) {
    const block = sections[index];
    if (!window.confirm(`Block "${BLOCK_LABELS[block.type as BlockType] ?? block.type}" wirklich löschen?`)) return;
    const next = sections.filter((_, i) => i !== index);
    saveSections(next);
  }

  function add(type: BlockType) {
    setShowAdd(false);
    const block = createDefaultBlock(type) as Section;
    // Insert before Footer if present, else at the end.
    const footerIdx = sections.findIndex((s) => s.type === "Footer");
    const next = [...sections];
    if (footerIdx >= 0) next.splice(footerIdx, 0, block);
    else next.push(block);
    saveSections(next);
  }

  function scrollToBlock(id: string) {
    const el = document.getElementById(`block-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <aside className={`fixed left-0 top-0 z-40 h-screen ${open ? "w-80" : "w-10"} transition-all`}>
      <div className="h-full bg-white/90 backdrop-blur border-r border-slate-200 shadow-xl flex flex-col">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="absolute -right-4 top-20 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md hover:bg-slate-50 transition"
          aria-label={open ? "Sidebar schliessen" : "Sidebar öffnen"}
        >
          {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        {!open ? (
          <div className="flex h-full flex-col items-center pt-6">
            <Blocks className="h-5 w-5 text-slate-500" />
            <span className="mt-3 [writing-mode:vertical-rl] rotate-180 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Blöcke
            </span>
          </div>
        ) : (
          <>
            <header className="px-5 pt-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white">
                  <Blocks className="h-3.5 w-3.5" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Block-Manager</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Reihenfolge ändern, hinzufügen, löschen.
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                {status === "saving" && (
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Loader2 className="h-3 w-3 animate-spin" /> Speichert
                  </span>
                )}
                {status === "saved" && (
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> Gespeichert
                  </span>
                )}
                {status === "error" && (
                  <span className="inline-flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-3 w-3" /> {error ?? "Fehler"}
                  </span>
                )}
                {status === "idle" && (
                  <span className="text-slate-400">{sections.length} Blöcke</span>
                )}
              </div>
            </header>

            <ul className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
              {sections.map((section, i) => {
                const Icon = TYPE_ICONS[section.type as BlockType] ?? Blocks;
                const label = BLOCK_LABELS[section.type as BlockType] ?? section.type;
                return (
                  <li
                    key={section.id}
                    className="group rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition"
                  >
                    <div className="flex items-center gap-2 px-2.5 py-2">
                      <button
                        type="button"
                        onClick={() => scrollToBlock(section.id)}
                        className="flex flex-1 items-center gap-2 text-left min-w-0"
                      >
                        <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-slate-900 truncate">
                            {label}
                          </span>
                          <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                            #{i + 1}
                          </span>
                        </span>
                      </button>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => move(i, -1)}
                          disabled={i === 0 || status === "saving"}
                          className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                          aria-label="Nach oben"
                          title="Nach oben"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(i, 1)}
                          disabled={i === sections.length - 1 || status === "saving"}
                          className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                          aria-label="Nach unten"
                          title="Nach unten"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(i)}
                          disabled={status === "saving"}
                          className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                          aria-label="Löschen"
                          title="Löschen"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div ref={addMenuRef} className="relative border-t border-slate-100 p-3">
              <button
                type="button"
                onClick={() => setShowAdd((v) => !v)}
                disabled={status === "saving"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
              >
                <Plus className="h-4 w-4" />
                Block hinzufügen
              </button>
              {showAdd && (
                <div className="absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Block-Typ wählen
                    </p>
                  </div>
                  <ul className="max-h-72 overflow-y-auto py-1">
                    {(Object.keys(BLOCK_LABELS) as BlockType[]).map((type) => {
                      const Icon = TYPE_ICONS[type] ?? Blocks;
                      return (
                        <li key={type}>
                          <button
                            type="button"
                            onClick={() => add(type)}
                            className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition"
                          >
                            <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium text-slate-900">
                                {BLOCK_LABELS[type]}
                              </span>
                              <span className="block text-xs text-slate-500 truncate">
                                {BLOCK_DESCRIPTIONS[type]}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
