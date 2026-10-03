import test from "node:test";
import assert from "node:assert/strict";
import { photoForDate, type PhotoEntry } from "../src/features/photo/model";
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
