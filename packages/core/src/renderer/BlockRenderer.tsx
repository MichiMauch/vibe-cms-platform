import type { BlockType, Section } from "../types/content";
import { HeroBlock } from "../blocks/HeroBlock";
import { FeaturesBlock } from "../blocks/FeaturesBlock";
import { TeamBlock } from "../blocks/TeamBlock";
import { TestimonialBlock } from "../blocks/TestimonialBlock";
import { PricingBlock } from "../blocks/PricingBlock";
import { CallToActionBlock } from "../blocks/CallToActionBlock";
import { FooterBlock } from "../blocks/FooterBlock";
import { EditableBlock } from "./EditableBlock";

const REGISTRY: {
  [K in BlockType]: React.ComponentType<{
    data: import("../types/content").BlockDataMap[K];
    pathPrefix: string;
  }>;
} = {
  Hero: HeroBlock,
  Features: FeaturesBlock,
  Team: TeamBlock,
  Testimonial: TestimonialBlock,
  Pricing: PricingBlock,
  CallToAction: CallToActionBlock,
  Footer: FooterBlock,
};

type Props = { sections: Section[] };

export function BlockRenderer({ sections }: Props) {
  return (
    <>
      {sections.map((section, i) => {
        const Component = REGISTRY[section.type] as React.ComponentType<{
          data: typeof section.data;
          pathPrefix: string;
        }>;
        if (!Component) {
          return (
            <UnknownBlock key={section.id} id={section.id} type={section.type} index={i} />
          );
        }
        return (
          <EditableBlock key={section.id} id={section.id} type={section.type} index={i}>
            <Component data={section.data} pathPrefix={`sections.${i}.data`} />
          </EditableBlock>
        );
      })}
    </>
  );
}

function UnknownBlock({ id, type, index }: { id: string; type: string; index: number }) {
  return (
    <div className="bg-amber-50 border-y-2 border-dashed border-amber-300 px-6 py-8 text-center text-sm text-amber-900">
      Unbekannter Block-Typ <code className="font-mono font-semibold">{type}</code>{" "}
      (Position {index}, id {id.slice(0, 8)}…) — bitte im Block-Manager entfernen.
    </div>
  );
}
