import { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, styles } from "../../components/ui";
import { useWeights } from "../../features/weight/WeightProvider";
import { APP_NAME, SITE_URL, SUPPORT_EMAIL } from "../../constants/config";
import {
  displayWeight,
  parseWeight,
  parseWeightCsv,
  type Unit,
} from "../../features/weight/model";
import { exportWeightsCsv, pickWeightCsvText } from "../../services/backup";
function GoalWeightCard({
  unit,
  goalWeightKg,
  setGoalWeight,
}: {
  unit: Unit;
  goalWeightKg: number | null;
  setGoalWeight: (kg: number | null) => Promise<void>;
}) {
  const [goalInput, setGoalInput] = useState(
    goalWeightKg != null ? displayWeight(goalWeightKg, unit).toFixed(1) : "",
  );
  async function handleSaveGoal() {
    const kg = parseWeight(goalInput, unit);
    if (kg === null) {
      Alert.alert(
        "保存できませんでした",
        "20〜350kg相当の体重を入力してください。",
      );
      return;
    }
    try {
      await setGoalWeight(kg);
    } catch {
      Alert.alert("保存できませんでした", "もう一度お試しください。");
    }
  }
  async function handleClearGoal() {
    try {
      await setGoalWeight(null);
      setGoalInput("");
    } catch {
      Alert.alert("クリアできませんでした", "もう一度お試しください。");
    }
  }
  return (
    <View style={styles.card}>
      <Text style={{ fontWeight: "600", color: colors.ink, fontSize: 16 }}>
        目標体重
      </Text>
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          marginTop: 18,
          alignItems: "center",
        }}
      >
        <TextInput
          value={goalInput}
          onChangeText={setGoalInput}
          keyboardType="decimal-pad"
          placeholder={`未設定 (${unit})`}
          placeholderTextColor={colors.muted}
          style={{
            flex: 1,
            backgroundColor: colors.bg,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 16,
            fontSize: 17,
            color: colors.ink,
          }}
        />
        <Text style={{ fontSize: 15, color: colors.muted }}>{unit}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleSaveGoal()}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 12,
            alignItems: "center",
            backgroundColor: colors.accent,
          }}
        >
          <Text style={{ fontWeight: "600", color: colors.onAccent }}>
            保存
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleClearGoal()}
          style={{
            flex: 1,
            padding: 14,
            borderRadius: 12,
            alignItems: "center",
            backgroundColor: colors.bg,
          }}
        >
          <Text style={{ fontWeight: "600", color: colors.ink }}>クリア</Text>
        </Pressable>
      </View>
      <Text style={[styles.text, { fontSize: 12, marginTop: 12 }]}>
        設定するとグラフに目標ラインが表示されます。
      </Text>
    </View>
  );
}
export default function Settings() {
  const { unit, entries, importEntries, goalWeightKg, setGoalWeight } =
    useWeights();
  const [busy, setBusy] = useState(false);
  async function open(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "開けませんでした",
        "ブラウザまたはメールアプリの設定をご確認ください。",
      );
    }
  }
  async function handleExport() {
    if (entries.length === 0) {
      Alert.alert("記録がありません", "書き出せる体重データがありません。");
      return;
    }
    setBusy(true);
    try {
      await exportWeightsCsv(entries);
    } catch {
      Alert.alert("書き出せませんでした", "もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }
  async function handleImport() {
    setBusy(true);
    try {
      const text = await pickWeightCsvText();
      if (text === null) return;
      const { entries: parsed, skipped } = parseWeightCsv(text);
      if (parsed.length === 0) {
        Alert.alert(
          "取り込めませんでした",
          "日時と体重の列があるCSVファイルを選んでください。",
        );
        return;
      }
      await importEntries(parsed);
      Alert.alert(
        "取り込み完了",
        `${parsed.length}件を取り込みました。${
          skipped > 0 ? `\n${skipped}件は読み取れず除外しました。` : ""
        }`,
      );
    } catch {
      Alert.alert("取り込めませんでした", "もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>設定</Text>
        <GoalWeightCard
          key={goalWeightKg ?? "none"}
          unit={unit}
          goalWeightKg={goalWeightKg}
          setGoalWeight={setGoalWeight}
        />
        <View style={styles.card}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.ink }}>
            データのバックアップ
          </Text>
          <Text style={[styles.text, { marginTop: 10 }]}>
            CSVファイルで書き出し・取り込みができます。CSV書き出しに対応した他の体重記録アプリからの移行にも使えます。
          </Text>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => void handleExport()}
              style={{
                flex: 1,
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: colors.bg,
                opacity: busy ? 0.5 : 1,
              }}
            >
              <Ionicons name="share-outline" size={18} color={colors.ink} />
              <Text style={{ fontWeight: "600", color: colors.ink }}>
                書き出す
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => void handleImport()}
              style={{
                flex: 1,
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: colors.bg,
                opacity: busy ? 0.5 : 1,
              }}
            >
              <Ionicons name="download-outline" size={18} color={colors.ink} />
              <Text style={{ fontWeight: "600", color: colors.ink }}>
                取り込む
              </Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.ink }}>
            データについて
          </Text>
          <Text style={[styles.text, { marginTop: 10 }]}>
            体重はこの端末内に保存します。アカウント登録や外部へのデータ送信はありません。
          </Text>
          <Text style={[styles.text, { marginTop: 8 }]}>
            アプリの削除で記録は消えます。OSのバックアップ設定によっては、端末のバックアップに含まれます。
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.ink }}>
            プライバシーポリシー
          </Text>
          <Text style={[styles.text, { marginTop: 10 }]}>
            記録した体重・日付・単位設定は、アプリの機能提供のために端末内でのみ利用します。開発者は取得せず、第三者に提供しません。v1.0では広告・解析SDKを使用しません。
          </Text>
          <Text style={[styles.text, { marginTop: 8 }]}>
            記録は編集画面から削除できます。お問い合わせで送信された情報は、対応のために利用します。
          </Text>
          {SITE_URL ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => void open(`${SITE_URL}#privacy`)}
              style={{ paddingTop: 16 }}
            >
              <Text style={{ color: colors.accent }}>
                Webのプライバシーポリシー ↗
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.card}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.ink }}>
            お問い合わせ・サポート
          </Text>
          <Text style={[styles.text, { marginTop: 10 }]}>
            不具合・ご質問・ご要望はメールでお知らせください。
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() =>
              void open(
                `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(APP_NAME + " お問い合わせ")}`,
              )
            }
            style={styles.row}
          >
            <Text style={{ fontSize: 14, color: colors.ink, marginTop: 14 }}>
              {SUPPORT_EMAIL}
            </Text>
            <Ionicons
              name="arrow-up-right-box-outline"
              size={18}
              color={colors.accent}
              style={{ marginTop: 14 }}
            />
          </Pressable>
          {SITE_URL ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => void open(`${SITE_URL}#support`)}
              style={{ paddingTop: 12 }}
            >
              <Text style={{ color: colors.accent }}>
                Webのサポートページ ↗
              </Text>
            </Pressable>
          ) : null}
        </View>
        <Text
          style={{ textAlign: "center", color: colors.muted, fontSize: 12 }}
        >
          {APP_NAME} · v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
