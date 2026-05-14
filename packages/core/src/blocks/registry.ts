import type { BlockType, BlockDataMap, Section } from "../types/content";

function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const BLOCK_LABELS: Record<BlockType, string> = {
  Hero: "Hero",
  Features: "Features",
  Team: "Team",
  Testimonial: "Testimonial",
  Pricing: "Preise",
  CallToAction: "Call-to-Action",
  Footer: "Footer",
};

export const BLOCK_DESCRIPTIONS: Record<BlockType, string> = {
  Hero: "Grosser Auftritt: Eyebrow, Titel, Subtitle, zwei CTAs.",
  Features: "Drei-Spalten-Grid mit Icon, Titel, Beschreibung.",
  Team: "Drei Portraits mit Name, Rolle, Bio.",
  Testimonial: "Dunkler Block mit Zitat, Autor und Rolle.",
  Pricing: "Drei Preis-Pläne; der mittlere wird hervorgehoben.",
  CallToAction: "Blauer Banner mit Titel, Subtitle und zwei CTAs.",
  Footer: "Schmaler Abschluss mit Copyright und Tagline.",
};

export function createDefaultBlock<T extends BlockType>(type: T): Section<T> {
  const id = uuid();
  const data = DEFAULT_DATA[type] as BlockDataMap[T];
  return { id, type, data: structuredClone(data) };
}

const DEFAULT_DATA: { [K in BlockType]: BlockDataMap[K] } = {
  Hero: {
    eyebrow: "Neuer Hero",
    title: "Dein grosser Auftritt.",
    subtitle: "Schreib hier den Pitch. Klick rein und tipp los.",
    ctaPrimary: "Loslegen",
    ctaSecondary: "Mehr erfahren",
  },
  Features: {
    title: "Drei Vorteile auf einen Blick",
    subtitle: "<p>Kurzer Untertitel.</p>",
    items: [
      { icon: "Sparkles", title: "Vorteil 1", description: "Was macht dein Produkt besonders?" },
      { icon: "Zap", title: "Vorteil 2", description: "Wie schnell oder einfach ist es?" },
      { icon: "ShieldCheck", title: "Vorteil 3", description: "Warum können Kunden vertrauen?" },
    ],
  },
  Team: {
    title: "Unser Team",
    subtitle: "<p>Die Köpfe hinter dem Produkt.</p>",
    members: [
      {
        name: "Vorname Nachname",
        role: "Rolle",
        bio: "Kurze Bio in einem Satz.",
        image: "https://api.dicebear.com/9.x/personas/svg?seed=neu1&backgroundColor=b6e3f4",
      },
      {
        name: "Vorname Nachname",
        role: "Rolle",
        bio: "Kurze Bio in einem Satz.",
        image: "https://api.dicebear.com/9.x/personas/svg?seed=neu2&backgroundColor=c0aede",
      },
    ],
  },
  Testimonial: {
    quote: "Ein starker Satz von einem zufriedenen Kunden.",
    author: "Vorname Nachname",
    role: "Rolle, Firma",
  },
  Pricing: {
    title: "Preise",
    subtitle: "<p>Drei Pläne. Wähle den, der zu dir passt.</p>",
    plans: [
      {
        icon: "Gem",
        name: "Basic",
        price: "Gratis",
        priceCaption: "Perfekt zum Starten",
        features: [
          "1 Projekt",
          "1 GB Speicher",
          "Community-Support",
        ],
        cta: "Jetzt testen",
        featured: false,
      },
      {
        icon: "Rocket",
        name: "Standard",
        price: "CHF 19/Mt",
        priceCaption: "Für wachsende Teams",
        features: [
          "10 Projekte",
          "20 GB Speicher",
          "E-Mail-Support",
          "Eigene Domain",
        ],
        cta: "Jetzt starten",
        featured: true,
      },
      {
        icon: "Crown",
        name: "Pro",
        price: "CHF 49/Mt",
        priceCaption: "Für Profis & Agenturen",
        features: [
          "Unbegrenzte Projekte",
          "100 GB Speicher",
          "Priorisierter Support",
          "Eigene Domain",
          "Team-Zugänge",
        ],
        cta: "Pro werden",
        featured: false,
      },
    ],
  },
  CallToAction: {
    title: "Bereit loszulegen?",
    subtitle: "Kurzer Anstoss, der den Klick auf den Button motiviert.",
    ctaPrimary: "Jetzt starten",
    ctaSecondary: "Demo ansehen",
  },
  Footer: {
    copyright: "© 2026 Deine Marke",
    tagline: "Made with love.",
  },
};
