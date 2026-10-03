import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWeights } from "../lib/store";
import {
  dateObject,
  displayWeight,
  localDate,
  periodEntries,
  prettyDate,
  recordingStreak,
  type Period,
  type WeightEntry,
} from "../lib/weight";
import { Button, colors, styles } from "../components/ui";
import { WeightChart } from "../components/WeightChart";
export default function Home() {
  const {
    entries,
    unit,
    ready,
    error,
    reload,
    onboardingDone,
    completeOnboarding,
  } = useWeights();
  const [period, setPeriod] = useState<Period>("30");
  const [notice, setNotice] = useState(false);
  if (error)
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.content}>
          <Text style={styles.title}>読み込みに失敗しました</Text>
          <Text style={styles.text}>{error}</Text>
          <Button label="もう一度試す" onPress={() => void reload()} />
        </View>
      </SafeAreaView>
    );
  if (!ready)
    return (
      <SafeAreaView style={[styles.screen, { justifyContent: "center" }]}>
        <ActivityIndicator color={colors.accentText} />
      </SafeAreaView>
    );
  const selected = periodEntries(entries, period);
  const today = entries.find((e) => e.date === localDate());
  const latest = entries[entries.length - 1];
  const streak = recordingStreak(entries);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = dateObject(localDate());
    d.setDate(d.getDate() - 6 + i);
    const date = localDate(d);
    return {
      date,
      day: ["日", "月", "火", "水", "木", "金", "土"][d.getDay()],
      done: entries.some((e) => e.date === date),
    };
  });
  const change =
    selected.length > 1
      ? displayWeight(
          selected[selected.length - 1].weightKg - selected[0].weightKg,
          unit,
        )
      : null;
  function edit(entry?: WeightEntry) {
    router.push({
      pathname: "/record",
      params: { date: entry?.date ?? localDate() },
    });
  }
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <View>
            <Text
              style={[
                styles.eyebrow,
                { color: colors.muted, letterSpacing: 3 },
              ]}
            >
              BODYLOG / 毎日の積み重ね
            </Text>
            <Text style={[styles.title, { marginTop: 8, fontSize: 25 }]}>
              今日も、いい一歩。
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="設定"
            hitSlop={14}
            onPress={() => router.push("/settings")}
            style={s.settings}
          >
            <Ionicons name="settings-outline" size={21} color={colors.ink} />
          </Pressable>
        </View>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.pale,
              borderColor: "#F0DECC",
              padding: 16,
            },
          ]}
        >
          <View style={styles.row}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Ionicons name="barbell-outline" size={19} color={colors.accentText} />
              <Text style={{ color: colors.ink, fontWeight: "700" }}>
                {streak
                  ? `ナイス！${streak}日続いてる。`
                  : "まずは今日の一歩から。"}
              </Text>
            </View>
            <Text
              style={{ color: colors.accentText, fontSize: 12, fontWeight: "700" }}
            >
              {week.filter((d) => d.done).length}/7
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            {week.map((d) => (
              <View key={d.date} style={{ alignItems: "center", gap: 7 }}>
                <View
                  style={{
                    width: 29,
                    height: 29,
                    borderRadius: 9,
                    backgroundColor: d.done ? colors.accent : "#F1DFCE",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {d.done && (
                    <Ionicons name="checkmark" size={16} color="#3A2614" />
                  )}
                </View>
                <Text
                  style={{
                    color:
                      d.date === localDate() ? colors.accentText : colors.muted,
                    fontSize: 10,
                  }}
                >
                  {d.day}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {!onboardingDone && (
          <View style={[styles.card, { backgroundColor: colors.pale }]}>
            <Text style={s.subtitle}>まずは、今日の体重から。</Text>
            <Text style={[styles.text, { marginTop: 8, marginBottom: 16 }]}>
              記録はこの端末だけに保存します。毎日の小さな変化を、グラフで振り返りましょう。
            </Text>
            <Button
              label="はじめる"
              onPress={async () => {
                try {
                  await completeOnboarding();
                  edit();
                } catch {
                  Alert.alert(
                    "保存できませんでした",
                    "もう一度お試しください。",
                  );
                }
              }}
            />
          </View>
        )}
        <View style={[styles.card, { padding: 18 }]}>
          <View style={styles.row}>
            <Text style={s.subtitle}>体重の推移</Text>
            <Text style={styles.eyebrow}>{unit.toUpperCase()}</Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              gap: 7,
              marginTop: 16,
            }}
          >
            <Text style={s.big}>
              {latest ? displayWeight(latest.weightKg, unit).toFixed(1) : "—"}
            </Text>
            <Text style={styles.text}>{unit}</Text>
            <Text style={[styles.text, { marginLeft: "auto", fontSize: 12 }]}>
              {latest ? prettyDate(latest.date) : "まだ記録がありません"}
            </Text>
          </View>
          <View style={s.segment}>
            {(
              [
                ["30", "30日"],
                ["90", "3ヶ月"],
                ["all", "全期間"],
              ] as const
            ).map(([key, label]) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityState={{ selected: period === key }}
                onPress={() => setPeriod(key)}
                style={[s.tab, period === key && s.activeTab]}
              >
                <Text
                  style={[s.tabText, period === key && { color: colors.ink }]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
          {selected.length ? (
            <WeightChart entries={selected} unit={unit} onSelect={edit} />
          ) : (
            <View style={s.empty}>
              <Ionicons
                name="analytics-outline"
                size={42}
                color={colors.accentText}
              />
              <Text style={s.subtitle}>
                {entries.length
                  ? "この期間の記録はありません"
                  : "最初の記録をつけましょう"}
              </Text>
              <Text style={styles.text}>
                体重を記録すると、ここにグラフが育ちます。
              </Text>
            </View>
          )}
          <View
            style={[
              styles.row,
              { borderTopWidth: 1, borderColor: colors.border, paddingTop: 15 },
            ]}
          >
            <Text style={[styles.text, { fontSize: 12 }]}>
              {selected.length}日分の記録
            </Text>
            <Text style={[styles.text, { fontSize: 12 }]}>
              {change === null
                ? "丸をタップして編集"
                : `期間の変化 ${change > 0 ? "+" : ""}${change.toFixed(1)} ${unit}`}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => edit(today)}
          accessibilityRole="button"
          style={[
            styles.card,
            {
              backgroundColor: colors.accent,
              borderColor: colors.accent,
              padding: 18,
            },
          ]}
        >
          <View style={styles.row}>
            <View>
              <Text
                style={{ color: "#A76B38", fontSize: 12, fontWeight: "600" }}
              >
                {today ? "今日の記録、できた！" : "さあ、今日の一歩を残そう"}
              </Text>
              <Text
                style={{
                  color: "#3A2614",
                  fontSize: 26,
                  fontWeight: "800",
                  marginTop: 8,
                }}
              >
                {today
                  ? `${displayWeight(today.weightKg, unit).toFixed(1)} ${unit}`
                  : "体重を記録する"}
              </Text>
            </View>
            <View style={s.plus}>
              <Ionicons
                name={today ? "pencil" : "add"}
                size={24}
                color="#3A2614"
              />
            </View>
          </View>
        </Pressable>
        {entries.length > 0 && (
          <View>
            <View style={[styles.row, { marginBottom: 12 }]}>
              <Text style={s.subtitle}>最近の記録</Text>
              <Text style={[styles.text, { fontSize: 12 }]}>
                タップして編集
              </Text>
            </View>
            <View style={[styles.card, { paddingVertical: 4 }]}>
              {entries
                .slice(-5)
                .reverse()
                .map((e, i) => (
                  <Pressable
                    key={e.id}
                    onPress={() => edit(e)}
                    accessibilityRole="button"
                    style={[
                      s.entry,
                      i > 0 && {
                        borderTopWidth: 1,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={{ color: colors.ink, fontSize: 14 }}>
                      {prettyDate(e.date)}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: colors.ink,
                          fontSize: 17,
                          fontWeight: "600",
                        }}
                      >
                        {displayWeight(e.weightKg, unit).toFixed(1)}{" "}
                        <Text style={styles.text}>{unit}</Text>
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        color={colors.muted}
                        size={14}
                      />
                    </View>
                  </Pressable>
                ))}
            </View>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => setNotice(!notice)}
        >
          <Text
            style={{ color: colors.muted, textAlign: "center", fontSize: 11 }}
          >
            端末内に保存 · あなたのための記録
          </Text>
        </Pressable>
        {notice && (
          <Text style={[styles.text, { fontSize: 12 }]}>
            アプリから体重データを外部へ送信することはありません。端末のバックアップ設定によりOSのバックアップに含まれる場合があります。
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  settings: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subtitle: { fontSize: 16, fontWeight: "600", color: colors.ink },
  big: {
    fontSize: 42,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -2,
    fontVariant: ["tabular-nums"],
  },
  segment: {
    backgroundColor: colors.bg,
    borderRadius: 11,
    flexDirection: "row",
    padding: 4,
    marginTop: 20,
    marginBottom: 14,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 8 },
  activeTab: { backgroundColor: colors.card },
  tabText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  empty: {
    height: 245,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  plus: {
    width: 46,
    height: 46,
    backgroundColor: "#FFFFFF20",
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 17,
  },
});
