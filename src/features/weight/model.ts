export type Unit = "kg" | "lb";
export type WeightEntry = {
  id: string;
  date: string;
  weightKg: number;
  createdAt: number;
};
export type Period = "30" | "90" | "all";
export const LB_PER_KG = 2.2046226218;
export function formatWeightDigits(digits: string): string {
  return digits ? (Number(digits) / 10).toFixed(1) : "";
}
export function weightDigits(kg: number, unit: Unit): string {
  return String(Math.round(displayWeight(kg, unit) * 10));
}
export function recordingStreak(
  entries: WeightEntry[],
  today = localDate(),
): number {
  const dates = new Set(entries.map((e) => e.date));
  const cursor = dateObject(today);
  if (!dates.has(today)) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (dates.has(localDate(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function dateObject(date: string): Date {
  return new Date(`${date}T12:00:00`);
}
export function displayWeight(kg: number, unit: Unit): number {
  return kg * (unit === "lb" ? LB_PER_KG : 1);
}
export function parseWeight(value: string, unit: Unit): number | null {
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(value)) return null;
  const kg = Number(value) / (unit === "lb" ? LB_PER_KG : 1);
  return Number.isFinite(kg) && kg >= 20 && kg <= 350
    ? Math.round(kg * 10000) / 10000
    : null;
}
export function periodEntries(
  entries: WeightEntry[],
  period: Period,
  today = localDate(),
): WeightEntry[] {
  if (period === "all") return entries;
  const start = dateObject(today);
  start.setDate(start.getDate() - Number(period) + 1);
  return entries.filter((e) => e.date >= localDate(start) && e.date <= today);
}
export function prettyDate(date: string): string {
  return dateObject(date).toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}
export function toWeightCsv(entries: WeightEntry[]): string {
  const rows = entries.map((e) => `${e.date},${e.weightKg.toFixed(1)}`);
  return ["日付,体重 [kg]", ...rows].join("\n");
}
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      out.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out;
}
function parseCsvDate(raw: string): string | null {
  const value = raw.trim();
  const match =
    value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/) ??
    value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const check = new Date(y, m - 1, d);
  if (
    check.getFullYear() !== y ||
    check.getMonth() !== m - 1 ||
    check.getDate() !== d
  )
    return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
export type CsvImportResult = {
  entries: { date: string; weightKg: number }[];
  skipped: number;
};
// 他アプリ(シンプルダイエット・プロ生ちゃん体重管理など)のCSV書き出しを
// ヘッダー名から探して読み込めるよう、列順を固定しない。
export function parseWeightCsv(text: string): CsvImportResult {
  const lines = text
    .split(/\r\n|\r|\n/)
    .filter((line) => line.trim().length > 0);
  if (lines.length < 2) return { entries: [], skipped: 0 };
  const header = splitCsvLine(lines[0]);
  const dateCol = header.findIndex((h) => /日時|日付|date/i.test(h));
  const weightCol = header.findIndex((h) => /体重|weight/i.test(h));
  if (dateCol === -1 || weightCol === -1)
    return { entries: [], skipped: lines.length - 1 };
  const byDate = new Map<string, number>();
  let skipped = 0;
  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line);
    const date = parseCsvDate(cols[dateCol] ?? "");
    const weightKg = Number((cols[weightCol] ?? "").trim());
    if (
      !date ||
      !Number.isFinite(weightKg) ||
      weightKg < 20 ||
      weightKg > 350
    ) {
      skipped++;
      continue;
    }
    byDate.set(date, Math.round(weightKg * 10) / 10);
  }
  const entries = Array.from(byDate, ([date, weightKg]) => ({
    date,
    weightKg,
  })).sort((a, b) => a.date.localeCompare(b.date));
  return { entries, skipped };
}
