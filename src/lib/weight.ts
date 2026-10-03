export type Unit = 'kg' | 'lb';
export type WeightEntry = { id: string; date: string; weightKg: number; createdAt: number };
export type Period = '30' | '90' | 'all';
export const LB_PER_KG = 2.2046226218;
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function dateObject(date: string): Date { return new Date(`${date}T12:00:00`); }
export function displayWeight(kg: number, unit: Unit): number { return kg * (unit === 'lb' ? LB_PER_KG : 1); }
export function parseWeight(value: string, unit: Unit): number | null {
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(value)) return null;
  const kg = Number(value) / (unit === 'lb' ? LB_PER_KG : 1);
  return Number.isFinite(kg) && kg >= 20 && kg <= 350 ? Math.round(kg * 10000) / 10000 : null;
}
export function periodEntries(entries: WeightEntry[], period: Period, today = localDate()): WeightEntry[] {
  if (period === 'all') return entries;
  const start = dateObject(today);
  start.setDate(start.getDate() - Number(period) + 1);
  return entries.filter(e => e.date >= localDate(start) && e.date <= today);
}
export function prettyDate(date: string): string {
  return dateObject(date).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });
}
