/** Calculates Root Mean Square energy from byte time-domain data [0,255]. */
export function calculateRMS(dataArray: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const normalized = (dataArray[i] - 128) / 128;
    sum += normalized * normalized;
  }
  return Math.sqrt(sum / dataArray.length);
}

/**
 * Samples the analyser for `durationMs` to establish ambient noise floor.
 * Returns average RMS so we can set thresholds relative to real environment.
 */
export function calibrateNoiseFloor(
  analyser: AnalyserNode,
  durationMs: number
): Promise<number> {
  return new Promise((resolve) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const sampleIntervalMs = 50;
    const totalSamples = Math.max(1, Math.floor(durationMs / sampleIntervalMs));
    const samples: number[] = [];

    const timerId = setInterval(() => {
      analyser.getByteTimeDomainData(dataArray);
      samples.push(calculateRMS(dataArray));

      if (samples.length >= totalSamples) {
        clearInterval(timerId);
        const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
        resolve(avg);
      }
    }, sampleIntervalMs);
  });
}
