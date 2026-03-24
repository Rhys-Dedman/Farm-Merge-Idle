export function formatCompactNumber(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  const units: { threshold: number; suffix: string }[] = [
    { threshold: 1e12, suffix: 't' },
    { threshold: 1e9, suffix: 'b' },
    { threshold: 1e6, suffix: 'm' },
    { threshold: 1e3, suffix: 'k' },
  ];

  for (const u of units) {
    if (abs >= u.threshold) {
      const n = abs / u.threshold;
      const rounded = n >= 100 ? Math.round(n) : Number(n.toFixed(1));
      return `${sign}${rounded}${u.suffix}`;
    }
  }

  return `${sign}${Math.floor(abs)}`;
}
