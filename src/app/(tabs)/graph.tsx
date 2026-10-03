import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useWeights } from "../../features/weight/WeightProvider";
import {
  dateObject,
  displayWeight,
  localDate,
  periodEntries,
  prettyDate,
  recordingStreak,
  type Period,
  type WeightEntry,
} from "../../features/weight/model";
import { Button, colors, styles } from "../../components/ui";
import { WeightChart } from "../../features/weight/WeightChart";
export default function Graph() {
  const { entries, unit, goalWeightKg, remove, ready, error, reload } =
    useWeights();
  const [period, setPeriod] = useState<Period>("7");
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
  const latest = entries[entries.length - 1];
  const streak = recordingStreak(entries);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = dateObject(localDate());
    d.setDate(d.getDate() - 6 + i);
    const date = localDate(d);
    return { date, done: entries.some((e) => e.date === date) };
  });
  const change =
    selected.length > 1
      ? displayWeight(
          selected[selected.length - 1].weightKg - selected[0].weightKg,
          unit,
        )
      : null;
  const goalDisplay =
    goalWeightKg != null ? displayWeight(goalWeightKg, unit) : null;
  const goalDiff =
    goalDisplay != null && latest
      ? Math.abs(displayWeight(latest.weightKg, unit) - goalDisplay)
      : null;
  function edit(entry: WeightEntry) {
    router.push({ pathname: "/", params: { date: entry.date } });
  }
  function confirmDelete(entry: WeightEntry) {
    Alert.alert("この日の記録を削除しますか？", prettyDate(entry.date), [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: () =>
          void remove(entry.date).catch(() => {
            Alert.alert("削除できませんでした", "もう一度お試しください。");
          }),
      },
    ]);
  }
  function handleLongPress(entry: WeightEntry) {
    Alert.alert(prettyDate(entry.date), undefined, [
      { text: "編集", onPress: () => edit(entry) },
      {
        text: "削除",
        style: "destructive",
        onPress: () => confirmDelete(entry),
      },
      { text: "キャンセル", style: "cancel" },
    ]);
  }
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={s.container}>
        <View style={styles.row}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={s.mascot}>
              <MaterialCommunityIcons
                name="robot-happy-outline"
                size={18}
                color={colors.accentText}
              />
            </View>
            <View style={s.bubble}>
              <Text style={s.streak}>
                {streak ? `${streak}日連続` : "未記録"}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 5 }}>
            {week.map((d) => (
              <View
                key={d.date}
                style={[s.dot, d.done && { backgroundColor: colors.accent }]}
              />
            ))}
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 7 }}>
          <Text style={s.big}>
            {latest ? displayWeight(latest.weightKg, unit).toFixed(1) : "—"}
          </Text>
          <Text style={styles.text}>{unit}</Text>
          {change !== null && (
            <Text style={[styles.text, { marginLeft: "auto", fontSize: 13 }]}>
              {change > 0 ? "+" : ""}
              {change.toFixed(1)} {unit}
            </Text>
          )}
        </View>
        {goalDisplay != null && (
          <Text style={[styles.text, { fontSize: 13 }]}>
            目標{goalDisplay.toFixed(1)}
            {unit}
            {goalDiff != null ? `（あと${goalDiff.toFixed(1)}${unit}）` : ""}
          </Text>
        )}
        <View style={s.segment}>
          {(
            [
              ["7", "7日"],
              ["31", "31日"],
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
        <View style={{ flex: 1, marginTop: 8 }}>
          {selected.length ? (
            <WeightChart
              entries={selected}
              unit={unit}
              goalWeightKg={goalWeightKg}
              onLongPress={handleLongPress}
            />
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
                  : "まだ記録がありません"}
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 14 },
  mascot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.pale,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  streak: { color: colors.accentText, fontWeight: "700", fontSize: 13 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.card,
  },
  subtitle: { fontSize: 16, fontWeight: "600", color: colors.ink },
  big: {
    fontSize: 44,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -2,
    fontVariant: ["tabular-nums"],
  },
  segment: {
    backgroundColor: colors.card,
    borderRadius: 11,
    flexDirection: "row",
    padding: 4,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 8 },
  activeTab: { backgroundColor: colors.pale },
  tabText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
});
