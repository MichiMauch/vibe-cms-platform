"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Globe, Settings2 } from "lucide-react";
import { localeName, localeFlag } from "../i18n/locales";

type Props = {
  locales: string[];
  current: string;
};

export function LanguageSwitcher({ locales, current }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }
  }, [open]);

  function pick(code: string) {
    if (code === current) {
      setOpen(false);
      return;
    }
    router.push(`/${code}`);
    router.refresh();
    setOpen(false);
  }

  return (
    <div ref={ref} className="fixed top-4 right-4 z-40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-700 shadow-sm backdrop-blur hover:border-slate-300 hover:bg-white transition"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="h-4 w-4 text-slate-500" />
        <span className="hidden sm:inline">{localeName(current, current)}</span>
        <span className="sm:hidden text-base leading-none">{localeFlag(current)}</span>
        <span className="text-xs uppercase font-medium text-slate-500 tabular-nums">{current}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5">
          <ul role="listbox" className="max-h-72 overflow-y-auto py-1">
            {locales.map((code) => (
              <li key={code}>
                <button
                  type="button"
                  onClick={() => pick(code)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 transition ${
                    code === current ? "bg-blue-50/60" : ""
                  }`}
                  role="option"
                  aria-selected={code === current}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-lg leading-none">{localeFlag(code)}</span>
                    <span className="text-slate-900">{localeName(code, current)}</span>
                    <span className="text-xs uppercase text-slate-400 tabular-nums">{code}</span>
                  </span>
                  {code === current && <Check className="h-4 w-4 text-blue-600" />}
                </button>
              </li>
            ))}
          </ul>
          <a
            href="/admin/languages"
            className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Sprachen verwalten
          </a>
        </div>
      )}
    </div>
  );
}
