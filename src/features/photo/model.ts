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
