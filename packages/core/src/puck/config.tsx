import type { Config, Data } from "@puckeditor/core";
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

/** Page-level SEO/chatbot props live on Puck's root.props. */
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
        seo: {
          type: "object",
          label: "SEO",
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
          label: "Chatbot",
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
      defaultProps: {
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
      },
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
        },
        defaultProps: {
          eyebrow: "",
          title: "Dein grosser Auftritt",
          subtitle: "<p>Schreib hier den Pitch.</p>",
          ctaLabel: "Loslegen",
          ctaHref: "#",
        },
        render: HeroRender,
      },
      RichBlock: {
        label: "Rich-Text-Block",
        fields: {
          content: { type: "custom", label: "Inhalt", render: renderRichText },
        },
        defaultProps: {
          content: "<p>Hier kommt dein Inhalt hin. <strong>Fett</strong>, <em>kursiv</em>, Links — alles geht.</p>",
        },
        render: RichBlockRender,
      },
      FeaturesGrid: {
        label: "Features-Grid",
        fields: {
          title: { type: "custom", label: "Titel", render: renderTextAI },
          subtitle: { type: "custom", label: "Subtitle", render: renderRichText },
          items: {
            type: "array",
            label: "Features",
            arrayFields: {
              icon: { type: "select", label: "Icon", options: ICON_OPTIONS },
              title: { type: "custom", label: "Titel", render: renderTextAI },
              description: { type: "custom", label: "Beschreibung", render: renderRichText },
            },
            defaultItemProps: {
              icon: "Sparkles",
              title: "Vorteil",
              description: "<p>Was macht dein Produkt besonders?</p>",
            },
            getItemSummary: (item) => (item as { title?: string }).title ?? "Feature",
          },
        },
        defaultProps: {
          title: "Drei Vorteile auf einen Blick",
          subtitle: "<p>Kurzer Untertitel.</p>",
          items: [
            { icon: "Sparkles", title: "Vorteil 1", description: "<p>Was macht dein Produkt besonders?</p>" },
            { icon: "Zap", title: "Vorteil 2", description: "<p>Wie schnell oder einfach ist es?</p>" },
            { icon: "ShieldCheck", title: "Vorteil 3", description: "<p>Warum können Kunden vertrauen?</p>" },
          ],
        },
        render: FeaturesGridRender,
      },
      Stats: {
        label: "Stats",
        fields: {
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
        defaultProps: {
          intro: "Zahlen, die für sich sprechen",
          items: [
            { value: "+200%", label: "Conversion-Rate" },
            { value: "12 Mio", label: "Aktive Nutzer" },
            { value: "99.9%", label: "Uptime" },
            { value: "24/7", label: "Support" },
          ],
        },
        render: StatsRender,
      },
      Testimonial: {
        label: "Testimonial",
        fields: {
          quote: { type: "custom", label: "Zitat", render: renderRichText },
          author: { type: "custom", label: "Autor", render: renderTextAI },
          role: { type: "custom", label: "Rolle", render: renderTextAI },
          avatar: { type: "custom", label: "Avatar (optional)", render: renderImage },
        },
        defaultProps: {
          quote: "<p>Ein starker Satz von einem zufriedenen Kunden.</p>",
          author: "Vorname Nachname",
          role: "Rolle, Firma",
          avatar: "",
        },
        render: TestimonialRender,
      },
      ImageText: {
        label: "Bild + Text",
        fields: {
          title: { type: "custom", label: "Titel", render: renderTextAI },
          content: { type: "custom", label: "Inhalt", render: renderRichText },
          image: { type: "custom", label: "Bild", render: renderImage },
          imageAlt: { type: "text", label: "Alt-Text" },
          imagePosition: {
            type: "radio",
            label: "Bild-Position",
            options: [
              { label: "Links", value: "left" },
              { label: "Rechts", value: "right" },
            ],
          },
        },
        defaultProps: {
          title: "Erzähl deine Story",
          content: "<p>Hier kommt die längere Erklärung. <strong>Fett</strong> und <em>kursiv</em> erlaubt.</p>",
          image: "",
          imageAlt: "",
          imagePosition: "right",
        },
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
        defaultProps: {
          title: "Bereit loszulegen?",
          subtitle: "<p>Kurzer Anstoss, der den Klick auf den Button motiviert.</p>",
          ctaPrimaryLabel: "Jetzt starten",
          ctaPrimaryHref: "#",
          ctaSecondaryLabel: "Demo ansehen",
          ctaSecondaryHref: "#",
          theme: "blue",
        },
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
        defaultProps: {
          intro: "Vertraut von führenden Unternehmen",
          items: [
            { name: "Acme", image: "", link: "" },
            { name: "Globex", image: "", link: "" },
            { name: "Initech", image: "", link: "" },
            { name: "Umbrella", image: "", link: "" },
          ],
        },
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
        defaultProps: {
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
        },
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
        defaultProps: {
          title: "Unser Team",
          subtitle: "<p>Die Köpfe hinter dem Produkt.</p>",
          members: [],
        },
        render: TeamRender,
      },
      Pricing: {
        label: "Preise",
        fields: {
          title: { type: "custom", label: "Titel", render: renderTextAI },
          subtitle: { type: "custom", label: "Subtitle", render: renderRichText },
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
            },
            getItemSummary: (item) => (item as { name?: string }).name ?? "Plan",
          },
        },
        defaultProps: {
          title: "Preise",
          subtitle: "<p>Drei Pläne. Wähle den, der zu dir passt.</p>",
          plans: [],
        },
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
        defaultProps: {
          copyright: "© 2026 Deine Marke",
          tagline: "Made with love.",
          columns: [],
        },
        render: FooterRender,
      },
    },
  };
}

/** Strongly-typed Puck Data for our config. */
export type PuckData = Data<Components, RootProps>;
