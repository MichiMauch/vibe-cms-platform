export const DEFAULT_LOCALE = "de";
export const LOCALE_REGEX = /^[a-z]{2}(-[A-Z]{2})?$/;

export function localeName(code: string, displayIn: string = "de"): string {
  try {
    const display = new Intl.DisplayNames([displayIn], { type: "language" });
    return display.of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

const FLAG_MAP: Record<string, string> = {
  de: "🇩🇪",
  en: "🇬🇧",
  fr: "🇫🇷",
  it: "🇮🇹",
  es: "🇪🇸",
  pt: "🇵🇹",
  nl: "🇳🇱",
  pl: "🇵🇱",
  sv: "🇸🇪",
  da: "🇩🇰",
  no: "🇳🇴",
  fi: "🇫🇮",
  cs: "🇨🇿",
  ja: "🇯🇵",
  zh: "🇨🇳",
  ko: "🇰🇷",
  ru: "🇷🇺",
  tr: "🇹🇷",
  ar: "🇸🇦",
  he: "🇮🇱",
};

export function localeFlag(code: string): string {
  const region = code.split("-")[1];
  if (region) {
    const codePoints = [...region.toUpperCase()].map((c) => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
  return FLAG_MAP[code] ?? "🌐";
}
