/**
 * Block render functions. Add new blocks by appending a Render fn + props
 * type here and registering them in `config.tsx`. Every block is a pure
 * prop-based component used by both the editor and `<Render>` from
 * `@puckeditor/core/rsc`.
 */
import {
  ArrowRight,
  Quote,
  Sparkles,
  Zap,
  ShieldCheck,
  Rocket,
  Pencil,
  Layers,
  FileJson,
  Heart,
  Star,
  type LucideIcon,
} from "lucide-react";

// Shared icon map used by blocks that let the editor pick an icon.
const ICONS: Record<string, LucideIcon> = {
  Sparkles,
  Zap,
  ShieldCheck,
  Rocket,
  Pencil,
  Layers,
  FileJson,
  Heart,
  Star,
};

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

// ─── FeaturesGrid ─────────────────────────────────────────────────────
export type FeaturesGridProps = {
  title: string;
  subtitle: string;
  items: Array<{ icon: string; title: string; description: string }>;
};

export function FeaturesGridRender({ title, subtitle, items }: FeaturesGridProps) {
  return (
    <section className="bg-white px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">{title}</h2>
          <div
            className="mt-4 text-lg text-slate-600"
            dangerouslySetInnerHTML={{ __html: subtitle }}
          />
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3 md:gap-8">
          {items.map((item, i) => {
            const Icon = ICONS[item.icon] ?? Sparkles;
            return (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-7 hover:border-slate-300 hover:bg-slate-50 transition"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{item.title}</h3>
                <div
                  className="mt-2 text-slate-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: item.description }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────
export type StatsProps = {
  intro: string;
  items: Array<{ value: string; label: string }>;
};

export function StatsRender({ intro, items }: StatsProps) {
  return (
    <section className="bg-slate-50 px-6 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        {intro && (
          <p className="mb-10 text-center text-sm font-semibold uppercase tracking-widest text-slate-500">
            {intro}
          </p>
        )}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {items.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">
                {s.value}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonial ──────────────────────────────────────────────────────
export type TestimonialProps = {
  quote: string;
  author: string;
  role: string;
  avatar: string;
};

export function TestimonialRender({ quote, author, role, avatar }: TestimonialProps) {
  return (
    <section className="bg-slate-900 px-6 py-24 md:py-32 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <Quote className="mx-auto h-10 w-10 text-blue-400" />
        <blockquote
          className="mt-8 text-2xl md:text-3xl font-medium leading-relaxed text-slate-100"
          dangerouslySetInnerHTML={{ __html: quote }}
        />
        <div className="mt-10 flex flex-col items-center gap-3">
          {avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={author}
              className="h-14 w-14 rounded-full object-cover bg-slate-700"
            />
          )}
          <div>
            <p className="text-base font-semibold text-white">{author}</p>
            <p className="text-sm text-slate-400">{role}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── ImageText (Split) ────────────────────────────────────────────────
export type ImageTextProps = {
  title: string;
  content: string;
  image: string;
  imageAlt: string;
  imagePosition: "left" | "right";
};

export function ImageTextRender({
  title,
  content,
  image,
  imageAlt,
  imagePosition,
}: ImageTextProps) {
  const imageFirst = imagePosition === "left";
  const imageNode = image ? (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={image}
      alt={imageAlt}
      className="w-full rounded-2xl object-cover shadow-md aspect-[4/3]"
    />
  ) : (
    <div className="w-full rounded-2xl bg-slate-100 aspect-[4/3]" />
  );
  const textNode = (
    <div>
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">{title}</h2>
      <div
        className="prose prose-slate mt-4 max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
  return (
    <section className="bg-white px-6 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16">
        {imageFirst ? (
          <>
            {imageNode}
            {textNode}
          </>
        ) : (
          <>
            {textNode}
            {imageNode}
          </>
        )}
      </div>
    </section>
  );
}
