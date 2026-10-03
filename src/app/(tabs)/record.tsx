import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useWeights } from "../../features/weight/WeightProvider";
import {
  dateObject,
  formatWeightDigits,
  localDate,
  parseWeight,
  prettyDate,
  weightDigits,
} from "../../features/weight/model";
import { colors, styles } from "../../components/ui";
function resolveDate(param?: string) {
  return param && /^\d{4}-\d{2}-\d{2}$/.test(param) ? param : localDate();
}
export default function RecordScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const initialDate = resolveDate(params.date);
  return <RecordForm key={initialDate} initialDate={initialDate} />;
}
function RecordForm({ initialDate }: { initialDate: string }) {
  const { entries, unit, save, remove } = useWeights();
  const [date, setDate] = useState(initialDate);
  const existing = entries.find((e) => e.date === date);
  const last = entries[entries.length - 1];
  const [digits, setDigits] = useState(
    existing
      ? weightDigits(existing.weightKg, unit)
      : last
        ? weightDigits(last.weightKg, unit)
        : "",
  );
  const value = formatWeightDigits(digits);
  const [replace, setReplace] = useState(true);
  const [showDate, setShowDate] = useState(false);
  const [busy, setBusy] = useState(false);
  // 表示単位の丸めで、入力を変えずに保存した値がずれないようにする。
  const preset = existing ?? last;
  const kg = replace && preset ? preset.weightKg : parseWeight(value, unit);
  function key(input: string) {
    void Haptics.selectionAsync().catch(() => {});
    if (input === "C") {
      setDigits("");
      setReplace(false);
      return;
    }
    if (input === "back") {
      setDigits(digits.slice(0, -1));
      setReplace(false);
      return;
    }
    const base = replace ? "" : digits;
    const next = (base + input).replace(/^0+(?=\d)/, "");
    if (/^\d{1,4}$/.test(next)) {
      setDigits(next);
      setReplace(false);
    }
  }
  async function submit() {
    if (kg === null || busy) return;
    setBusy(true);
    try {
      await save(date, kg);
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
      router.replace("/");
    } catch {
      Alert.alert(
        "保存できませんでした",
        "記録は閉じずに残しています。もう一度お試しください。",
      );
    } finally {
      setBusy(false);
    }
  }
  function confirmDelete() {
    Alert.alert("この日の記録を削除しますか？", prettyDate(date), [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            await remove(date);
            setDigits("");
            setReplace(false);
          } catch {
            Alert.alert("削除できませんでした", "もう一度お試しください。");
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }
  return (
    <SafeAreaView style={s.screen} edges={["top", "left", "right"]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>体重記録</Text>
        {existing && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="この記録を削除"
            disabled={busy}
            hitSlop={12}
            onPress={confirmDelete}
            style={s.headerAction}
          >
            <Ionicons
              name="trash-outline"
              size={19}
              color={colors.headerText}
            />
          </Pressable>
        )}
      </View>
      <ScrollView contentContainerStyle={[styles.content, { gap: 20 }]}>
        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="記録日を変更"
            disabled={busy}
            onPress={() => setShowDate(!showDate)}
            style={styles.row}
          >
            <Text style={styles.text}>記録日</Text>
            <View
              style={{ flexDirection: "row", gap: 10, alignItems: "center" }}
            >
              <Text style={{ fontSize: 15, color: colors.ink }}>
                {prettyDate(date)}
              </Text>
              <View style={s.editDate}>
                <Ionicons name="pencil" size={14} color="#FFFFFF" />
              </View>
            </View>
          </Pressable>
          {showDate && (
            <DateTimePicker
              value={dateObject(date)}
              maximumDate={new Date()}
              minimumDate={new Date("2000-01-01T12:00:00")}
              mode="date"
              display="spinner"
              locale="ja-JP"
              themeVariant="light"
              onChange={(_, next) => {
                if (!next) return;
                const nextDate = localDate(next);
                setDate(nextDate);
                const record = entries.find((e) => e.date === nextDate);
                setDigits(
                  record
                    ? weightDigits(record.weightKg, unit)
                    : last
                      ? weightDigits(last.weightKg, unit)
                      : "",
                );
                setReplace(true);
              }}
            />
          )}
        </View>
        <View style={s.weightBox}>
          <Text style={s.weightLabel}>体重</Text>
          <View style={s.weight}>
            <Text style={s.number}>{value || "0.00"}</Text>
            <Text style={s.unit}>{unit}</Text>
          </View>
          {!!value && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="入力をクリア"
              disabled={busy}
              hitSlop={12}
              onPress={() => key("C")}
            >
              <Ionicons
                name="close-circle-outline"
                size={22}
                color={colors.highlightText}
              />
            </Pressable>
          )}
        </View>
        <View style={s.keypad}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "back"].map(
            (k) => (
              <Pressable
                key={k}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={
                  k === "back" ? "1文字消す" : k === "C" ? "入力をクリア" : k
                }
                onPress={() => key(k)}
                style={({ pressed }) => [
                  s.key,
                  { backgroundColor: pressed ? colors.pale : colors.card },
                ]}
              >
                {k === "back" ? (
                  <Ionicons
                    name="backspace-outline"
                    size={27}
                    color={colors.ink}
                  />
                ) : (
                  <Text style={s.keyText}>{k}</Text>
                )}
              </Pressable>
            ),
          )}
        </View>
        {value && kg === null && (
          <Text style={{ color: colors.danger, fontSize: 13 }}>
            20〜350kg相当の体重を入力してください。
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          disabled={kg === null || busy}
          onPress={() => void submit()}
          style={({ pressed }) => [
            s.okButton,
            { opacity: kg === null || busy ? 0.45 : pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={s.okText}>{busy ? "保存中…" : "OK"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.header,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: colors.headerText, fontSize: 17, fontWeight: "700" },
  headerAction: {
    position: "absolute",
    right: 20,
    top: 14,
    padding: 4,
  },
  editDate: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accentText,
    alignItems: "center",
    justifyContent: "center",
  },
  weightBox: {
    backgroundColor: colors.highlight,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weightLabel: { fontSize: 15, fontWeight: "700", color: colors.highlightText },
  weight: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  number: {
    fontSize: 46,
    fontWeight: "700",
    color: colors.highlightText,
    fontVariant: ["tabular-nums"],
    letterSpacing: -1,
  },
  unit: { fontSize: 16, color: colors.highlightText, fontWeight: "600" },
  keypad: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  key: {
    width: "31%",
    flexGrow: 1,
    height: 68,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  keyText: { fontSize: 28, color: colors.ink, fontWeight: "700" },
  okButton: {
    backgroundColor: colors.accent,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
  },
  okText: { color: "#3A2614", fontWeight: "800", fontSize: 18 },
});
