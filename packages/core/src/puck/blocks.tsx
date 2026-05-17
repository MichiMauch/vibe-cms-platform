/**
 * Minimal block set — fresh start after the Puck migration. Add new blocks
 * by appending a Render function + props type here and registering them in
 * `config.tsx`.
 */
import { ArrowRight } from "lucide-react";

// ─── Hero ─────────────────────────────────────────────────────────────
export type HeroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

export function HeroRender({ eyebrow, title, subtitle, ctaLabel, ctaHref }: HeroProps) {
  return (
    <section className="bg-gradient-to-b from-slate-50 via-white to-slate-50 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-4xl text-center">
        {eyebrow && (
          <p className="inline-block rounded-full border border-slate-200 bg-white/60 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-slate-600 backdrop-blur">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05]">
          {title}
        </h1>
        <div
          className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: subtitle }}
        />
        {ctaLabel && (
          <a
            href={ctaHref || "#"}
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition"
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        )}
      </div>
    </section>
  );
}

// ─── RichBlock ────────────────────────────────────────────────────────
export type RichBlockProps = {
  content: string;
};

export function RichBlockRender({ content }: RichBlockProps) {
  return (
    <section className="bg-white px-6 py-16 md:py-24">
      <div
        className="prose prose-slate mx-auto max-w-3xl"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  );
}
