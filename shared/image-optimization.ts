/** Avoid storing another lossy version for a negligible reduction. */
export function worthwhileImageSavings(originalBytes: number, optimizedBytes: number) {
  return optimizedBytes > 0 && optimizedBytes <= originalBytes * 0.9 && originalBytes - optimizedBytes >= 2048
}
