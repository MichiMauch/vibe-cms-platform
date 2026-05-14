import {
  Check,
  Crown,
  Gem,
  Rocket,
  Sparkles,
  Star,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { PricingData } from "../types/content";
import { EditableText } from "../editors/EditableText";
import { EditableRichText } from "../editors/EditableRichText";
import { PopularLabel } from "./PopularLabel";

const PLAN_ICONS: Record<string, LucideIcon> = {
  Gem,
  Rocket,
  Crown,
  Sparkles,
  Star,
  Zap,
};

type Props = { data: PricingData; pathPrefix: string };

export function PricingBlock({ data, pathPrefix }: Props) {
  return (
    <section className="bg-slate-50 py-24 md:py-32">
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

        <div className="mt-16 grid items-stretch gap-6 md:grid-cols-3 md:gap-8">
          {data.plans.map((plan, i) => {
            const Icon = PLAN_ICONS[plan.icon] ?? Sparkles;
            const featured = plan.featured;

            return (
              <div
                key={i}
                className={`relative flex flex-col rounded-2xl border bg-white p-8 transition ${
                  featured
                    ? "border-blue-600 ring-1 ring-blue-600 shadow-xl shadow-blue-600/10 md:scale-[1.03]"
                    : "border-slate-200 shadow-sm hover:border-slate-300"
                }`}
              >
                {featured && <PopularLabel />}

                <div className="flex items-center gap-2.5">
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                      featured ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <EditableText
                    path={`${pathPrefix}.plans.${i}.name`}
                    value={plan.name}
                    as="h3"
                    className="text-xl font-semibold text-slate-900"
                  />
                </div>

                <div className="mt-6">
                  <EditableText
                    path={`${pathPrefix}.plans.${i}.price`}
                    value={plan.price}
                    as="p"
                    className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900"
                  />
                  <EditableText
                    path={`${pathPrefix}.plans.${i}.priceCaption`}
                    value={plan.priceCaption}
                    as="p"
                    className={`mt-2 text-sm font-medium ${
                      featured ? "text-blue-600" : "text-slate-500"
                    }`}
                  />
                </div>

                <ul className="mt-8 space-y-3 flex-1">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                          featured ? "text-blue-600" : "text-slate-400"
                        }`}
                      />
                      <EditableText
                        path={`${pathPrefix}.plans.${i}.features.${j}`}
                        value={feature}
                        as="span"
                        className="leading-relaxed"
                      />
                    </li>
                  ))}
                </ul>

                <a
                  href="#"
                  className={`mt-10 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${
                    featured
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  <EditableText
                    path={`${pathPrefix}.plans.${i}.cta`}
                    value={plan.cta}
                    as="span"
                  />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
