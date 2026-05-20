import type { Config, Data } from "@puckeditor/core";
import { THEME_PRESETS, type ThemePresetId } from "../theme";
import {
  ROOT_DEFAULTS,
  HERO_DEFAULTS,
  RICH_BLOCK_DEFAULTS,
  FEATURES_GRID_DEFAULTS,
  STATS_DEFAULTS,
  TESTIMONIAL_DEFAULTS,
  IMAGE_TEXT_DEFAULTS,
  CTA_BANNER_DEFAULTS,
  LOGO_CLOUD_DEFAULTS,
  FAQ_DEFAULTS,
  TEAM_DEFAULTS,
  PRICING_DEFAULTS,
  FOOTER_DEFAULTS,
} from "./defaults";
import {
  HeroRender,
  type HeroProps,
  RichBlockRender,
  type RichBlockProps,
  FeaturesGridRender,
  type FeaturesGridProps,
  StatsRender,
  type StatsProps,
  TestimonialRender,
  type TestimonialProps,
  ImageTextRender,
  type ImageTextProps,
  CtaBannerRender,
  type CtaBannerProps,
  LogoCloudRender,
  type LogoCloudProps,
  FaqRender,
  type FaqProps,
  TeamRender,
  type TeamProps,
  PricingRender,
  type PricingProps,
  FooterRender,
  type FooterProps,
} from "./blocks";
import { RichTextField } from "./fields/RichTextField";
import { ImageField } from "./fields/ImageField";
import { TextWithAIField } from "./fields/TextWithAIField";

/** Page-level SEO/chatbot/theme props live on Puck's root.props. The theme
 * here is the *edit-time* copy; the renderer reads from `site.config.theme`,
 * which the publish endpoint mirrors from `root.props.theme` on each save. */
export type RootProps = {
  seo: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    keywords: string;
  };
  chatbot: {
    isEnabled: boolean;
    botName: string;
    welcomeMessage: string;
  };
  theme: {
    preset: ThemePresetId;
    accentOverride: string;
    inkOverride: string;
  };
};

type Components = {
  Hero: HeroProps;
  RichBlock: RichBlockProps;
  FeaturesGrid: FeaturesGridProps;
  Stats: StatsProps;
  Testimonial: TestimonialProps;
  ImageText: ImageTextProps;
  CtaBanner: CtaBannerProps;
  LogoCloud: LogoCloudProps;
  Faq: FaqProps;
  Team: TeamProps;
  Pricing: PricingProps;
  Footer: FooterProps;
};

const ICON_OPTIONS = [
  { label: "Sparkles", value: "Sparkles" },
  { label: "Zap", value: "Zap" },
  { label: "ShieldCheck", value: "ShieldCheck" },
  { label: "Rocket", value: "Rocket" },
  { label: "Pencil", value: "Pencil" },
  { label: "Layers", value: "Layers" },
  { label: "FileJson", value: "FileJson" },
  { label: "Heart", value: "Heart" },
  { label: "Star", value: "Star" },
];

const PLAN_ICON_OPTIONS = [
  { label: "Gem", value: "Gem" },
  { label: "Rocket", value: "Rocket" },
  { label: "Crown", value: "Crown" },
  { label: "Sparkles", value: "Sparkles" },
  { label: "Star", value: "Star" },
  { label: "Zap", value: "Zap" },
];

/** Build the Puck config. `slug` is captured by the AI-rewrite field so the
 * /api/ai-rewrite endpoint sees the tenant. */
export function buildPuckConfig(slug: string): Config<Components, RootProps> {
  const renderTextAI = (args: {
    value: string;
    onChange: (v: string) => void;
    name: string;
  }) => (
    <TextWithAIField
      value={args.value ?? ""}
      onChange={args.onChange}
      name={args.name}
      slug={slug}
    />
  );

  const renderRichText = (args: { value: string; onChange: (v: string) => void }) => (
    <RichTextField value={args.value ?? ""} onChange={args.onChange} />
  );

  const renderImage = (args: { value: string; onChange: (v: string) => void }) => (
    <ImageField value={args.value ?? ""} onChange={args.onChange} />
  );

  return {
    root: {
      fields: {
        // Order matters — Puck renders fields top-to-bottom. Design first
        // because it has the biggest visual impact and is what customers
        // tend to look for after they've drafted content.
        theme: {
          type: "object",
          label: "🎨 Design (Theme)",
          objectFields: {
            preset: {
              type: "radio",
              label: "Preset",
              options: THEME_PRESETS.map((p) => ({ label: p.name, value: p.id })),
            },
            accentOverride: {
              type: "text",
              label: "Akzentfarbe (Hex, optional, z.B. #ff3366)",
            },
            inkOverride: {
              type: "text",
              label: "Text-Hauptfarbe (Hex, optional)",
            },
          },
        },
        seo: {
          type: "object",
          label: "🔍 SEO",
          objectFields: {
            title: { type: "text", label: "Title" },
            description: { type: "textarea", label: "Description" },
            ogTitle: { type: "text", label: "OG Title" },
            ogDescription: { type: "textarea", label: "OG Description" },
            ogImage: { type: "text", label: "OG Image URL" },
            keywords: { type: "text", label: "Keywords (comma separated)" },
          },
        },
        chatbot: {
          type: "object",
          label: "💬 Chatbot",
          objectFields: {
            isEnabled: {
              type: "radio",
              label: "Aktiviert",
              options: [
                { label: "An", value: true },
                { label: "Aus", value: false },
              ],
            },
            botName: { type: "text", label: "Bot-Name" },
            welcomeMessage: { type: "textarea", label: "Begrüssung" },
          },
        },
      },
      defaultProps: ROOT_DEFAULTS,
    },
    components: {
      Hero: {
        label: "Hero",
        fields: {
          eyebrow: { type: "custom", label: "Eyebrow", render: renderTextAI },
          title: { type: "custom", label: "Titel", render: renderTextAI },
          subtitle: { type: "custom", label: "Subtitle", render: renderRichText },
          ctaLabel: { type: "text", label: "CTA-Label" },
          ctaHref: { type: "text", label: "CTA-Link" },
          layout: {
            type: "object",
            label: "Layout",
            objectFields: {
              layout: {
                type: "radio",
                label: "Anordnung",
                options: [
                  { label: "Auto (Vibe entscheidet)", value: "auto" },
                  { label: "Zentriert", value: "centered" },
                  { label: "Linksbündig", value: "left" },
                  { label: "Split (Bild rechts)", value: "split-right" },
                  { label: "Split (Bild links)", value: "split-left" },
                  { label: "Oversized (nur Typografie)", value: "oversized" },
                ],
              },
              density: {
                type: "radio",
                label: "Vertikale Dichte",
                options: [
                  { label: "Kompakt", value: "compact" },
                  { label: "Standard", value: "default" },
                  { label: "Luftig", value: "spacious" },
                ],
              },
            },
          },
          imageGroup: {
            type: "object",
            label: "Bild",
            objectFields: {
              image: { type: "custom", label: "Bild", render: renderImage },
              imageAlt: { type: "text", label: "Alt-Text" },
              imageStyle: {
                type: "radio",
                label: "Bild-Stil",
                options: [
                  { label: "Karte mit Schatten", value: "card" },
                  { label: "Randlos", value: "bleed" },
                  { label: "Leicht gekippt", value: "tilt" },
                  { label: "Browser-Frame", value: "browser-frame" },
                ],
              },
            },
          },
          background: {
            type: "object",
            label: "Hintergrund",
            objectFields: {
              bgStyle: {
                type: "radio",
                label: "Stil",
                options: [
                  { label: "Gradient", value: "gradient" },
                  { label: "Ruhige Fläche", value: "surface" },
                  { label: "Akzentfarbe", value: "accent" },
                  { label: "Eigenes Bild", value: "image" },
                ],
              },
              bgImage: { type: "custom", label: "Hintergrundbild (bei Stil=Bild)", render: renderImage },
            },
          },
          style: {
            type: "object",
            label: "Style",
            objectFields: {
              eyebrowStyle: {
                type: "radio",
                label: "Eyebrow-Stil",
                options: [
                  { label: "Pill (Border)", value: "pill" },
                  { label: "Badge (gefüllt)", value: "badge" },
                  { label: "Nur Caps-Text", value: "caps" },
                  { label: "Ausblenden", value: "none" },
                ],
              },
              accentBar: {
                type: "radio",
                label: "Akzent-Bar vor Titel",
                options: [
                  { label: "Ja", value: true },
                  { label: "Nein", value: false },
                ],
              },
              gradientTitle: {
                type: "radio",
                label: "Gradient-Text auf Titel",
                options: [
                  { label: "Ja", value: true },
                  { label: "Nein", value: false },
                ],
              },
            },
          },
          secondaryCta: {
            type: "object",
            label: "Sekundärer CTA",
            objectFields: {
              ctaSecondaryLabel: { type: "text", label: "Label (leer = aus)" },
              ctaSecondaryHref: { type: "text", label: "Link" },
            },
          },
          trustAndMode: {
            type: "object",
            label: "Trust-Line & Modus",
            objectFields: {
              trustLine: { type: "text", label: "Trust-Line unter CTA" },
              mode: {
                type: "radio",
                label: "Modus",
                options: [
                  { label: "CTA-Buttons", value: "cta" },
                  { label: "Email-Capture", value: "email-capture" },
                ],
              },
              emailPlaceholder: { type: "text", label: "Email-Placeholder" },
              emailSubmitLabel: { type: "text", label: "Email-Submit-Label" },
              emailEndpoint: { type: "text", label: "Email-Endpoint URL (leer = Demo)" },
            },
          },
          extras: {
            type: "object",
            label: "Extras",
            objectFields: {
              scrollIndicator: {
                type: "radio",
                label: "Scroll-Indicator",
                options: [
                  { label: "Ja", value: true },
                  { label: "Nein", value: false },
                ],
              },
            },
          },
        },
        defaultProps: HERO_DEFAULTS,
        render: HeroRender,
      },
      RichBlock: {
        label: "Rich-Text-Block",
        fields: {
          content: { type: "custom", label: "Inhalt", render: renderRichText },
        },
        defaultProps: RICH_BLOCK_DEFAULTS,
        render: RichBlockRender,
      },
      FeaturesGrid: {
        label: "Features-Grid",
        fields: {
          layout: {
            type: "radio",
            label: "Layout",
            options: [
              { label: "Auto (Vibe entscheidet)", value: "auto" },
              { label: "3 Spalten (Standard)", value: "grid-3" },
              { label: "4 Spalten", value: "grid-4" },
              { label: "Liste mit Icon links", value: "list-icon-left" },
              { label: "Bento (Mix-Größen)", value: "bento" },
            ],
          },
          title: { type: "custom", label: "Titel", render: renderTextAI },
          subtitle: { type: "custom", label: "Subtitle", render: renderRichText },
          items: {
            type: "array",
            label: "Features",
            arrayFields: {
              icon: { type: "select", label: "Icon", options: ICON_OPTIONS },
              title: { type: "custom", label: "Titel", render: renderTextAI },
              description: { type: "custom", label: "Beschreibung", render: renderRichText },
              emphasis: {
                type: "radio",
                label: "Größe (nur Bento)",
                options: [
                  { label: "Normal", value: "normal" },
                  { label: "Groß", value: "large" },
                ],
              },
            },
            defaultItemProps: {
              icon: "Sparkles",
              title: "Vorteil",
              description: "<p>Was macht dein Produkt besonders?</p>",
              emphasis: "normal",
            },
            getItemSummary: (item) => (item as { title?: string }).title ?? "Feature",
          },
        },
        defaultProps: FEATURES_GRID_DEFAULTS,
        render: FeaturesGridRender,
      },
      Stats: {
        label: "Stats",
        fields: {
          layout: {
            type: "radio",
            label: "Layout",
            options: [
              { label: "Auto (Vibe entscheidet)", value: "auto" },
              { label: "Grid (Standard)", value: "grid" },
              { label: "Inline-Reihe", value: "row" },
              { label: "Oversized", value: "oversized" },
            ],
          },
          intro: { type: "text", label: "Intro (optional)" },
          items: {
            type: "array",
            label: "Zahlen",
            arrayFields: {
              value: { type: "text", label: "Wert (z.B. +200%)" },
              label: { type: "text", label: "Label" },
            },
            defaultItemProps: { value: "100%", label: "Neue Kennzahl" },
            getItemSummary: (item) => (item as { value?: string }).value ?? "Stat",
          },
        },
        defaultProps: STATS_DEFAULTS,
        render: StatsRender,
      },
      Testimonial: {
        label: "Testimonial",
        fields: {
          layout: {
            type: "radio",
            label: "Layout",
            options: [
              { label: "Auto (Vibe entscheidet)", value: "auto" },
              { label: "Zentriert (Standard)", value: "centered" },
              { label: "3-Spalten-Grid", value: "grid-3" },
              { label: "Karussell", value: "carousel" },
            ],
          },
          quote: { type: "custom", label: "Zitat", render: renderRichText },
          author: { type: "custom", label: "Autor", render: renderTextAI },
          role: { type: "custom", label: "Rolle", render: renderTextAI },
          avatar: { type: "custom", label: "Avatar (optional)", render: renderImage },
          items: {
            type: "array",
            label: "Weitere Stimmen (nur Grid/Karussell)",
            arrayFields: {
              quote: { type: "custom", label: "Zitat", render: renderRichText },
              author: { type: "custom", label: "Autor", render: renderTextAI },
              role: { type: "custom", label: "Rolle", render: renderTextAI },
              avatar: { type: "custom", label: "Avatar (optional)", render: renderImage },
            },
            defaultItemProps: {
              quote: "<p>Eine zweite Stimme.</p>",
              author: "Person",
              role: "Rolle",
              avatar: "",
            },
            getItemSummary: (item) => (item as { author?: string }).author ?? "Stimme",
          },
        },
        defaultProps: TESTIMONIAL_DEFAULTS,
        render: TestimonialRender,
      },
      ImageText: {
        label: "Bild + Text",
        fields: {
          layout: {
            type: "radio",
            label: "Layout",
            options: [
              { label: "Auto (Vibe entscheidet)", value: "auto" },
              { label: "Bild links", value: "image-left" },
              { label: "Bild rechts (Standard)", value: "image-right" },
              { label: "Gestapelt", value: "stacked" },
              { label: "Karte über Bild", value: "card-overlay" },
            ],
          },
          title: { type: "custom", label: "Titel", render: renderTextAI },
          content: { type: "custom", label: "Inhalt", render: renderRichText },
          image: { type: "custom", label: "Bild", render: renderImage },
          imageAlt: { type: "text", label: "Alt-Text" },
          imagePosition: {
            type: "radio",
            label: "Bild-Position (deprecated, wird durch Layout ersetzt)",
            options: [
              { label: "Links", value: "left" },
              { label: "Rechts", value: "right" },
            ],
          },
        },
        defaultProps: IMAGE_TEXT_DEFAULTS,
        render: ImageTextRender,
      },
      CtaBanner: {
        label: "CTA-Banner",
        fields: {
          title: { type: "custom", label: "Titel", render: renderTextAI },
          subtitle: { type: "custom", label: "Subtitle", render: renderRichText },
          ctaPrimaryLabel: { type: "text", label: "Primärer CTA-Label" },
          ctaPrimaryHref: { type: "text", label: "Primärer CTA-Link" },
          ctaSecondaryLabel: { type: "text", label: "Sekundärer CTA-Label" },
          ctaSecondaryHref: { type: "text", label: "Sekundärer CTA-Link" },
          theme: {
            type: "radio",
            label: "Farbschema",
            options: [
              { label: "Blau", value: "blue" },
              { label: "Dunkel", value: "dark" },
              { label: "Gradient", value: "gradient" },
            ],
          },
        },
        defaultProps: CTA_BANNER_DEFAULTS,
        render: CtaBannerRender,
      },
      LogoCloud: {
        label: "Logo-Cloud",
        fields: {
          intro: { type: "text", label: "Intro" },
          items: {
            type: "array",
            label: "Logos",
            arrayFields: {
              name: { type: "text", label: "Name" },
              image: { type: "custom", label: "Logo", render: renderImage },
              link: { type: "text", label: "Link (optional)" },
            },
            defaultItemProps: { name: "Brand", image: "", link: "" },
            getItemSummary: (item) => (item as { name?: string }).name ?? "Logo",
          },
        },
        defaultProps: LOGO_CLOUD_DEFAULTS,
        render: LogoCloudRender,
      },
      Faq: {
        label: "FAQ",
        fields: {
          title: { type: "custom", label: "Titel", render: renderTextAI },
          subtitle: { type: "custom", label: "Subtitle", render: renderRichText },
          items: {
            type: "array",
            label: "Fragen",
            arrayFields: {
              question: { type: "custom", label: "Frage", render: renderTextAI },
              answer: { type: "custom", label: "Antwort", render: renderRichText },
            },
            defaultItemProps: {
              question: "Neue Frage?",
              answer: "<p>Hier kommt die Antwort.</p>",
            },
            getItemSummary: (item) => (item as { question?: string }).question ?? "Frage",
          },
        },
        defaultProps: FAQ_DEFAULTS,
        render: FaqRender,
      },
      Team: {
        label: "Team",
        fields: {
          title: { type: "custom", label: "Titel", render: renderTextAI },
          subtitle: { type: "custom", label: "Subtitle", render: renderRichText },
          members: {
            type: "array",
            label: "Mitglieder",
            arrayFields: {
              name: { type: "custom", label: "Name", render: renderTextAI },
              role: { type: "custom", label: "Rolle", render: renderTextAI },
              bio: { type: "custom", label: "Bio", render: renderRichText },
              image: { type: "custom", label: "Bild", render: renderImage },
            },
            defaultItemProps: {
              name: "Vorname Nachname",
              role: "Rolle",
              bio: "<p>Kurze Bio.</p>",
              image: "",
            },
            getItemSummary: (item) => (item as { name?: string }).name ?? "Mitglied",
          },
        },
        defaultProps: TEAM_DEFAULTS,
        render: TeamRender,
      },
      Pricing: {
        label: "Preise",
        fields: {
          layout: {
            type: "radio",
            label: "Layout",
            options: [
              { label: "Auto (Vibe entscheidet)", value: "auto" },
              { label: "3 Karten (Standard)", value: "cards-3" },
              { label: "Vergleichstabelle", value: "comparison-table" },
              { label: "Einzelkarte (Monatlich/Jährlich)", value: "single-toggle" },
            ],
          },
          title: { type: "custom", label: "Titel", render: renderTextAI },
          subtitle: { type: "custom", label: "Subtitle", render: renderRichText },
          rowLabels: {
            type: "array",
            label: "Zeilen-Labels (nur Vergleichstabelle)",
            arrayFields: { value: { type: "text", label: "Zeile" } },
            defaultItemProps: { value: "Neue Zeile" },
            getItemSummary: (item) => (item as { value?: string }).value ?? "Zeile",
          },
          toggle: {
            type: "object",
            label: "Monat/Jahr-Toggle (nur Einzelkarte)",
            objectFields: {
              monthlyLabel: { type: "text", label: "Label monatlich" },
              yearlyLabel: { type: "text", label: "Label jährlich" },
              yearlyDiscountHint: { type: "text", label: "Rabatt-Hinweis (z.B. „2 Monate gratis“)" },
            },
          },
          plans: {
            type: "array",
            label: "Pläne",
            arrayFields: {
              icon: { type: "select", label: "Icon", options: PLAN_ICON_OPTIONS },
              name: { type: "custom", label: "Name", render: renderTextAI },
              price: { type: "text", label: "Preis" },
              priceCaption: { type: "text", label: "Preis-Untertitel" },
              ctaLabel: { type: "custom", label: "CTA-Label", render: renderTextAI },
              ctaHref: { type: "text", label: "CTA-Link" },
              featured: {
                type: "radio",
                label: "Hervorgehoben",
                options: [
                  { label: "Ja", value: true },
                  { label: "Nein", value: false },
                ],
              },
              features: {
                type: "array",
                label: "Features",
                arrayFields: { value: { type: "text", label: "Text" } },
                defaultItemProps: { value: "Neues Feature" },
                getItemSummary: (item) => (item as { value?: string }).value ?? "Feature",
              },
              priceMonthly: { type: "text", label: "Preis monatlich (nur Einzelkarte)" },
              priceYearly: { type: "text", label: "Preis jährlich (nur Einzelkarte)" },
              rowValues: {
                type: "array",
                label: "Zellen-Werte (nur Vergleichstabelle)",
                arrayFields: { value: { type: "text", label: "Wert („✓“, „true“ oder Text)" } },
                defaultItemProps: { value: "—" },
                getItemSummary: (item) => (item as { value?: string }).value ?? "Wert",
              },
            },
            defaultItemProps: {
              icon: "Sparkles",
              name: "Plan",
              price: "CHF 0",
              priceCaption: "",
              ctaLabel: "Wählen",
              ctaHref: "#",
              featured: false,
              features: [],
              priceMonthly: "",
              priceYearly: "",
              rowValues: [],
            },
            getItemSummary: (item) => (item as { name?: string }).name ?? "Plan",
          },
        },
        defaultProps: PRICING_DEFAULTS,
        render: PricingRender,
      },
      Footer: {
        label: "Footer",
        fields: {
          copyright: { type: "text", label: "Copyright" },
          tagline: { type: "text", label: "Tagline" },
          columns: {
            type: "array",
            label: "Link-Spalten (optional)",
            arrayFields: {
              heading: { type: "text", label: "Überschrift" },
              links: {
                type: "array",
                label: "Links",
                arrayFields: {
                  label: { type: "text", label: "Label" },
                  href: { type: "text", label: "URL" },
                },
                defaultItemProps: { label: "Link", href: "#" },
                getItemSummary: (item) => (item as { label?: string }).label ?? "Link",
              },
            },
            defaultItemProps: { heading: "Spalte", links: [] },
            getItemSummary: (item) => (item as { heading?: string }).heading ?? "Spalte",
          },
        },
        defaultProps: FOOTER_DEFAULTS,
        render: FooterRender,
      },
    },
  };
}

/** Strongly-typed Puck Data for our config. */
export type PuckData = Data<Components, RootProps>;
