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
            {
              icon: "Sparkles",
              title: "Vorteil 1",
              description: "<p>Was macht dein Produkt besonders?</p>",
            },
            {
              icon: "Zap",
              title: "Vorteil 2",
              description: "<p>Wie schnell oder einfach ist es?</p>",
            },
            {
              icon: "ShieldCheck",
              title: "Vorteil 3",
              description: "<p>Warum können Kunden vertrauen?</p>",
            },
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
            getItemSummary: (item) =>
              (item as { value?: string; label?: string }).value ?? "Stat",
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
    },
  };
}

/** Strongly-typed Puck Data for our config. */
export type PuckData = Data<Components, RootProps>;
