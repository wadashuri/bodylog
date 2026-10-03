import test from "node:test";
import assert from "node:assert/strict";
import {
  filterPhotos,
  photoForDate,
  photoYearMonths,
  photoYears,
  type PhotoEntry,
} from "../src/features/photo/model";
const photos: PhotoEntry[] = [
  {
    date: "2026-09-30",
    fileName: "2026-09-30.jpg",
    thumbName: "2026-09-30.jpg",
    createdAt: 1,
  },
  {
    date: "2026-10-01",
    fileName: "2026-10-01.jpg",
    thumbName: "2026-10-01.jpg",
    createdAt: 2,
  },
];
test("日付が一致する写真を返す", () => {
  assert.equal(photoForDate(photos, "2026-10-01"), photos[1]);
});
test("一致する写真が無ければundefinedを返す", () => {
  assert.equal(photoForDate(photos, "2026-10-02"), undefined);
  assert.equal(photoForDate([], "2026-10-01"), undefined);
});
const crossYear: PhotoEntry[] = [
  ...photos,
  { date: "2025-12-05", fileName: "a.jpg", thumbName: "a.jpg", createdAt: 3 },
];
test("年の一覧を重複なく新しい順に返す", () => {
  assert.deepEqual(photoYears(crossYear), ["2026", "2025"]);
  assert.deepEqual(photoYears([]), []);
});
test("年月の一覧を重複なく新しい順に返す", () => {
  assert.deepEqual(photoYearMonths(crossYear), [
    "2026-10",
    "2026-09",
    "2025-12",
  ]);
});
test("全て・年・月で絞り込み、日付昇順で返す", () => {
  assert.deepEqual(
    filterPhotos(crossYear, { mode: "all" }).map((p) => p.date),
    ["2025-12-05", "2026-09-30", "2026-10-01"],
  );
  assert.deepEqual(
    filterPhotos(crossYear, { mode: "year", year: "2026" }).map((p) => p.date),
    ["2026-09-30", "2026-10-01"],
  );
  assert.deepEqual(
    filterPhotos(crossYear, { mode: "month", yearMonth: "2025-12" }).map(
      (p) => p.date,
    ),
    ["2025-12-05"],
  );
});
