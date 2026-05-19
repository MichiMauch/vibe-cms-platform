/**
 * Block render functions. Add new blocks by appending a Render fn + props
 * type here and registering them in `config.tsx`. Every block is a pure
 * prop-based component used by both the editor and `<Render>` from
 * `@puckeditor/core/rsc`.
 *
 * Visual styling is driven by semantic theme tokens (`bg-brand-*`,
 * `text-brand-*`, `font-brand-*`) plus the `brand-section`, `brand-hero`,
 * `brand-heading`, `brand-h1-display`, `brand-accent-bar` and `brand-card`
 * helper classes whose appearance is driven by the per-site theme — see
 * `apps/studio/src/lib/platform/theme.ts` and `packages/core/src/theme/`.
 */
import {
  ArrowRight,
  ChevronDown,
  ChevronsDown,
  Check,
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
import { EmailCaptureForm } from "../components/EmailCaptureForm";
import { PricingToggle } from "../components/PricingToggle";
import { TestimonialCarousel } from "../components/TestimonialCarousel";

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
export type HeroLayout =
  | "centered"
  | "left"
  | "split-right"
  | "split-left"
  | "oversized";
export type HeroDensity = "compact" | "default" | "spacious";
export type HeroImageStyle = "card" | "bleed" | "tilt" | "browser-frame";
export type HeroBgStyle = "gradient" | "surface" | "accent" | "image";
export type HeroEyebrowStyle = "pill" | "badge" | "caps" | "none";
export type HeroMode = "cta" | "email-capture";

export type HeroProps = {
  // Content (existing fields, unchanged)
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;

  // Grouped Puck object-fields. Editor renders these as expandable sub-
  // sections in the sidebar. Shape mirrors the Puck `objectFields` config.
  layout: {
    layout: HeroLayout;
    density: HeroDensity;
  };
  imageGroup: {
    image: string;
    imageAlt: string;
    imageStyle: HeroImageStyle;
  };
  background: {
    bgStyle: HeroBgStyle;
    bgImage: string;
  };
  style: {
    eyebrowStyle: HeroEyebrowStyle;
    accentBar: boolean;
    gradientTitle: boolean;
  };
  secondaryCta: {
    ctaSecondaryLabel: string;
    ctaSecondaryHref: string;
  };
  trustAndMode: {
    trustLine: string;
    mode: HeroMode;
    emailPlaceholder: string;
    emailSubmitLabel: string;
    emailEndpoint: string;
  };
  extras: {
    scrollIndicator: boolean;
  };
};

const HERO_DENSITY_PADDING: Record<HeroDensity, string> = {
  compact: "py-16 md:py-20",
  default: "py-24 md:py-32",
  spacious: "py-32 md:py-48",
};

function HeroImage({
  image,
  imageAlt,
  imageStyle,
  className = "",
}: {
  image: string;
  imageAlt: string;
  imageStyle: HeroImageStyle;
  className?: string;
}) {
  const figureBase = "w-full";
  const placeholder = (
    <div className="w-full rounded-[var(--brand-radius-card)] bg-brand-surface aspect-[4/3]" />
  );
  if (!image) {
    if (imageStyle === "browser-frame") {
      return (
        <figure className={`${figureBase} ${className}`}>
          <BrowserFrame>{placeholder}</BrowserFrame>
        </figure>
      );
    }
    return <figure className={`${figureBase} ${className}`}>{placeholder}</figure>;
  }
  const imgEl = (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={image}
      alt={imageAlt}
      className={
        imageStyle === "bleed"
          ? "w-full object-cover"
          : "w-full object-cover aspect-[4/3]"
      }
    />
  );
  if (imageStyle === "browser-frame") {
    return (
      <figure className={`${figureBase} ${className}`}>
        <BrowserFrame>{imgEl}</BrowserFrame>
      </figure>
    );
  }
  if (imageStyle === "bleed") {
    return <figure className={`${figureBase} ${className}`}>{imgEl}</figure>;
  }
  const wrapClass =
    imageStyle === "tilt"
      ? "overflow-hidden rounded-[var(--brand-radius-card)] shadow-xl shadow-brand-ink/15 rotate-2 hover:rotate-0 transition-transform"
      : "overflow-hidden rounded-[var(--brand-radius-card)] shadow-xl shadow-brand-ink/10";
  return (
    <figure className={`${figureBase} ${className}`}>
      <div className={wrapClass}>{imgEl}</div>
    </figure>
  );
}

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[var(--brand-radius-card)] border border-brand-border bg-brand-bg shadow-xl shadow-brand-ink/10">
      <div className="flex items-center gap-1.5 border-b border-brand-border bg-brand-surface px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
      </div>
      <div className="aspect-[4/3] w-full overflow-hidden">{children}</div>
    </div>
  );
}

const HERO_DEFAULTS = {
  layout: { layout: "centered" as HeroLayout, density: "default" as HeroDensity },
  imageGroup: { image: "", imageAlt: "", imageStyle: "card" as HeroImageStyle },
  background: { bgStyle: "gradient" as HeroBgStyle, bgImage: "" },
  style: {
    eyebrowStyle: "pill" as HeroEyebrowStyle,
    accentBar: false,
    gradientTitle: false,
  },
  secondaryCta: { ctaSecondaryLabel: "", ctaSecondaryHref: "" },
  trustAndMode: {
    trustLine: "",
    mode: "cta" as HeroMode,
    emailPlaceholder: "deine@adresse.ch",
    emailSubmitLabel: "Eintragen",
    emailEndpoint: "",
  },
  extras: { scrollIndicator: false },
};

export function HeroRender(props: HeroProps) {
  const { eyebrow, title, subtitle, ctaLabel, ctaHref } = props;
  // Defensive merge: existing site JSON may lack the new grouped objects.
  // Puck merges defaultProps for missing fields at load time, but during
  // partial migrations we still fall back to local defaults.
  const { layout, density } = { ...HERO_DEFAULTS.layout, ...props.layout };
  const { image, imageAlt, imageStyle } = {
    ...HERO_DEFAULTS.imageGroup,
    ...props.imageGroup,
  };
  const { bgStyle, bgImage } = { ...HERO_DEFAULTS.background, ...props.background };
  const { eyebrowStyle, accentBar, gradientTitle } = {
    ...HERO_DEFAULTS.style,
    ...props.style,
  };
  const { ctaSecondaryLabel, ctaSecondaryHref } = {
    ...HERO_DEFAULTS.secondaryCta,
    ...props.secondaryCta,
  };
  const { trustLine, mode, emailPlaceholder, emailSubmitLabel, emailEndpoint } = {
    ...HERO_DEFAULTS.trustAndMode,
    ...props.trustAndMode,
  };
  const { scrollIndicator } = { ...HERO_DEFAULTS.extras, ...props.extras };

  const onDark = bgStyle === "accent" || bgStyle === "image";

  // ── Section background ───────────────────────────────────────────
  let sectionClass =
    "brand-section relative px-6 font-brand-body overflow-hidden ";
  let sectionStyle: React.CSSProperties | undefined = undefined;
  switch (bgStyle) {
    case "surface":
      sectionClass += "bg-brand-surface text-brand-ink";
      break;
    case "accent":
      sectionClass += "bg-brand-accent text-brand-accent-fg";
      break;
    case "image":
      sectionClass += "bg-cover bg-center text-brand-ink-inverse";
      sectionStyle = bgImage ? { backgroundImage: `url(${bgImage})` } : undefined;
      break;
    case "gradient":
    default:
      sectionClass +=
        "bg-gradient-to-b from-brand-surface via-brand-bg to-brand-surface text-brand-ink";
      break;
  }
  sectionClass += " " + HERO_DENSITY_PADDING[density];

  // ── Title classes ────────────────────────────────────────────────
  const titleColorClass = onDark ? "text-brand-ink-inverse" : "text-brand-ink";
  const titleGradientClass = gradientTitle
    ? "bg-gradient-to-r from-brand-accent to-brand-accent-2 bg-clip-text text-transparent"
    : "";
  const titleSizeClass =
    layout === "oversized"
      ? "text-6xl md:text-8xl xl:text-9xl leading-[0.95]"
      : "text-4xl md:text-6xl leading-[1.05]";
  const titleClasses = `${titleSizeClass} brand-heading ${
    gradientTitle ? titleGradientClass : titleColorClass
  }`;

  // ── Subtitle / trust-line colour on dark backgrounds ─────────────
  const subtitleColorClass = onDark
    ? "text-brand-ink-inverse/85"
    : "text-brand-ink-muted";

  // ── Eyebrow ──────────────────────────────────────────────────────
  let eyebrowEl: React.ReactNode = null;
  if (eyebrow && eyebrowStyle !== "none") {
    if (eyebrowStyle === "badge") {
      eyebrowEl = (
        <p className="inline-block rounded-md bg-brand-accent px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-accent-fg">
          {eyebrow}
        </p>
      );
    } else if (eyebrowStyle === "caps") {
      eyebrowEl = (
        <p
          className={`text-xs font-semibold uppercase tracking-widest ${
            onDark ? "text-brand-ink-inverse/70" : "text-brand-ink-subtle"
          }`}
        >
          {eyebrow}
        </p>
      );
    } else {
      // pill (default)
      eyebrowEl = (
        <p
          className={`inline-block rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-widest backdrop-blur ${
            onDark
              ? "border-white/30 bg-white/10 text-brand-ink-inverse/90"
              : "border-brand-border bg-brand-bg/60 text-brand-ink-muted"
          }`}
        >
          {eyebrow}
        </p>
      );
    }
  }

  // ── Accent bar ───────────────────────────────────────────────────
  const accentBarEl = accentBar ? (
    <span
      aria-hidden
      className={`block h-1 w-12 rounded-full mb-6 ${
        onDark ? "bg-brand-ink-inverse" : "bg-brand-accent"
      }`}
    />
  ) : null;

  // ── Primary CTA ──────────────────────────────────────────────────
  const primaryCtaClass = onDark
    ? "bg-brand-bg text-brand-ink hover:bg-brand-surface"
    : "bg-brand-ink text-brand-ink-inverse hover:bg-brand-ink/90";

  const primaryCta = ctaLabel ? (
    <a
      href={ctaHref || "#"}
      className={`inline-flex items-center gap-2 rounded-[var(--brand-radius-button)] px-6 py-3 text-sm font-semibold shadow-lg shadow-black/10 transition ${primaryCtaClass}`}
    >
      <span>{ctaLabel}</span>
      <ArrowRight className="w-4 h-4" />
    </a>
  ) : null;

  // ── Secondary CTA ────────────────────────────────────────────────
  const secondaryCtaClass = onDark
    ? "border border-white/40 bg-white/10 text-brand-ink-inverse hover:bg-white/20 backdrop-blur"
    : "border border-brand-ink/15 text-brand-ink hover:bg-brand-surface";

  const secondaryCta = ctaSecondaryLabel ? (
    <a
      href={ctaSecondaryHref || "#"}
      className={`inline-flex items-center gap-2 rounded-[var(--brand-radius-button)] px-6 py-3 text-sm font-semibold transition ${secondaryCtaClass}`}
    >
      <span>{ctaSecondaryLabel}</span>
    </a>
  ) : null;

  // ── CTA cluster (or email-capture form) ──────────────────────────
  const isSplitLayout = layout === "split-right" || layout === "split-left";
  const isCentered = layout === "centered" || layout === "oversized";
  const ctasJustify = isCentered ? "justify-center" : "justify-start";

  let actionsEl: React.ReactNode;
  if (mode === "email-capture") {
    actionsEl = (
      <div className={`mt-10 flex ${ctasJustify}`}>
        <EmailCaptureForm
          placeholder={emailPlaceholder}
          submitLabel={emailSubmitLabel}
          endpoint={emailEndpoint}
          invertOnDark={onDark}
        />
      </div>
    );
  } else if (primaryCta || secondaryCta) {
    actionsEl = (
      <div className={`mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${ctasJustify}`}>
        {primaryCta}
        {secondaryCta}
      </div>
    );
  }

  // ── Trust line ───────────────────────────────────────────────────
  const trustEl = trustLine ? (
    <p
      className={`mt-5 text-xs ${
        onDark ? "text-brand-ink-inverse/70" : "text-brand-ink-muted"
      }`}
    >
      {trustLine}
    </p>
  ) : null;

  // ── Subtitle node ────────────────────────────────────────────────
  const subtitleEl = (
    <div
      className={`mt-6 ${layout === "oversized" ? "max-w-3xl text-base md:text-lg" : "max-w-2xl text-lg"} leading-relaxed ${subtitleColorClass} ${
        isCentered ? "mx-auto" : ""
      }`}
      dangerouslySetInnerHTML={{ __html: subtitle }}
    />
  );

  // ── Text cluster (used in all layouts) ───────────────────────────
  const textCluster = (
    <div className={isCentered ? "text-center" : "text-left"}>
      {accentBarEl && (isCentered ? (
        <div className="flex justify-center">{accentBarEl}</div>
      ) : (
        accentBarEl
      ))}
      {eyebrowEl}
      <h1 className={`mt-6 ${titleClasses}`}>{title}</h1>
      {subtitleEl}
      {actionsEl}
      {trustEl}
    </div>
  );

  // ── Layout shell ─────────────────────────────────────────────────
  let body: React.ReactNode;
  if (layout === "oversized") {
    // Pure-typography hero: image suppressed entirely so the headline
    // carries the whole impact. Companion vibes: Tech (grid bg), Editorial.
    body = <div className="mx-auto max-w-6xl">{textCluster}</div>;
  } else if (layout === "centered") {
    body = (
      <div className="mx-auto max-w-4xl">
        {textCluster}
        {image && (
          <div className="mt-14">
            <HeroImage
              image={image}
              imageAlt={imageAlt}
              imageStyle={imageStyle}
              className="mx-auto max-w-3xl"
            />
          </div>
        )}
      </div>
    );
  } else if (layout === "left") {
    body = (
      <div className="mx-auto max-w-4xl">
        {textCluster}
        {image && (
          <div className="mt-12">
            <HeroImage
              image={image}
              imageAlt={imageAlt}
              imageStyle={imageStyle}
              className="max-w-2xl"
            />
          </div>
        )}
      </div>
    );
  } else {
    // split-right or split-left
    const imageFirst = layout === "split-left";
    const imageNode = (
      <HeroImage image={image} imageAlt={imageAlt} imageStyle={imageStyle} />
    );
    body = (
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16">
        {imageFirst ? (
          <>
            {imageNode}
            {textCluster}
          </>
        ) : (
          <>
            {textCluster}
            {imageNode}
          </>
        )}
      </div>
    );
  }

  // ── Background image overlay (only for bgStyle="image") ──────────
  const overlayEl =
    bgStyle === "image" ? (
      <div aria-hidden className="absolute inset-0 bg-brand-ink/50" />
    ) : null;

  // ── Scroll indicator ─────────────────────────────────────────────
  const scrollEl = scrollIndicator ? (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 bottom-6 flex justify-center ${
        onDark ? "text-brand-ink-inverse/60" : "text-brand-ink-muted"
      }`}
    >
      <ChevronsDown className="h-6 w-6 animate-bounce" />
    </div>
  ) : null;

  return (
    <section className={sectionClass} style={sectionStyle}>
      {overlayEl}
      <div className="relative">{body}</div>
      {scrollEl}
    </section>
  );
}

// ─── RichBlock ────────────────────────────────────────────────────────
export type RichBlockProps = {
  content: string;
};

export function RichBlockRender({ content }: RichBlockProps) {
  return (
    <section className="brand-section bg-brand-bg px-6 py-16 md:py-24 font-brand-body text-brand-ink">
      <div
        className="prose mx-auto max-w-3xl"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  );
}

// ─── FeaturesGrid ─────────────────────────────────────────────────────
export type FeaturesLayout = "grid-3" | "grid-4" | "list-icon-left" | "bento";
export type FeaturesItem = {
  icon: string;
  title: string;
  description: string;
  /** Only honored in bento layout; "large" items span more rows/cols. */
  emphasis?: "normal" | "large";
};
export type FeaturesGridProps = {
  title: string;
  subtitle: string;
  /** Optional. Defaults to "grid-3" so legacy sites render identically. */
  layout?: FeaturesLayout;
  items: Array<FeaturesItem>;
};

export function FeaturesGridRender({ title, subtitle, layout, items }: FeaturesGridProps) {
  const variant: FeaturesLayout = layout ?? "grid-3";
  return (
    <section className="brand-section bg-brand-bg px-6 py-20 md:py-28 font-brand-body text-brand-ink">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-5xl text-brand-ink brand-heading">{title}</h2>
          <div
            className="mt-4 text-lg text-brand-ink-muted"
            dangerouslySetInnerHTML={{ __html: subtitle }}
          />
        </div>

        {variant === "grid-3" && (
          <div className="mt-14 grid gap-6 md:grid-cols-3 md:gap-8">
            {items.map((item, i) => {
              const Icon = ICONS[item.icon] ?? Sparkles;
              return (
                <div key={i} className="brand-card bg-brand-bg p-7">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-accent text-brand-accent-fg shadow-md shadow-brand-accent/20">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-brand-ink font-brand-heading">{item.title}</h3>
                  <div
                    className="mt-2 text-brand-ink-muted leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: item.description }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {variant === "grid-4" && (
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
            {items.map((item, i) => {
              const Icon = ICONS[item.icon] ?? Sparkles;
              return (
                <div key={i} className="brand-card bg-brand-bg p-6">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent text-brand-accent-fg shadow-md shadow-brand-accent/20">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-brand-ink font-brand-heading">{item.title}</h3>
                  <div
                    className="mt-2 text-sm text-brand-ink-muted leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: item.description }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {variant === "list-icon-left" && (
          <ul className="mx-auto mt-14 grid max-w-3xl gap-8">
            {items.map((item, i) => {
              const Icon = ICONS[item.icon] ?? Sparkles;
              return (
                <li key={i} className="flex items-start gap-5">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-brand-accent-soft text-brand-accent">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-lg font-semibold text-brand-ink font-brand-heading">{item.title}</h3>
                    <div
                      className="mt-1.5 text-brand-ink-muted leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: item.description }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {variant === "bento" && (
          <div className="mt-14 grid auto-rows-[minmax(11rem,auto)] grid-cols-2 gap-4 md:grid-cols-6 md:gap-5">
            {items.map((item, i) => {
              const Icon = ICONS[item.icon] ?? Sparkles;
              // Pattern: first item is large by default, others normal. Author
              // can opt in to extra `emphasis: "large"` items for richer grids.
              const large = item.emphasis === "large" || i === 0;
              const cellClass = large
                ? "col-span-2 row-span-2 md:col-span-3"
                : "col-span-1 row-span-1 md:col-span-2";
              return (
                <div key={i} className={`brand-card bg-brand-bg p-6 flex flex-col ${cellClass}`}>
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-accent text-brand-accent-fg shadow-md shadow-brand-accent/20">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className={`mt-5 font-semibold text-brand-ink font-brand-heading ${large ? "text-2xl" : "text-base"}`}>
                    {item.title}
                  </h3>
                  <div
                    className={`mt-2 text-brand-ink-muted leading-relaxed ${large ? "text-base" : "text-sm"}`}
                    dangerouslySetInnerHTML={{ __html: item.description }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────
export type StatsLayout = "grid" | "row" | "oversized";
export type StatsProps = {
  /** Optional. Defaults to "grid" so legacy sites render identically. */
  layout?: StatsLayout;
  intro: string;
  items: Array<{ value: string; label: string }>;
};

export function StatsRender({ layout, intro, items }: StatsProps) {
  const variant: StatsLayout = layout ?? "grid";

  return (
    <section className="brand-section bg-brand-surface px-6 py-16 md:py-20 font-brand-body text-brand-ink">
      <div className="mx-auto max-w-6xl">
        {intro && (
          <p className="mb-10 text-center text-sm font-semibold uppercase tracking-widest text-brand-ink-subtle">
            {intro}
          </p>
        )}

        {variant === "grid" && (
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {items.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-5xl text-brand-ink brand-heading">{s.value}</p>
                <p className="mt-2 text-sm font-medium text-brand-ink-muted">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {variant === "row" && (
          <div className="flex flex-wrap items-center justify-center divide-x divide-brand-border md:flex-nowrap">
            {items.map((s, i) => (
              <div
                key={i}
                className="flex min-w-[12rem] flex-1 items-baseline justify-center gap-3 px-6 py-3"
              >
                <p className="text-3xl md:text-4xl text-brand-ink brand-heading">{s.value}</p>
                <p className="text-sm font-medium text-brand-ink-muted">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {variant === "oversized" && (
          <div className="brand-vibe-gap grid gap-10">
            {items.map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <p className="text-7xl md:text-9xl text-brand-ink brand-heading leading-none">
                  {s.value}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-brand-ink-subtle">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Testimonial ──────────────────────────────────────────────────────
export type TestimonialLayout = "centered" | "grid-3" | "carousel";
export type TestimonialItem = {
  quote: string;
  author: string;
  role: string;
  avatar: string;
};

export type TestimonialProps = {
  /** Optional. Defaults to "centered" so legacy sites render identically. */
  layout?: TestimonialLayout;
  /** Legacy single-quote fields — used by "centered" and as fallback first
   * item for "grid-3"/"carousel" when `items` is empty. */
  quote: string;
  author: string;
  role: string;
  avatar: string;
  /** Multi-quote support for grid-3 and carousel. */
  items?: TestimonialItem[];
};

export function TestimonialRender({ layout, quote, author, role, avatar, items }: TestimonialProps) {
  const variant: TestimonialLayout = layout ?? "centered";
  // Use new items array if present; otherwise the legacy top-level fields
  // act as the single item. Keeps existing JSON renderable unchanged.
  const allItems: TestimonialItem[] =
    items && items.length > 0
      ? items
      : [{ quote, author, role, avatar }];

  if (variant === "centered") {
    return (
      <section className="brand-section bg-brand-surface-dark px-6 py-24 md:py-32 text-brand-ink-inverse font-brand-body">
        <div className="mx-auto max-w-3xl text-center">
          <Quote className="mx-auto h-10 w-10 text-brand-accent-soft" />
          <blockquote
            className="mt-8 text-2xl md:text-3xl font-medium leading-relaxed text-brand-ink-inverse font-brand-heading"
            dangerouslySetInnerHTML={{ __html: allItems[0].quote }}
          />
          <div className="mt-10 flex flex-col items-center gap-3">
            {allItems[0].avatar && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={allItems[0].avatar}
                alt={allItems[0].author}
                className="h-14 w-14 rounded-full object-cover bg-brand-ink-subtle"
              />
            )}
            <div>
              <p className="text-base font-semibold text-brand-ink-inverse">{allItems[0].author}</p>
              <p className="text-sm text-brand-ink-inverse/60">{allItems[0].role}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "grid-3") {
    return (
      <section className="brand-section bg-brand-surface-dark px-6 py-24 md:py-28 text-brand-ink-inverse font-brand-body">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {allItems.map((it, i) => (
              <figure key={i} className="brand-card bg-brand-bg/5 p-6 backdrop-blur">
                <Quote className="h-6 w-6 text-brand-accent-soft" />
                <blockquote
                  className="mt-5 text-base leading-relaxed text-brand-ink-inverse font-brand-heading"
                  dangerouslySetInnerHTML={{ __html: it.quote }}
                />
                <figcaption className="mt-6 flex items-center gap-3">
                  {it.avatar && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={it.avatar}
                      alt={it.author}
                      className="h-10 w-10 rounded-full object-cover bg-brand-ink-subtle"
                    />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-brand-ink-inverse">{it.author}</p>
                    <p className="text-xs text-brand-ink-inverse/60">{it.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // carousel
  return (
    <section className="brand-section bg-brand-surface-dark px-6 py-24 md:py-28 text-brand-ink-inverse font-brand-body">
      <div className="mx-auto max-w-6xl">
        <TestimonialCarousel items={allItems} />
      </div>
    </section>
  );
}

// ─── ImageText (Split) ────────────────────────────────────────────────
export type ImageTextLayout = "image-left" | "image-right" | "stacked" | "card-overlay";

export type ImageTextProps = {
  title: string;
  content: string;
  image: string;
  imageAlt: string;
  /** Legacy field — when `layout` is undefined, maps "left"→"image-left",
   * "right"→"image-right". Editor will start writing `layout` on next save. */
  imagePosition?: "left" | "right";
  /** New canonical field. Defaults to "image-right" via `imagePosition`. */
  layout?: ImageTextLayout;
};

export function ImageTextRender({
  title,
  content,
  image,
  imageAlt,
  imagePosition,
  layout,
}: ImageTextProps) {
  const variant: ImageTextLayout =
    layout ?? (imagePosition === "left" ? "image-left" : "image-right");

  const placeholderClass = "w-full rounded-[var(--brand-radius-card)] bg-brand-surface";
  const imageNode = image ? (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={image}
      alt={imageAlt}
      className="w-full rounded-[var(--brand-radius-card)] object-cover shadow-md aspect-[4/3]"
    />
  ) : (
    <div className={`${placeholderClass} aspect-[4/3]`} />
  );

  const textNode = (
    <div>
      <h2 className="text-3xl md:text-4xl text-brand-ink brand-heading">{title}</h2>
      <div
        className="prose mt-4 max-w-none text-brand-ink-muted"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );

  if (variant === "stacked") {
    return (
      <section className="brand-section bg-brand-bg px-6 py-20 md:py-28 font-brand-body text-brand-ink">
        <div className="mx-auto max-w-4xl">
          {imageNode}
          <div className="mt-10">{textNode}</div>
        </div>
      </section>
    );
  }

  if (variant === "card-overlay") {
    const imageWideNode = image ? (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={image}
        alt={imageAlt}
        className="w-full rounded-[var(--brand-radius-card)] object-cover shadow-xl aspect-[16/9]"
      />
    ) : (
      <div className={`${placeholderClass} aspect-[16/9]`} />
    );
    return (
      <section className="brand-section bg-brand-bg px-6 py-20 md:py-28 font-brand-body text-brand-ink">
        <div className="mx-auto max-w-6xl">
          {imageWideNode}
          <div className="-mt-16 mx-auto max-w-2xl">
            <div className="brand-card bg-brand-bg p-8 md:p-10 shadow-2xl">
              {textNode}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // image-left or image-right
  const imageFirst = variant === "image-left";
  return (
    <section className="brand-section bg-brand-bg px-6 py-20 md:py-28 font-brand-body text-brand-ink">
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
      ? "bg-brand-surface-dark text-brand-ink-inverse"
      : theme === "gradient"
        ? "bg-gradient-to-r from-brand-accent to-brand-accent-2 text-brand-accent-fg"
        : "bg-brand-accent text-brand-accent-fg";
  const subtleClass = theme === "dark" ? "text-brand-ink-inverse/70" : "text-brand-accent-fg/85";
  return (
    <section className={`brand-section ${themeClass} px-6 py-20 md:py-28 font-brand-body`}>
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-5xl brand-heading">{title}</h2>
        <div
          className={`mx-auto mt-4 max-w-xl text-lg leading-relaxed ${subtleClass}`}
          dangerouslySetInnerHTML={{ __html: subtitle }}
        />
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          {ctaPrimaryLabel && (
            <a
              href={ctaPrimaryHref || "#"}
              className={`inline-flex items-center gap-2 rounded-[var(--brand-radius-button)] px-6 py-3 text-sm font-semibold shadow-lg transition ${
                theme === "dark"
                  ? "bg-brand-bg text-brand-ink hover:bg-brand-surface"
                  : "bg-brand-bg text-brand-accent hover:bg-brand-surface"
              }`}
            >
              <span>{ctaPrimaryLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
          {ctaSecondaryLabel && (
            <a
              href={ctaSecondaryHref || "#"}
              className="inline-flex items-center gap-2 rounded-[var(--brand-radius-button)] border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold backdrop-blur hover:bg-white/20 transition"
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
    <section className="brand-section bg-brand-bg px-6 py-16 md:py-20 font-brand-body text-brand-ink">
      <div className="mx-auto max-w-6xl">
        {intro && (
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-brand-ink-subtle">
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
              <span className="text-sm font-semibold text-brand-ink-subtle">{logo.name}</span>
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
    <section className="brand-section bg-brand-bg px-6 py-20 md:py-28 font-brand-body text-brand-ink">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="text-3xl md:text-5xl text-brand-ink brand-heading">{title}</h2>
          <div
            className="mt-4 text-lg text-brand-ink-muted"
            dangerouslySetInnerHTML={{ __html: subtitle }}
          />
        </div>
        <div className="mt-12 divide-y divide-brand-border border-y border-brand-border">
          {items.map((it, i) => (
            <details key={i} className="group py-5">
              <summary className="flex cursor-pointer items-start justify-between gap-4 list-none">
                <span className="text-base md:text-lg font-medium text-brand-ink">
                  {it.question}
                </span>
                <ChevronDown className="mt-1 h-5 w-5 flex-shrink-0 text-brand-ink-subtle transition-transform group-open:rotate-180" />
              </summary>
              <div
                className="prose mt-4 max-w-none text-brand-ink-muted"
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
    <section className="brand-section bg-brand-surface px-6 py-20 md:py-28 font-brand-body text-brand-ink">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-5xl text-brand-ink brand-heading">{title}</h2>
          <div
            className="mt-4 text-lg text-brand-ink-muted"
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
                  className="h-28 w-28 rounded-full object-cover bg-brand-border"
                />
              ) : (
                <div className="h-28 w-28 rounded-full bg-brand-border" />
              )}
              <h3 className="mt-5 text-lg font-semibold text-brand-ink font-brand-heading">{m.name}</h3>
              <p className="mt-1 text-sm font-medium text-brand-accent">{m.role}</p>
              <div
                className="mt-3 max-w-xs text-sm text-brand-ink-muted leading-relaxed"
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
export type PricingLayout = "cards-3" | "comparison-table" | "single-toggle";

export type PricingPlan = {
  icon: string;
  name: string;
  price: string;
  priceCaption: string;
  features: Array<{ value: string }>;
  ctaLabel: string;
  ctaHref: string;
  featured: boolean;
  /** Used by single-toggle. Falls back to `price` when absent. */
  priceMonthly?: string;
  priceYearly?: string;
  /** Used by comparison-table; parallel to `rowLabels`. */
  rowValues?: Array<{ value: string }>;
};

export type PricingProps = {
  title: string;
  subtitle: string;
  /** Optional. Defaults to "cards-3" so legacy sites render identically. */
  layout?: PricingLayout;
  /** Row labels for comparison-table layout. Ignored otherwise. */
  rowLabels?: Array<{ value: string }>;
  /** Configures the period toggle for single-toggle layout. */
  toggle?: {
    monthlyLabel: string;
    yearlyLabel: string;
    yearlyDiscountHint: string;
  };
  plans: Array<PricingPlan>;
};

export function PricingRender({ title, subtitle, layout, rowLabels, toggle, plans }: PricingProps) {
  const variant: PricingLayout = layout ?? "cards-3";

  return (
    <section className="brand-section bg-brand-surface px-6 py-20 md:py-28 font-brand-body text-brand-ink">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-5xl text-brand-ink brand-heading">{title}</h2>
          <div
            className="mt-4 text-lg text-brand-ink-muted"
            dangerouslySetInnerHTML={{ __html: subtitle }}
          />
        </div>

        {variant === "cards-3" && (
          <div className="mt-14 grid items-stretch gap-6 md:grid-cols-3 md:gap-8">
            {plans.map((plan, i) => {
              const Icon = PLAN_ICONS[plan.icon] ?? Sparkles;
              return (
                <div
                  key={i}
                  className={`relative flex flex-col bg-brand-bg p-7 ${
                    plan.featured
                      ? "rounded-[var(--brand-radius-card)] border-2 border-brand-accent ring-1 ring-brand-accent shadow-xl shadow-brand-accent/10 md:scale-[1.03]"
                      : "brand-card"
                  }`}
                >
                  {plan.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-brand-accent-fg shadow-md">
                      Empfohlen
                    </span>
                  )}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                        plan.featured ? "bg-brand-accent text-brand-accent-fg" : "bg-brand-surface text-brand-ink-muted"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-semibold text-brand-ink font-brand-heading">{plan.name}</h3>
                  </div>
                  <div className="mt-6">
                    <p className="text-4xl md:text-5xl text-brand-ink brand-heading">{plan.price}</p>
                    <p
                      className={`mt-2 text-sm font-medium ${
                        plan.featured ? "text-brand-accent" : "text-brand-ink-muted"
                      }`}
                    >
                      {plan.priceCaption}
                    </p>
                  </div>
                  <ul className="mt-8 space-y-3 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-brand-ink-muted">
                        <Check
                          className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                            plan.featured ? "text-brand-accent" : "text-brand-ink-subtle"
                          }`}
                        />
                        <span className="leading-relaxed">{f.value}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={plan.ctaHref || "#"}
                    className={`mt-10 inline-flex items-center justify-center rounded-[var(--brand-radius-button)] px-6 py-3 text-sm font-semibold transition ${
                      plan.featured
                        ? "bg-brand-accent text-brand-accent-fg shadow-lg shadow-brand-accent/20 hover:bg-brand-accent-hover"
                        : "bg-brand-ink text-brand-ink-inverse hover:bg-brand-ink/90"
                    }`}
                  >
                    <span>{plan.ctaLabel}</span>
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {variant === "comparison-table" && (
          <div className="mt-14 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="w-1/4 border-b border-brand-border p-4 text-sm font-semibold uppercase tracking-widest text-brand-ink-subtle">
                    Features
                  </th>
                  {plans.map((plan, i) => (
                    <th
                      key={i}
                      className={`border-b border-brand-border p-4 text-center align-bottom ${
                        plan.featured ? "bg-brand-accent/5 ring-1 ring-brand-accent" : ""
                      }`}
                    >
                      <div className="text-xl font-semibold text-brand-ink font-brand-heading">{plan.name}</div>
                      <div className="mt-2 text-3xl text-brand-ink brand-heading">{plan.price}</div>
                      <div className="mt-1 text-xs text-brand-ink-muted">{plan.priceCaption}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(rowLabels ?? []).map((row, r) => (
                  <tr key={r}>
                    <td className="border-b border-brand-border p-4 text-sm font-medium text-brand-ink">
                      {row.value}
                    </td>
                    {plans.map((plan, c) => {
                      const cell = plan.rowValues?.[r]?.value ?? "—";
                      return (
                        <td
                          key={c}
                          className={`border-b border-brand-border p-4 text-center text-sm text-brand-ink-muted ${
                            plan.featured ? "bg-brand-accent/5" : ""
                          }`}
                        >
                          {cell === "true" || cell === "✓" ? (
                            <Check className="mx-auto h-5 w-5 text-brand-accent" />
                          ) : (
                            cell
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="p-4" />
                  {plans.map((plan, i) => (
                    <td
                      key={i}
                      className={`p-4 text-center ${plan.featured ? "bg-brand-accent/5" : ""}`}
                    >
                      <a
                        href={plan.ctaHref || "#"}
                        className={`inline-flex items-center justify-center rounded-[var(--brand-radius-button)] px-5 py-2.5 text-sm font-semibold transition ${
                          plan.featured
                            ? "bg-brand-accent text-brand-accent-fg hover:bg-brand-accent-hover"
                            : "bg-brand-ink text-brand-ink-inverse hover:bg-brand-ink/90"
                        }`}
                      >
                        {plan.ctaLabel}
                      </a>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {variant === "single-toggle" && (() => {
          const plan = plans.find((p) => p.featured) ?? plans[0];
          if (!plan) return null;
          const t = toggle ?? {
            monthlyLabel: "Monatlich",
            yearlyLabel: "Jährlich",
            yearlyDiscountHint: "",
          };
          return (
            <PricingToggle
              plan={{
                icon: plan.icon,
                name: plan.name,
                priceMonthly: plan.priceMonthly ?? plan.price,
                priceYearly: plan.priceYearly ?? plan.price,
                priceCaption: plan.priceCaption,
                features: plan.features,
                ctaLabel: plan.ctaLabel,
                ctaHref: plan.ctaHref,
              }}
              toggle={t}
            />
          );
        })()}
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
    <footer className="brand-section bg-brand-surface-dark px-6 py-14 text-brand-ink-inverse/80 font-brand-body">
      <div className="mx-auto max-w-6xl">
        {hasColumns && (
          <div className="grid gap-10 pb-12 md:grid-cols-4 md:gap-12 border-b border-brand-ink-inverse/10">
            {columns.map((col, i) => (
              <div key={i}>
                <h4 className="text-sm font-semibold uppercase tracking-widest text-brand-ink-inverse font-brand-heading">
                  {col.heading}
                </h4>
                <ul className="mt-4 space-y-2">
                  {col.links.map((l, j) => (
                    <li key={j}>
                      <a href={l.href || "#"} className="text-sm hover:text-brand-ink-inverse transition">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <div className={`flex flex-col items-center justify-between gap-3 text-sm text-brand-ink-inverse/70 sm:flex-row ${hasColumns ? "pt-8" : ""}`}>
          <p>{copyright}</p>
          {tagline && <p className="text-brand-ink-inverse/50">{tagline}</p>}
        </div>
      </div>
    </footer>
  );
}
