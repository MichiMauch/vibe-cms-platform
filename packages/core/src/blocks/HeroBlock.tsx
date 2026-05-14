import { ArrowRight } from "lucide-react";
import type { HeroData } from "../types/content";
import { EditableText } from "../editors/EditableText";
import { EditableRichText } from "../editors/EditableRichText";

type Props = { data: HeroData; pathPrefix: string };

export function HeroBlock({ data, pathPrefix }: Props) {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 pt-28 pb-32 md:pt-40 md:pb-44">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(59,130,246,0.12),transparent_70%)]"
      />
      <div className="mx-auto max-w-5xl px-6 text-center">
        <EditableText
          path={`${pathPrefix}.eyebrow`}
          value={data.eyebrow}
          as="p"
          className="inline-block rounded-full border border-slate-200 bg-white/60 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-slate-600 backdrop-blur"
        />
        <EditableText
          path={`${pathPrefix}.title`}
          value={data.title}
          as="h1"
          className="mt-8 text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.05]"
        />
        <EditableRichText
          path={`${pathPrefix}.subtitle`}
          value={data.subtitle}
          as="div"
          className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-slate-600 leading-relaxed"
        />
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition"
          >
            <EditableText path={`${pathPrefix}.ctaPrimary`} value={data.ctaPrimary} as="span" />
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#team"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:border-slate-400 transition"
          >
            <EditableText path={`${pathPrefix}.ctaSecondary`} value={data.ctaSecondary} as="span" />
          </a>
        </div>
      </div>
    </section>
  );
}
