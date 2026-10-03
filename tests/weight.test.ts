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
} from "../src/lib/weight";
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
  assert.ok(Math.abs(parseWeight("154.32", "lb")! - 70) < 0.01);
  assert.ok(Math.abs(displayWeight(70, "lb") - 154.3236) < 0.001);
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
