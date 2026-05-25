/**
 * Downsamples/resamples PCM Float32Array samples to target rate using linear interpolation.
 */
export function resamplePcm(
  inputSamples: Float32Array,
  inputSampleRate: number,
  targetSampleRate: number = 16000
): Float32Array {
  if (inputSampleRate === targetSampleRate || inputSampleRate <= 0) {
    return inputSamples;
  }
  
  const ratio = inputSampleRate / targetSampleRate;
  const newLength = Math.floor(inputSamples.length / ratio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const originalIndex = i * ratio;
    const indexBelow = Math.floor(originalIndex);
    const indexAbove = Math.min(inputSamples.length - 1, indexBelow + 1);
    const weight = originalIndex - indexBelow;
    
    const valBelow = inputSamples[indexBelow];
    const valAbove = inputSamples[indexAbove];
    
    result[i] = valBelow + weight * (valAbove - valBelow);
  }
  
  return result;
}

/**
 * Converts a Float32Array (range -1.0 to 1.0) to a 16-bit Signed Integer PCM ArrayBuffer.
 * Useful for legacy providers or specific binary protocols.
 */
export function float32ToInt16(samples: Float32Array): Int16Array {
  const output = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}
