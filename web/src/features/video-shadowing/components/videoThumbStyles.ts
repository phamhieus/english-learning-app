// Gradient palette for the faux "video frame" thumbnails (no external assets).
// Shared between VideoThumb and the VOA resolver so manifest `grad` keys stay valid.

export const GRADS = {
  indigo: 'linear-gradient(135deg,#818cf8,#6366f1 55%,#4f46e5)',
  violet: 'linear-gradient(135deg,#c084fc,#a855f7 55%,#7c3aed)',
  cyan: 'linear-gradient(135deg,#67e8f9,#22d3ee 55%,#0891b2)',
  blue: 'linear-gradient(135deg,#7dd3fc,#38bdf8 55%,#2563eb)',
  rose: 'linear-gradient(135deg,#fda4af,#fb7185 55%,#e11d48)',
  amber: 'linear-gradient(135deg,#fcd34d,#fbbf24 55%,#f59e0b)',
  emerald: 'linear-gradient(135deg,#6ee7b7,#34d399 55%,#059669)',
  teal: 'linear-gradient(135deg,#5eead4,#2dd4bf 55%,#0d9488)',
} as const;

export type GradKey = keyof typeof GRADS;

/** Deterministic gradient for user uploads (no curated colour). */
export function gradForId(id: string): GradKey {
  const keys = Object.keys(GRADS) as GradKey[];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return keys[hash % keys.length];
}
