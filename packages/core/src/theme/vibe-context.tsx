"use client";

/** React context for propagating the active vibe (theme preset id) into
 * block render functions. Mounted at the wrapper that already carries
 * `data-vibe="<id>"`; consumed by `useLayoutDefault()` so blocks can pick
 * the per-vibe default layout when their `layout` prop is unset/"auto". */

import { createContext, useContext, type ReactNode } from "react";
import { resolvePreset, type ThemePresetId, type BlockName } from "./presets";

const VibeContext = createContext<ThemePresetId | null>(null);

export function VibeProvider({
  value,
  children,
}: {
  value: ThemePresetId | null;
  children: ReactNode;
}) {
  return <VibeContext.Provider value={value}>{children}</VibeContext.Provider>;
}

export function useVibe(): ThemePresetId | null {
  return useContext(VibeContext);
}

/** Returns the per-vibe default for a given block, falling back to the
 * caller-provided value if no vibe is active or the preset doesn't opt in. */
export function useLayoutDefault<T extends string>(
  block: BlockName,
  fallback: T,
): T {
  const vibe = useContext(VibeContext);
  if (!vibe) return fallback;
  const def = resolvePreset(vibe).layoutDefaults?.[block];
  return (def as T | undefined) ?? fallback;
}
