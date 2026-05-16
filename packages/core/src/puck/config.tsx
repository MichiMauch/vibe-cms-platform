import type { Config, Data } from "@puckeditor/core";
import {
  HeroRender,
  type HeroProps,
  FeaturesRender,
  type FeaturesProps,
  TeamRender,
  type TeamProps,
  TestimonialRender,
  type TestimonialProps,
  PricingRender,
  type PricingProps,
  CallToActionRender,
  type CallToActionProps,
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
  Features: FeaturesProps;
  Team: TeamProps;
  Testimonial: TestimonialProps;
  Pricing: PricingProps;
  CallToAction: CallToActionProps;
  Footer: FooterProps;
};

const FEATURE_ICON_OPTIONS = [
  { label: "Sparkles", value: "Sparkles" },
  { label: "Zap", value: "Zap" },
  { label: "ShieldCheck", value: "ShieldCheck" },
  { label: "Rocket", value: "Rocket" },
  { label: "Pencil", value: "Pencil" },
  { label: "Layers", value: "Layers" },
  { label: "FileJson", value: "FileJson" },
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
          ctaPrimary: { type: "text", label: "Primärer CTA" },
          ctaSecondary: { type: "text", label: "Sekundärer CTA" },
        },
        defaultProps: {
          eyebrow: "Neuer Hero",
          title: "Dein grosser Auftritt.",
          subtitle: "<p>Schreib hier den Pitch.</p>",
          ctaPrimary: "Loslegen",
          ctaSecondary: "Mehr erfahren",
        },
        render: HeroRender,
      },
      Features: {
        label: "Features",
        fields: {
          title: { type: "custom", label: "Titel", render: renderTextAI },
          subtitle: { type: "custom", label: "Subtitle", render: renderRichText },
          items: {
            type: "array",
            label: "Features",
            arrayFields: {
              icon: { type: "select", label: "Icon", options: FEATURE_ICON_OPTIONS },
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
        render: FeaturesRender,
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
              image: "https://api.dicebear.com/9.x/personas/svg?seed=neu",
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
      Testimonial: {
        label: "Testimonial",
        fields: {
          quote: { type: "custom", label: "Zitat", render: renderRichText },
          author: { type: "custom", label: "Autor", render: renderTextAI },
          role: { type: "custom", label: "Rolle", render: renderTextAI },
        },
        defaultProps: {
          quote: "<p>Ein starker Satz von einem zufriedenen Kunden.</p>",
          author: "Vorname Nachname",
          role: "Rolle, Firma",
        },
        render: TestimonialRender,
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
              cta: { type: "custom", label: "CTA-Label", render: renderTextAI },
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
                arrayFields: {
                  value: { type: "text", label: "Text" },
                },
                defaultItemProps: { value: "Neues Feature" },
                getItemSummary: (item) =>
                  (item as { value?: string }).value ?? "Feature",
              },
            },
            defaultItemProps: {
              icon: "Sparkles",
              name: "Plan",
              price: "CHF 0",
              priceCaption: "",
              cta: "Wählen",
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
      CallToAction: {
        label: "Call to Action",
        fields: {
          title: { type: "custom", label: "Titel", render: renderTextAI },
          subtitle: { type: "custom", label: "Subtitle", render: renderRichText },
          ctaPrimary: { type: "text", label: "Primärer CTA" },
          ctaSecondary: { type: "text", label: "Sekundärer CTA" },
        },
        defaultProps: {
          title: "Bereit loszulegen?",
          subtitle: "<p>Kurzer Anstoss, der den Klick motiviert.</p>",
          ctaPrimary: "Jetzt starten",
          ctaSecondary: "Demo ansehen",
        },
        render: CallToActionRender,
      },
      Footer: {
        label: "Footer",
        fields: {
          copyright: { type: "text", label: "Copyright" },
          tagline: { type: "custom", label: "Tagline", render: renderRichText },
        },
        defaultProps: {
          copyright: "© 2026 Deine Marke",
          tagline: "<p>Made with love.</p>",
        },
        render: FooterRender,
      },
    },
  };
}

/** Strongly-typed Puck Data for our config. Use this everywhere we read /
 * write the messages JSON or hand data to <Puck> / <Render>. */
export type PuckData = Data<Components, RootProps>;
