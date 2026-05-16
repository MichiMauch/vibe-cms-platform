/**
 * Pure prop-based render functions used by both the Puck editor (via
 * config.components.<Type>.render) and the public-site `<Render>` from
 * `@puckeditor/core/rsc`. No edit affordances inside — Puck wraps these
 * with its own selection / drag handles in editor mode.
 */
import {
  ArrowRight,
  Check,
  Crown,
  FileJson,
  Gem,
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
import { PopularLabel } from "../blocks/PopularLabel";

// ─── Feature icons ────────────────────────────────────────────────────
const FEATURE_ICONS: Record<string, LucideIcon> = {
  Sparkles,
  FileJson,
  Zap,
  Pencil,
  ShieldCheck,
  Rocket,
  Layers,
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
  ctaPrimary: string;
  ctaSecondary: string;
};

export function HeroRender({ eyebrow, title, subtitle, ctaPrimary, ctaSecondary }: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 pt-28 pb-32 md:pt-40 md:pb-44">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(59,130,246,0.12),transparent_70%)]"
      />
      <div className="mx-auto max-w-5xl px-6 text-center">
        <p className="inline-block rounded-full border border-slate-200 bg-white/60 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-slate-600 backdrop-blur">
          {eyebrow}
        </p>
        <h1 className="mt-8 text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.05]">
          {title}
        </h1>
        <div
          className="mx-auto mt-6 max-w-2xl text-lg md:text-xl text-slate-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: subtitle }}
        />
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition"
          >
            <span>{ctaPrimary}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#team"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:border-slate-400 transition"
          >
            <span>{ctaSecondary}</span>
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────
export type FeaturesProps = {
  title: string;
  subtitle: string;
  items: Array<{ icon: string; title: string; description: string }>;
};

export function FeaturesRender({ title, subtitle, items }: FeaturesProps) {
  return (
    <section id="features" className="bg-white py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">{title}</h2>
          <div
            className="mt-4 text-lg text-slate-600"
            dangerouslySetInnerHTML={{ __html: subtitle }}
          />
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {items.map((item, i) => {
            const Icon = FEATURE_ICONS[item.icon] ?? Sparkles;
            return (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-8 hover:border-slate-300 hover:bg-slate-50 transition"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-900">{item.title}</h3>
                <div
                  className="mt-3 text-slate-600 leading-relaxed"
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

// ─── Team ─────────────────────────────────────────────────────────────
export type TeamProps = {
  title: string;
  subtitle: string;
  members: Array<{ name: string; role: string; bio: string; image: string }>;
};

export function TeamRender({ title, subtitle, members }: TeamProps) {
  return (
    <section id="team" className="bg-slate-50 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">{title}</h2>
          <div
            className="mt-4 text-lg text-slate-600"
            dangerouslySetInnerHTML={{ __html: subtitle }}
          />
        </div>
        <div className="mt-16 grid gap-12 md:grid-cols-3">
          {members.map((m, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.image}
                alt={m.name}
                className="h-32 w-32 rounded-full object-cover bg-slate-200"
              />
              <h3 className="mt-6 text-lg font-semibold text-slate-900">{m.name}</h3>
              <p className="mt-1 text-sm font-medium text-blue-600">{m.role}</p>
              <div
                className="mt-3 max-w-xs text-slate-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: m.bio }}
              />
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
};

export function TestimonialRender({ quote, author, role }: TestimonialProps) {
  return (
    <section className="bg-slate-900 py-24 md:py-32 text-white">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Quote className="mx-auto h-10 w-10 text-blue-400" />
        <blockquote
          className="mt-8 text-2xl md:text-3xl font-medium leading-relaxed text-slate-100"
          dangerouslySetInnerHTML={{ __html: quote }}
        />
        <div className="mt-10 flex flex-col items-center gap-1">
          <p className="text-base font-semibold text-white">{author}</p>
          <p className="text-sm text-slate-400">{role}</p>
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
    cta: string;
    featured: boolean;
  }>;
};

export function PricingRender({ title, subtitle, plans }: PricingProps) {
  return (
    <section className="bg-slate-50 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">{title}</h2>
          <div
            className="mt-4 text-lg text-slate-600"
            dangerouslySetInnerHTML={{ __html: subtitle }}
          />
        </div>
        <div className="mt-16 grid items-stretch gap-6 md:grid-cols-3 md:gap-8">
          {plans.map((plan, i) => {
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
                  <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                </div>
                <div className="mt-6">
                  <p className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                    {plan.price}
                  </p>
                  <p
                    className={`mt-2 text-sm font-medium ${
                      featured ? "text-blue-600" : "text-slate-500"
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
                          featured ? "text-blue-600" : "text-slate-400"
                        }`}
                      />
                      <span className="leading-relaxed">{f.value}</span>
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
                  <span>{plan.cta}</span>
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── CallToAction ─────────────────────────────────────────────────────
export type CallToActionProps = {
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

export function CallToActionRender({ title, subtitle, ctaPrimary, ctaSecondary }: CallToActionProps) {
  return (
    <section className="bg-blue-600 py-20 md:py-28 text-white">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{title}</h2>
        <div
          className="mx-auto mt-4 max-w-xl text-lg text-blue-50/90 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: subtitle }}
        />
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-lg shadow-blue-900/20 hover:bg-blue-50 transition"
          >
            <span>{ctaPrimary}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 transition"
          >
            <span>{ctaSecondary}</span>
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────
export type FooterProps = {
  copyright: string;
  tagline: string;
};

export function FooterRender({ copyright, tagline }: FooterProps) {
  return (
    <footer className="bg-white border-t border-slate-200 py-12">
      <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
        <p>{copyright}</p>
        <div
          className="text-slate-400"
          dangerouslySetInnerHTML={{ __html: tagline }}
        />
      </div>
    </footer>
  );
}
