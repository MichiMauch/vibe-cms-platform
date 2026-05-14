import type { FooterData } from "../types/content";
import { EditableText } from "../editors/EditableText";
import { EditableRichText } from "../editors/EditableRichText";

type Props = { data: FooterData; pathPrefix: string };

export function FooterBlock({ data, pathPrefix }: Props) {
  return (
    <footer className="bg-white border-t border-slate-200 py-12">
      <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
        <EditableText path={`${pathPrefix}.copyright`} value={data.copyright} as="p" />
        <EditableRichText path={`${pathPrefix}.tagline`} value={data.tagline} as="div" className="text-slate-400" />
      </div>
    </footer>
  );
}
