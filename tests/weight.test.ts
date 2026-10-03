import test from "node:test";
import assert from "node:assert/strict";
import {
  dateObject,
  localDate,
  parseWeight,
  displayWeight,
  periodEntries,
  formatWeightDigits,
  weightDigits,
  recordingStreak,
  prettyDate,
} from "../src/features/weight/model";
test("数字だけの入力に小数点を自動で入れ、削除でも桁を戻す", () => {
  assert.equal(formatWeightDigits(""), "");
  assert.equal(formatWeightDigits("7"), "0.7");
  assert.equal(formatWeightDigits("72"), "7.2");
  assert.equal(formatWeightDigits("726"), "72.6");
  assert.equal(formatWeightDigits("1000"), "100.0");
  assert.equal(weightDigits(72.6, "kg"), "726");
});
test("日付はUTCでなく端末のカレンダー日を使う", () => {
  assert.equal(localDate(new Date(2026, 9, 3, 0, 5)), "2026-10-03");
  assert.equal(localDate(dateObject("2026-10-03")), "2026-10-03");
});
test("不正値を拒否し、lbをkgに変換する", () => {
  for (const value of ["", ".", "NaN", "-1", "0", "351", "70.123", "1e2"])
    assert.equal(parseWeight(value, "kg"), null);
  assert.equal(parseWeight("70.5", "kg"), 70.5);
  const converted = parseWeight("154.32", "lb");
  assert.ok(converted !== null);
  assert.ok(Math.abs(converted - 70) < 0.01);
  assert.ok(Math.abs(displayWeight(70, "lb") - 154.3236) < 0.001);
});
function entriesFor(dates: string[]) {
  return dates.map((date, i) => ({
    id: String(i),
    date,
    weightKg: 70,
    createdAt: 0,
  }));
}
test("体重の上下限とlbの表示桁を守る", () => {
  assert.equal(parseWeight("20", "kg"), 20);
  assert.equal(parseWeight("350", "kg"), 350);
  assert.equal(parseWeight("19.9", "kg"), null);
  assert.equal(parseWeight("350.1", "kg"), null);
  assert.equal(parseWeight("44", "lb"), null);
  assert.equal(weightDigits(70, "lb"), "1543");
  assert.equal(displayWeight(70, "kg"), 70);
});
test("今日の記録前は昨日までの連続記録を維持する", () => {
  assert.equal(
    recordingStreak(entriesFor(["2026-10-01", "2026-10-02"]), "2026-10-03"),
    2,
  );
  assert.equal(
    recordingStreak(
      entriesFor(["2026-10-01", "2026-10-02", "2026-10-03"]),
      "2026-10-03",
    ),
    3,
  );
});
test("欠測日で継続を区切り、未来や重複記録を数えない", () => {
  assert.equal(recordingStreak([], "2026-10-03"), 0);
  assert.equal(recordingStreak(entriesFor(["2026-10-01"]), "2026-10-03"), 0);
  assert.equal(
    recordingStreak(
      entriesFor(["2026-10-01", "2026-10-03", "2026-10-03", "2026-10-04"]),
      "2026-10-03",
    ),
    1,
  );
});
test("年越し・うるう日の連続記録を数える", () => {
  assert.equal(
    recordingStreak(
      entriesFor(["2025-12-30", "2025-12-31", "2026-01-01"]),
      "2026-01-01",
    ),
    3,
  );
  assert.equal(
    recordingStreak(
      entriesFor(["2024-02-28", "2024-02-29", "2024-03-01"]),
      "2024-03-01",
    ),
    3,
  );
});
test("90日の表示は年をまたいでも正しく切り替わる", () => {
  const entries = entriesFor([
    "2025-10-04",
    "2025-10-05",
    "2026-01-02",
    "2026-01-03",
  ]);
  assert.deepEqual(
    periodEntries(entries, "90", "2026-01-02").map((e) => e.date),
    ["2025-10-05", "2026-01-02"],
  );
});
test("日付の初期値は今日、表示は日本語の月日になる", () => {
  const today = localDate();
  assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(localDate(dateObject(today)), today);
  assert.equal(recordingStreak(entriesFor([today])), 1);
  assert.equal(periodEntries(entriesFor([today]), "30").length, 1);
  assert.match(prettyDate("2026-10-03"), /10月3日/);
});
test("30日の境界と欠測日を保ったまま抽出する", () => {
  const entries = ["2026-09-03", "2026-09-04", "2026-10-03", "2026-10-04"].map(
    (date, i) => ({ id: String(i), date, weightKg: 70, createdAt: 0 }),
  );
  assert.deepEqual(
    periodEntries(entries, "30", "2026-10-03").map((e) => e.date),
    ["2026-09-04", "2026-10-03"],
  );
  assert.equal(periodEntries(entries, "all").length, 4);
});
