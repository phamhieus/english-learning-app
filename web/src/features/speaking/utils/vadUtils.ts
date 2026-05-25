/**
 * Calculates the Root Mean Square (RMS) energy of an audio buffer.
 */
export function calculateRms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sumSquare = 0;
  for (let i = 0; i < samples.length; i++) {
    sumSquare += samples[i] * samples[i];
  }
  return Math.sqrt(sumSquare / samples.length);
}

/**
 * Checks if speech is present based on a simple RMS energy threshold.
 * 
 * TODO: Replace with Silero VAD browser WASM or a backend streaming VAD service later 
 * to handle background noise, breathing, and non-speech sounds accurately.
 * 
 * @param samples Float32Array PCM samples
 * @param threshold RMS threshold (e.g., 0.015 - 0.04)
 */
export function isSpeechByEnergy(
  samples: Float32Array,
  threshold: number = 0.02
): boolean {
  const rms = calculateRms(samples);
  return rms > threshold;
}
