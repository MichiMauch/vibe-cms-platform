import { ArrowRight } from "lucide-react";
import type { CallToActionData } from "../types/content";
import { EditableText } from "../editors/EditableText";
import { EditableRichText } from "../editors/EditableRichText";

type Props = { data: CallToActionData; pathPrefix: string };

export function CallToActionBlock({ data, pathPrefix }: Props) {
  return (
    <section className="bg-blue-600 py-20 md:py-28 text-white">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <EditableText
          path={`${pathPrefix}.title`}
          value={data.title}
          as="h2"
          className="text-3xl md:text-5xl font-bold tracking-tight"
        />
        <EditableRichText
          path={`${pathPrefix}.subtitle`}
          value={data.subtitle}
          as="div"
          className="mx-auto mt-4 max-w-xl text-lg text-blue-50/90 leading-relaxed"
        />
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-lg shadow-blue-900/20 hover:bg-blue-50 transition"
          >
            <EditableText path={`${pathPrefix}.ctaPrimary`} value={data.ctaPrimary} as="span" />
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 transition"
          >
            <EditableText path={`${pathPrefix}.ctaSecondary`} value={data.ctaSecondary} as="span" />
          </a>
        </div>
      </div>
    </section>
  );
}
