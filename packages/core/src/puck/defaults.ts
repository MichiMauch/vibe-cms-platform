/**
 * Default field values for every block + the root.
 *
 * Lives separately from `config.tsx` so server-side callers (in particular
 * the AI scaffolder in `apps/studio`) can read the defaults without pulling
 * in React or the Puck render tree. `config.tsx` imports these and feeds
 * them back into the Puck component config — single source of truth.
 *
 * Shape note: these match the `defaultProps` shape Puck expects per block,
 * but without the `id` field (Puck assigns ids automatically when blocks
 * are instantiated; the scaffolder generates them when emitting the tree).
 */
import { DEFAULT_PRESET_ID } from "../theme";

export const ROOT_DEFAULTS = {
  seo: {
    title: "",
    description: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    keywords: "",
  },
  chatbot: {
    isEnabled: false,
    botName: "Assistent",
    welcomeMessage: "Hallo!",
  },
  theme: {
    preset: DEFAULT_PRESET_ID,
    accentOverride: "",
    inkOverride: "",
  },
} as const;

export const HERO_DEFAULTS = {
  eyebrow: "",
  title: "Dein grosser Auftritt",
  subtitle: "<p>Schreib hier den Pitch.</p>",
  ctaLabel: "Loslegen",
  ctaHref: "#",
  layout: { layout: "centered" as const, density: "default" as const },
  imageGroup: { image: "", imageAlt: "", imageStyle: "card" as const },
  background: { bgStyle: "gradient" as const, bgImage: "" },
  style: { eyebrowStyle: "pill" as const, accentBar: false, gradientTitle: false },
  secondaryCta: { ctaSecondaryLabel: "", ctaSecondaryHref: "" },
  trustAndMode: {
    trustLine: "",
    mode: "cta" as const,
    emailPlaceholder: "deine@adresse.ch",
    emailSubmitLabel: "Eintragen",
    emailEndpoint: "",
  },
  extras: { scrollIndicator: false },
};

export const RICH_BLOCK_DEFAULTS = {
  content:
    "<p>Hier kommt dein Inhalt hin. <strong>Fett</strong>, <em>kursiv</em>, Links — alles geht.</p>",
};

export const FEATURES_GRID_DEFAULTS = {
  layout: "grid-3" as const,
  title: "Drei Vorteile auf einen Blick",
  subtitle: "<p>Kurzer Untertitel.</p>",
  items: [
    { icon: "Sparkles", title: "Vorteil 1", description: "<p>Was macht dein Produkt besonders?</p>", emphasis: "normal" as const },
    { icon: "Zap", title: "Vorteil 2", description: "<p>Wie schnell oder einfach ist es?</p>", emphasis: "normal" as const },
    { icon: "ShieldCheck", title: "Vorteil 3", description: "<p>Warum können Kunden vertrauen?</p>", emphasis: "normal" as const },
  ],
};

export const STATS_DEFAULTS = {
  layout: "grid" as const,
  intro: "Zahlen, die für sich sprechen",
  items: [
    { value: "+200%", label: "Conversion-Rate" },
    { value: "12 Mio", label: "Aktive Nutzer" },
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Support" },
  ],
};

export const TESTIMONIAL_DEFAULTS = {
  layout: "centered" as const,
  quote: "<p>Ein starker Satz von einem zufriedenen Kunden.</p>",
  author: "Vorname Nachname",
  role: "Rolle, Firma",
  avatar: "",
  items: [] as Array<{ quote: string; author: string; role: string; avatar: string }>,
};

export const IMAGE_TEXT_DEFAULTS = {
  layout: "image-right" as const,
  title: "Erzähl deine Story",
  content:
    "<p>Hier kommt die längere Erklärung. <strong>Fett</strong> und <em>kursiv</em> erlaubt.</p>",
  image: "",
  imageAlt: "",
  imagePosition: "right" as const,
};

export const CTA_BANNER_DEFAULTS = {
  title: "Bereit loszulegen?",
  subtitle: "<p>Kurzer Anstoss, der den Klick auf den Button motiviert.</p>",
  ctaPrimaryLabel: "Jetzt starten",
  ctaPrimaryHref: "#",
  ctaSecondaryLabel: "Demo ansehen",
  ctaSecondaryHref: "#",
  theme: "blue" as const,
};

export const LOGO_CLOUD_DEFAULTS = {
  intro: "Vertraut von führenden Unternehmen",
  items: [
    { name: "Acme", image: "", link: "" },
    { name: "Globex", image: "", link: "" },
    { name: "Initech", image: "", link: "" },
    { name: "Umbrella", image: "", link: "" },
  ],
};

export const FAQ_DEFAULTS = {
  title: "Häufige Fragen",
  subtitle: "<p>Alles, was du wissen musst.</p>",
  items: [
    {
      question: "Wie funktioniert das?",
      answer: "<p>Klick rein, erstelle eine Seite, publiziere — fertig.</p>",
    },
    {
      question: "Was kostet das?",
      answer: "<p>Kontaktier uns für ein Angebot.</p>",
    },
  ],
};

export const TEAM_DEFAULTS = {
  title: "Unser Team",
  subtitle: "<p>Die Köpfe hinter dem Produkt.</p>",
  members: [] as Array<{ name: string; role: string; bio: string; image: string }>,
};

export const PRICING_DEFAULTS = {
  layout: "cards-3" as const,
  title: "Preise",
  subtitle: "<p>Drei Pläne. Wähle den, der zu dir passt.</p>",
  rowLabels: [] as Array<{ value: string }>,
  toggle: {
    monthlyLabel: "Monatlich",
    yearlyLabel: "Jährlich",
    yearlyDiscountHint: "",
  },
  plans: [] as Array<{
    icon: string;
    name: string;
    price: string;
    priceCaption: string;
    ctaLabel: string;
    ctaHref: string;
    featured: boolean;
    features: { value: string }[];
    priceMonthly?: string;
    priceYearly?: string;
    rowValues?: { value: string }[];
  }>,
};

export const FOOTER_DEFAULTS = {
  copyright: "© 2026 Deine Marke",
  tagline: "Made with love.",
  columns: [] as Array<{ heading: string; links: { label: string; href: string }[] }>,
};

/** Lookup map for block-type → defaultProps. Used by the AI scaffolder to
 * back-fill any field the model omitted. */
export const BLOCK_DEFAULTS: Record<string, Record<string, unknown>> = {
  Hero: HERO_DEFAULTS,
  RichBlock: RICH_BLOCK_DEFAULTS,
  FeaturesGrid: FEATURES_GRID_DEFAULTS,
  Stats: STATS_DEFAULTS,
  Testimonial: TESTIMONIAL_DEFAULTS,
  ImageText: IMAGE_TEXT_DEFAULTS,
  CtaBanner: CTA_BANNER_DEFAULTS,
  LogoCloud: LOGO_CLOUD_DEFAULTS,
  Faq: FAQ_DEFAULTS,
  Team: TEAM_DEFAULTS,
  Pricing: PRICING_DEFAULTS,
  Footer: FOOTER_DEFAULTS,
};

export type BlockType = keyof typeof BLOCK_DEFAULTS;
export const BLOCK_TYPES = Object.keys(BLOCK_DEFAULTS) as BlockType[];
