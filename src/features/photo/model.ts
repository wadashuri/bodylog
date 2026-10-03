export type PhotoEntry = {
  date: string;
  fileName: string;
  thumbName: string;
  createdAt: number;
};
export function photoForDate(
  photos: PhotoEntry[],
  date: string,
): PhotoEntry | undefined {
  return photos.find((p) => p.date === date);
}
export type PhotoFilter =
  | { mode: "all" }
  | { mode: "year"; year: string }
  | { mode: "month"; yearMonth: string };
export function photoYears(photos: PhotoEntry[]): string[] {
  const years = new Set(photos.map((p) => p.date.slice(0, 4)));
  return Array.from(years).sort((a, b) => b.localeCompare(a));
}
export function photoYearMonths(photos: PhotoEntry[]): string[] {
  const months = new Set(photos.map((p) => p.date.slice(0, 7)));
  return Array.from(months).sort((a, b) => b.localeCompare(a));
}
export function filterPhotos(
  photos: PhotoEntry[],
  filter: PhotoFilter,
): PhotoEntry[] {
  const sorted = [...photos].sort((a, b) => a.date.localeCompare(b.date));
  if (filter.mode === "year")
    return sorted.filter((p) => p.date.startsWith(filter.year));
  if (filter.mode === "month")
    return sorted.filter((p) => p.date.startsWith(filter.yearMonth));
  return sorted;
}
