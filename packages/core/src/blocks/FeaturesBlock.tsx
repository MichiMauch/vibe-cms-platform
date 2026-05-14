import { Sparkles, FileJson, Zap, Pencil, ShieldCheck, Rocket, Layers, type LucideIcon } from "lucide-react";
import type { FeaturesData } from "../types/content";
import { EditableText } from "../editors/EditableText";
import { EditableRichText } from "../editors/EditableRichText";

const ICONS: Record<string, LucideIcon> = {
  Sparkles,
  FileJson,
  Zap,
  Pencil,
  ShieldCheck,
  Rocket,
  Layers,
};

type Props = { data: FeaturesData; pathPrefix: string };

export function FeaturesBlock({ data, pathPrefix }: Props) {
  return (
    <section id="features" className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <EditableText
            path={`${pathPrefix}.title`}
            value={data.title}
            as="h2"
            className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900"
          />
          <EditableRichText
            path={`${pathPrefix}.subtitle`}
            value={data.subtitle}
            as="div"
            className="mt-4 text-lg text-slate-600"
          />
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {data.items.map((item, i) => {
            const Icon = ICONS[item.icon] ?? Sparkles;
            return (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 hover:border-slate-300 hover:bg-slate-50 transition"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                  <Icon className="w-6 h-6" />
                </div>
                <EditableText
                  path={`${pathPrefix}.items.${i}.title`}
                  value={item.title}
                  as="h3"
                  className="mt-6 text-xl font-semibold text-slate-900"
                />
                <EditableRichText
                  path={`${pathPrefix}.items.${i}.description`}
                  value={item.description}
                  as="div"
                  className="mt-3 text-slate-600 leading-relaxed"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
