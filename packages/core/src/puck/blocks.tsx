/**
 * Block render functions. Add new blocks by appending a Render fn + props
 * type here and registering them in `config.tsx`. Every block is a pure
 * prop-based component used by both the editor and `<Render>` from
 * `@puckeditor/core/rsc`.
 */
import {
  ArrowRight,
  Check,
  ChevronDown,
  Crown,
  Gem,
  Heart,
  FileJson,
  Layers,
  Pencil,
  Quote,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
  type LucideIcon,
} from "lucide-react";

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

const PLAN_ICONS: Record<string, LucideIcon> = {
  Gem,
  Rocket,
  Crown,
  Sparkles,
  Star,
  Zap,
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

// ─── CtaBanner ────────────────────────────────────────────────────────
export type CtaBannerProps = {
  title: string;
  subtitle: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  theme: "blue" | "dark" | "gradient";
};

export function CtaBannerRender({
  title,
  subtitle,
  ctaPrimaryLabel,
  ctaPrimaryHref,
  ctaSecondaryLabel,
  ctaSecondaryHref,
  theme,
}: CtaBannerProps) {
  const themeClass =
    theme === "dark"
      ? "bg-slate-900 text-white"
      : theme === "gradient"
        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
        : "bg-blue-600 text-white";
  const subtleClass = theme === "dark" ? "text-slate-300" : "text-blue-50/90";
  return (
    <section className={`${themeClass} px-6 py-20 md:py-28`}>
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{title}</h2>
        <div
          className={`mx-auto mt-4 max-w-xl text-lg leading-relaxed ${subtleClass}`}
          dangerouslySetInnerHTML={{ __html: subtitle }}
        />
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          {ctaPrimaryLabel && (
            <a
              href={ctaPrimaryHref || "#"}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition ${
                theme === "dark"
                  ? "bg-white text-slate-900 hover:bg-slate-100"
                  : "bg-white text-blue-700 hover:bg-blue-50"
              }`}
            >
              <span>{ctaPrimaryLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
          {ctaSecondaryLabel && (
            <a
              href={ctaSecondaryHref || "#"}
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 transition"
            >
              <span>{ctaSecondaryLabel}</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── LogoCloud ────────────────────────────────────────────────────────
export type LogoCloudProps = {
  intro: string;
  items: Array<{ name: string; image: string; link: string }>;
};

export function LogoCloudRender({ intro, items }: LogoCloudProps) {
  return (
    <section className="bg-white px-6 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        {intro && (
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-slate-500">
            {intro}
          </p>
        )}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-14">
          {items.map((logo, i) => {
            const img = logo.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logo.image}
                alt={logo.name}
                className="h-8 w-auto object-contain opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition"
              />
            ) : (
              <span className="text-sm font-semibold text-slate-400">{logo.name}</span>
            );
            return logo.link ? (
              <a key={i} href={logo.link} target="_blank" rel="noreferrer noopener" className="inline-flex">
                {img}
              </a>
            ) : (
              <span key={i} className="inline-flex">{img}</span>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────
export type FaqProps = {
  title: string;
  subtitle: string;
  items: Array<{ question: string; answer: string }>;
};

export function FaqRender({ title, subtitle, items }: FaqProps) {
  return (
    <section className="bg-white px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">{title}</h2>
          <div
            className="mt-4 text-lg text-slate-600"
            dangerouslySetInnerHTML={{ __html: subtitle }}
          />
        </div>
        <div className="mt-12 divide-y divide-slate-200 border-y border-slate-200">
          {items.map((it, i) => (
            <details key={i} className="group py-5">
              <summary className="flex cursor-pointer items-start justify-between gap-4 list-none">
                <span className="text-base md:text-lg font-medium text-slate-900">
                  {it.question}
                </span>
                <ChevronDown className="mt-1 h-5 w-5 flex-shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <div
                className="prose prose-slate mt-4 max-w-none text-slate-600"
                dangerouslySetInnerHTML={{ __html: it.answer }}
              />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Team ─────────────────────────────────────────────────────────────
export type TeamProps = {
  title: string;
  subtitle: string;
  members: Array<{ name: string; role: string; bio: string; image: string }>;
};

export function TeamRender({ title, subtitle, members }: TeamProps) {
  return (
    <section className="bg-slate-50 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">{title}</h2>
          <div
            className="mt-4 text-lg text-slate-600"
            dangerouslySetInnerHTML={{ __html: subtitle }}
          />
        </div>
        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-12">
          {members.map((m, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              {m.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={m.image}
                  alt={m.name}
                  className="h-28 w-28 rounded-full object-cover bg-slate-200"
                />
              ) : (
                <div className="h-28 w-28 rounded-full bg-slate-200" />
              )}
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{m.name}</h3>
              <p className="mt-1 text-sm font-medium text-blue-600">{m.role}</p>
              <div
                className="mt-3 max-w-xs text-sm text-slate-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: m.bio }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────
export type PricingProps = {
  title: string;
  subtitle: string;
  plans: Array<{
    icon: string;
    name: string;
    price: string;
    priceCaption: string;
    features: Array<{ value: string }>;
    ctaLabel: string;
    ctaHref: string;
    featured: boolean;
  }>;
};

export function PricingRender({ title, subtitle, plans }: PricingProps) {
  return (
    <section className="bg-slate-50 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">{title}</h2>
          <div
            className="mt-4 text-lg text-slate-600"
            dangerouslySetInnerHTML={{ __html: subtitle }}
          />
        </div>
        <div className="mt-14 grid items-stretch gap-6 md:grid-cols-3 md:gap-8">
          {plans.map((plan, i) => {
            const Icon = PLAN_ICONS[plan.icon] ?? Sparkles;
            return (
              <div
                key={i}
                className={`relative flex flex-col rounded-2xl border bg-white p-7 transition ${
                  plan.featured
                    ? "border-blue-600 ring-1 ring-blue-600 shadow-xl shadow-blue-600/10 md:scale-[1.03]"
                    : "border-slate-200 shadow-sm hover:border-slate-300"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white shadow-md">
                    Empfohlen
                  </span>
                )}
                <div className="flex items-center gap-2.5">
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                      plan.featured ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                </div>
                <div className="mt-6">
                  <p className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                    {plan.price}
                  </p>
                  <p
                    className={`mt-2 text-sm font-medium ${
                      plan.featured ? "text-blue-600" : "text-slate-500"
                    }`}
                  >
                    {plan.priceCaption}
                  </p>
                </div>
                <ul className="mt-8 space-y-3 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                          plan.featured ? "text-blue-600" : "text-slate-400"
                        }`}
                      />
                      <span className="leading-relaxed">{f.value}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.ctaHref || "#"}
                  className={`mt-10 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${
                    plan.featured
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  <span>{plan.ctaLabel}</span>
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────
export type FooterProps = {
  copyright: string;
  tagline: string;
  columns: Array<{
    heading: string;
    links: Array<{ label: string; href: string }>;
  }>;
};

export function FooterRender({ copyright, tagline, columns }: FooterProps) {
  const hasColumns = columns.length > 0 && columns.some((c) => c.links.length > 0);
  return (
    <footer className="bg-slate-900 px-6 py-14 text-slate-300">
      <div className="mx-auto max-w-6xl">
        {hasColumns && (
          <div className="grid gap-10 pb-12 md:grid-cols-4 md:gap-12 border-b border-slate-800">
            {columns.map((col, i) => (
              <div key={i}>
                <h4 className="text-sm font-semibold uppercase tracking-widest text-white">
                  {col.heading}
                </h4>
                <ul className="mt-4 space-y-2">
                  {col.links.map((l, j) => (
                    <li key={j}>
                      <a href={l.href || "#"} className="text-sm hover:text-white transition">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <div className={`flex flex-col items-center justify-between gap-3 text-sm text-slate-400 sm:flex-row ${hasColumns ? "pt-8" : ""}`}>
          <p>{copyright}</p>
          {tagline && <p className="text-slate-500">{tagline}</p>}
        </div>
      </div>
    </footer>
  );
}
