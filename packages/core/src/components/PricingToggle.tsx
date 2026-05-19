"use client";

import { useState } from "react";

export type PricingTogglePlan = {
  icon: string;
  name: string;
  priceMonthly: string;
  priceYearly: string;
  priceCaption: string;
  features: Array<{ value: string }>;
  ctaLabel: string;
  ctaHref: string;
};

export function PricingToggle({
  plan,
  toggle,
}: {
  plan: PricingTogglePlan;
  toggle: { monthlyLabel: string; yearlyLabel: string; yearlyDiscountHint: string };
}) {
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const price = period === "monthly" ? plan.priceMonthly : plan.priceYearly;
  return (
    <div className="mx-auto mt-14 max-w-md">
      <div className="mx-auto mb-8 inline-flex w-full max-w-xs items-center justify-center gap-1 rounded-[var(--brand-radius-button)] border border-brand-border bg-brand-bg p-1">
        <button
          type="button"
          onClick={() => setPeriod("monthly")}
          className={`flex-1 rounded-[var(--brand-radius-button)] px-4 py-2 text-sm font-semibold transition ${
            period === "monthly"
              ? "bg-brand-ink text-brand-ink-inverse"
              : "text-brand-ink-muted hover:text-brand-ink"
          }`}
        >
          {toggle.monthlyLabel}
        </button>
        <button
          type="button"
          onClick={() => setPeriod("yearly")}
          className={`flex-1 rounded-[var(--brand-radius-button)] px-4 py-2 text-sm font-semibold transition ${
            period === "yearly"
              ? "bg-brand-ink text-brand-ink-inverse"
              : "text-brand-ink-muted hover:text-brand-ink"
          }`}
        >
          {toggle.yearlyLabel}
        </button>
      </div>
      {period === "yearly" && toggle.yearlyDiscountHint && (
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-brand-accent">
          {toggle.yearlyDiscountHint}
        </p>
      )}
      <div className="brand-card relative flex flex-col bg-brand-bg p-8">
        <h3 className="text-2xl font-semibold text-brand-ink font-brand-heading">{plan.name}</h3>
        <div className="mt-6">
          <p className="text-5xl text-brand-ink brand-heading">{price}</p>
          <p className="mt-2 text-sm font-medium text-brand-ink-muted">{plan.priceCaption}</p>
        </div>
        <ul className="mt-8 space-y-3 flex-1">
          {plan.features.map((f, j) => (
            <li key={j} className="flex items-start gap-2 text-sm text-brand-ink-muted">
              <span aria-hidden className="mt-0.5 inline-block h-4 w-4 flex-shrink-0 rounded-full bg-brand-accent-soft" />
              <span className="leading-relaxed">{f.value}</span>
            </li>
          ))}
        </ul>
        <a
          href={plan.ctaHref || "#"}
          className="mt-10 inline-flex items-center justify-center rounded-[var(--brand-radius-button)] bg-brand-accent px-6 py-3 text-sm font-semibold text-brand-accent-fg shadow-lg shadow-brand-accent/20 transition hover:bg-brand-accent-hover"
        >
          <span>{plan.ctaLabel}</span>
        </a>
      </div>
    </div>
  );
}
