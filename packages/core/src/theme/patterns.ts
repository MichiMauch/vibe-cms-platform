import type { BgPattern, DividerKind } from "./tokens";

/** Inline SVG data-URLs for background patterns. Kept small and currentColor-
 * friendly where possible so the renderer can tint them per-site. */

const enc = (svg: string): string =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}")`;

const BLOB_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <radialGradient id='g1' cx='20%' cy='30%' r='60%'>
      <stop offset='0%' stop-color='%238b5cf6' stop-opacity='0.35'/>
      <stop offset='100%' stop-color='%238b5cf6' stop-opacity='0'/>
    </radialGradient>
    <radialGradient id='g2' cx='85%' cy='80%' r='55%'>
      <stop offset='0%' stop-color='%2306b6d4' stop-opacity='0.32'/>
      <stop offset='100%' stop-color='%2306b6d4' stop-opacity='0'/>
    </radialGradient>
  </defs>
  <rect width='100%' height='100%' fill='url(%23g1)'/>
  <rect width='100%' height='100%' fill='url(%23g2)'/>
</svg>`;

const NOISE_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>
  <filter id='n'>
    <feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/>
    <feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.12 0'/>
  </filter>
  <rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/>
</svg>`;

const RAYS_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <radialGradient id='r' cx='50%' cy='100%' r='90%'>
      <stop offset='0%' stop-color='%23fbbf24' stop-opacity='0.45'/>
      <stop offset='35%' stop-color='%23f97316' stop-opacity='0.22'/>
      <stop offset='100%' stop-color='%23f97316' stop-opacity='0'/>
    </radialGradient>
  </defs>
  <rect width='100%' height='100%' fill='url(%23r)'/>
</svg>`;

const DOT_GRID_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'>
  <circle cx='1.5' cy='1.5' r='1' fill='%23000' fill-opacity='0.18'/>
</svg>`;

export const BG_PATTERN_URLS: Record<BgPattern, string> = {
  none: "none",
  blob: enc(BLOB_SVG),
  noise: enc(NOISE_SVG),
  rays: enc(RAYS_SVG),
  "dot-grid": enc(DOT_GRID_SVG),
};

// Mask for wave divider — used as mask-image on a coloured strip.
// Path drawn so the top edge is wavy and the area below the wave is opaque.
const WAVE_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 100' preserveAspectRatio='none'>
  <path d='M0,60 C300,20 600,100 900,50 C1050,25 1150,55 1200,40 L1200,100 L0,100 Z' fill='black'/>
</svg>`;

export const DIVIDER_MASK_URLS: Partial<Record<DividerKind, string>> = {
  wave: enc(WAVE_SVG),
};
