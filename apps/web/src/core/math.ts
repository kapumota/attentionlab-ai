// Funciones matemáticas pequeñas y reutilizables.

export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function stableSoftmax(row: number[]): number[] {
  const finiteValues = row.filter(Number.isFinite);
  const maxValue = finiteValues.length > 0 ? Math.max(...finiteValues) : 0;
  const exps = row.map((value) => (Number.isFinite(value) ? Math.exp(value - maxValue) : 0));
  const sum = exps.reduce((acc, value) => acc + value, 0);
  return exps.map((value) => (sum === 0 ? 0 : value / sum));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
