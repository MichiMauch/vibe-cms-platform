"use client";

import { usePathname, useRouter } from "next/navigation";
import { localeFlag, localeName } from "../../i18n/locales";

export function SeoLocaleSwitcher({
  current,
  locales,
  basePath,
}: {
  current: string;
  locales: string[];
  basePath?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const target = basePath ?? pathname;
  return (
    <label className="inline-flex items-center gap-2 text-xs text-slate-500">
      <span>Sprache:</span>
      <select
        value={current}
        onChange={(e) => router.push(`${target}?locale=${e.target.value}`)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {localeFlag(code)} {localeName(code, current)} ({code})
          </option>
        ))}
      </select>
    </label>
  );
}
