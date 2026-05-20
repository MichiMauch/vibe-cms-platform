"use client";

/** Per-vibe JSX decorations dropped at known anchor points (Hero corner,
 * headline underline, eyebrow prefix, background confetti). For unmatched
 * vibes each kind returns null (or passes children through unchanged in
 * the wrapping case), so legacy vibes get zero extra DOM. */

import type { ReactNode } from "react";
import { useVibe } from "../theme/vibe-context";

export type FlourishKind =
  | "hero-corner"
  | "headline-underline"
  | "background-confetti"
  | "eyebrow-prefix";

export function VibeFlourish({
  kind,
  children,
}: {
  kind: FlourishKind;
  /** Only used by wrapping kinds (eyebrow-prefix). */
  children?: ReactNode;
}) {
  const vibe = useVibe();
  switch (kind) {
    case "hero-corner":
      return <HeroCorner vibe={vibe} />;
    case "headline-underline":
      return <HeadlineUnderline vibe={vibe} />;
    case "background-confetti":
      return <BackgroundConfetti vibe={vibe} />;
    case "eyebrow-prefix":
      return <EyebrowPrefix vibe={vibe}>{children}</EyebrowPrefix>;
  }
}

function HeroCorner({ vibe }: { vibe: string | null }) {
  if (vibe === "brutal") {
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute top-6 right-6 z-10 rotate-12 bg-brand-accent px-3 py-1.5 border-2 border-brand-ink shadow-[4px_4px_0_0_var(--brand-ink)] font-brand-heading text-sm font-extrabold uppercase tracking-wider text-brand-accent-fg"
      >
        Neu!
      </span>
    );
  }
  if (vibe === "playful") {
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute top-8 right-10 z-10 animate-pulse"
      >
        <svg width="56" height="56" viewBox="0 0 48 48" fill="none">
          <path
            d="M24 4 L28 20 L44 24 L28 28 L24 44 L20 28 L4 24 L20 20 Z"
            fill="var(--brand-accent)"
          />
        </svg>
      </span>
    );
  }
  if (vibe === "editorial") {
    return (
      <span
        aria-hidden
        className="pointer-events-none absolute top-8 right-8 z-10 border-y-2 border-brand-ink px-3 py-1 font-brand-heading text-[11px] uppercase tracking-[0.2em] text-brand-ink"
      >
        Issue 01
      </span>
    );
  }
  return null;
}

function HeadlineUnderline({ vibe }: { vibe: string | null }) {
  if (vibe !== "organic") return null;
  return (
    <svg
      aria-hidden
      className="mt-3 h-3 w-40 text-brand-accent"
      viewBox="0 0 160 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M2 8 Q 14 2, 28 6 T 56 6 T 84 6 T 112 6 T 140 6 T 158 6" />
    </svg>
  );
}

function BackgroundConfetti({ vibe }: { vibe: string | null }) {
  if (vibe !== "playful") return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 opacity-70 select-none"
    >
      <span className="absolute left-[8%] top-[18%] text-2xl rotate-12 text-brand-accent">✦</span>
      <span className="absolute right-[14%] top-[28%] text-3xl -rotate-6 text-brand-accent-2">●</span>
      <span className="absolute left-[18%] bottom-[22%] text-xl rotate-45 text-brand-accent">▲</span>
      <span className="absolute right-[8%] bottom-[14%] text-2xl rotate-12 text-brand-accent-2">✦</span>
      <span className="absolute left-[42%] top-[8%] text-lg text-brand-accent">●</span>
    </div>
  );
}

function EyebrowPrefix({
  vibe,
  children,
}: {
  vibe: string | null;
  children?: ReactNode;
}) {
  if (vibe === "tech") {
    return (
      <>
        <span className="font-mono text-brand-accent">[</span>
        {children}
        <span className="font-mono text-brand-accent">]</span>
      </>
    );
  }
  if (vibe === "brutal") {
    return (
      <>
        <span className="font-mono">{">>>"}&nbsp;</span>
        {children}
      </>
    );
  }
  return <>{children}</>;
}
