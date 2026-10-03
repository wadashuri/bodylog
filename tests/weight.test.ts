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
  parseWeightCsv,
  toWeightCsv,
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
  assert.equal(periodEntries(entriesFor([today]), "31").length, 1);
  assert.match(prettyDate("2026-10-03"), /10月3日/);
});
test("31日の境界と欠測日を保ったまま抽出する", () => {
  const entries = ["2026-09-03", "2026-09-04", "2026-10-03", "2026-10-04"].map(
    (date, i) => ({ id: String(i), date, weightKg: 70, createdAt: 0 }),
  );
  assert.deepEqual(
    periodEntries(entries, "31", "2026-10-03").map((e) => e.date),
    ["2026-09-03", "2026-09-04", "2026-10-03"],
  );
  assert.equal(periodEntries(entries, "all").length, 4);
});
test("シンプルダイエット形式(日時+スラッシュ)のCSVを読み込める", () => {
  const csv = [
    "日時 [Asia/Tokyo],体重 [kg],体脂肪率,食事,運動,メモ,Event-1,Event-2,Event-3",
    "2024/07/01 8:47:28,73.7,,,,,,,",
    "2024/07/21 16:21:06,72.8,,,,,,,",
  ].join("\n");
  assert.deepEqual(parseWeightCsv(csv), {
    entries: [
      { date: "2024-07-01", weightKg: 73.7 },
      { date: "2024-07-21", weightKg: 72.8 },
    ],
    skipped: 0,
  });
});
test("プロ生ちゃん形式(YYYYMMDD)のCSVを読み込める", () => {
  const csv = [
    "日付(YYYYMMDD形式),体重,体脂肪率,汎用,目標体重,メモ",
    "20231220,68.5,,,,",
  ].join("\n");
  assert.deepEqual(parseWeightCsv(csv), {
    entries: [{ date: "2023-12-20", weightKg: 68.5 }],
    skipped: 0,
  });
});
test("不正な行はスキップし、同じ日付は後勝ちでマージする", () => {
  const csv = [
    "日付,体重 [kg]",
    "2026-10-01,70.0",
    "2026-13-40,70.0",
    "2026-10-02,abc",
    "2026-10-03,999",
    "2026-10-01,71.2",
  ].join("\n");
  assert.deepEqual(parseWeightCsv(csv), {
    entries: [{ date: "2026-10-01", weightKg: 71.2 }],
    skipped: 3,
  });
});
test("日時・体重の列が見つからないCSVは空で返す", () => {
  assert.deepEqual(parseWeightCsv("a,b\n1,2"), { entries: [], skipped: 1 });
  assert.deepEqual(parseWeightCsv(""), { entries: [], skipped: 0 });
});
test("ダブルクォートで囲まれた列(カンマ・エスケープ引用符を含む)を正しく分割する", () => {
  const csv = [
    "日時,体重 [kg],メモ",
    '2026-10-01,70.5,"朝,体調良い ""元気"""',
  ].join("\n");
  assert.deepEqual(parseWeightCsv(csv), {
    entries: [{ date: "2026-10-01", weightKg: 70.5 }],
    skipped: 0,
  });
});
test("自分のエクスポートしたCSVを自分で読み込める(往復)", () => {
  const entries = entriesFor(["2026-10-01", "2026-10-02"]).map((e) => ({
    ...e,
    weightKg: 70.5,
  }));
  const parsed = parseWeightCsv(toWeightCsv(entries));
  assert.deepEqual(parsed, {
    entries: [
      { date: "2026-10-01", weightKg: 70.5 },
      { date: "2026-10-02", weightKg: 70.5 },
    ],
    skipped: 0,
  });
});
