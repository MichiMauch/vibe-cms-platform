import type { Config, Data } from "@puckeditor/core";
import {
  HeroRender,
  type HeroProps,
  RichBlockRender,
  type RichBlockProps,
} from "./blocks";
import { RichTextField } from "./fields/RichTextField";
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
};

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
    },
  };
}

/** Strongly-typed Puck Data for our config. */
export type PuckData = Data<Components, RootProps>;
