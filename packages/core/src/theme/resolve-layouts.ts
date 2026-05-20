/** Server-renderable transform: walks the Puck content tree and rewrites
 * any block whose `layout` is "auto" (or missing) to the vibe's preferred
 * default. Called at the render-site level (tenant + editor) BEFORE the
 * data reaches `<Render>` / `<Puck>`, so block render functions never need
 * to call hooks. Keeping blocks server-renderable avoids the RSC boundary
 * issue where Puck's `<Render>` from `@puckeditor/core/rsc` passes
 * function props (`renderDropZone`, `dragRef`, …) that can't cross into a
 * client component.
 *
 * Pure: returns a new tree, doesn't mutate the input. Idempotent: blocks
 * with concrete layouts pass through unchanged. Cheap: shallow per-block
 * copy, no deep clone of arrays/objects we don't touch. */

import { resolvePreset, type BlockName, type ThemePresetId } from "./presets";

type AnyBlock = { type?: string; props?: Record<string, unknown> };
type AnyTree = {
  content?: AnyBlock[];
  [k: string]: unknown;
};

/** Block-type → which prop holds the layout. Hero nests it inside
 * `layout.layout` for legacy reasons; the others use a flat `layout`. */
const LAYOUT_PATH: Record<BlockName, "flat" | "nested-hero"> = {
  Hero: "nested-hero",
  FeaturesGrid: "flat",
  Pricing: "flat",
  Testimonial: "flat",
  Stats: "flat",
  ImageText: "flat",
};

function resolveBlock(block: AnyBlock, vibeId: ThemePresetId | null): AnyBlock {
  if (!vibeId || !block.type || !(block.type in LAYOUT_PATH)) return block;
  const preset = resolvePreset(vibeId);
  const blockName = block.type as BlockName;
  const def = preset.layoutDefaults?.[blockName];
  if (!def) return block;

  const path = LAYOUT_PATH[blockName];
  const props = block.props ?? {};

  if (path === "flat") {
    const current = props.layout;
    if (current === "auto" || current === undefined || current === null) {
      return { ...block, props: { ...props, layout: def } };
    }
    return block;
  }

  // nested-hero: props.layout = { layout: "auto", density: "default" }
  const layoutGroup = (props.layout as { layout?: unknown; density?: unknown } | undefined) ?? {};
  const current = layoutGroup.layout;
  if (current === "auto" || current === undefined || current === null) {
    return {
      ...block,
      props: {
        ...props,
        layout: { ...layoutGroup, layout: def },
      },
    };
  }
  return block;
}

export function resolveAutoLayouts<T extends AnyTree>(
  data: T,
  vibeId: ThemePresetId | null | undefined,
): T {
  if (!vibeId || !Array.isArray(data.content)) return data;
  const next = data.content.map((b) => resolveBlock(b, vibeId));
  // Cheap optimization: if every block is referentially unchanged, return
  // the original tree to keep React props stable.
  const dirty = next.some((b, i) => b !== data.content![i]);
  if (!dirty) return data;
  return { ...data, content: next };
}
