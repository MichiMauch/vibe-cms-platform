import { Quote } from "lucide-react";
import type { TestimonialData } from "../types/content";
import { EditableText } from "../editors/EditableText";
import { EditableRichText } from "../editors/EditableRichText";

type Props = { data: TestimonialData; pathPrefix: string };

export function TestimonialBlock({ data, pathPrefix }: Props) {
  return (
    <section className="bg-slate-900 py-24 md:py-32 text-white">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Quote className="mx-auto h-10 w-10 text-blue-400" />
        <EditableRichText
          path={`${pathPrefix}.quote`}
          value={data.quote}
          as="blockquote"
          className="mt-8 text-2xl md:text-3xl font-medium leading-relaxed text-slate-100"
        />
        <div className="mt-10 flex flex-col items-center gap-1">
          <EditableText
            path={`${pathPrefix}.author`}
            value={data.author}
            as="p"
            className="text-base font-semibold text-white"
          />
          <EditableText
            path={`${pathPrefix}.role`}
            value={data.role}
            as="p"
            className="text-sm text-slate-400"
          />
        </div>
      </div>
    </section>
  );
}
