"use client";

import { useLocale } from "../components/LocaleProvider";

const LABELS: Record<string, string> = {
  de: "Beliebteste",
  en: "Most popular",
  it: "Più popolare",
  fr: "Le plus populaire",
  es: "Más popular",
  pt: "Mais popular",
  nl: "Meest gekozen",
};

export function PopularLabel() {
  const locale = useLocale();
  const text = LABELS[locale] ?? LABELS[locale.split("-")[0]] ?? LABELS.en;
  return (
    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white shadow-md">
      {text}
    </span>
  );
}
