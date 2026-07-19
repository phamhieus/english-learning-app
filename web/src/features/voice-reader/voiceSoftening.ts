// Softening applied on top of the user's audio settings so the built-in
// Web Speech voices sound warmer and less piercing at full volume.
// Applied by every Voice Reader utterance and the Settings preview so what
// the user hears in practice matches the preview.

/** Slightly deeper than the user's configured pitch — warms up the voice. */
export const SOFT_PITCH_SCALE = 0.94;

/** Full volume (1.0) is where Web Speech voices start to sound harsh. */
export const SOFT_VOLUME = 0.85;

export function softenedPitch(userPitch: number): number {
  return Math.min(2, Math.max(0, userPitch * SOFT_PITCH_SCALE));
}
