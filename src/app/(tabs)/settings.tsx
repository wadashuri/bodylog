import { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, styles } from "../../components/ui";
import { useWeights } from "../../features/weight/WeightProvider";
import { APP_NAME, SITE_URL, SUPPORT_EMAIL } from "../../constants/config";
import { parseWeightCsv } from "../../features/weight/model";
import { exportWeightsCsv, pickWeightCsvText } from "../../services/backup";
export default function Settings() {
  const { unit, changeUnit, entries, importEntries } = useWeights();
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
        <View style={styles.card}>
          <Text style={{ fontWeight: "600", color: colors.ink, fontSize: 16 }}>
            体重の単位
          </Text>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
            {(["kg", "lb"] as const).map((next) => (
              <Pressable
                key={next}
                accessibilityRole="button"
                accessibilityState={{ selected: unit === next }}
                onPress={async () => {
                  try {
                    await changeUnit(next);
                  } catch {
                    Alert.alert(
                      "変更できませんでした",
                      "もう一度お試しください。",
                    );
                  }
                }}
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: unit === next ? colors.accent : colors.bg,
                }}
              >
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "600",
                    color: unit === next ? "#3A2614" : colors.muted,
                  }}
                >
                  {next}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={[styles.text, { fontSize: 12, marginTop: 12 }]}>
            記録済みの体重も選んだ単位で表示します。
          </Text>
        </View>
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
        <Pressable
          accessibilityRole="link"
          onPress={() =>
            void open(
              `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(APP_NAME + " お問い合わせ")}`,
            )
          }
          style={styles.card}
        >
          <View style={styles.row}>
            <Text style={{ fontSize: 16, color: colors.ink }}>
              お問い合わせ
            </Text>
            <Ionicons
              name="arrow-up-right-box-outline"
              size={20}
              color={colors.accent}
            />
          </View>
          <Text style={[styles.text, { fontSize: 12, marginTop: 8 }]}>
            {SUPPORT_EMAIL}
          </Text>
        </Pressable>
        <Text
          style={{ textAlign: "center", color: colors.muted, fontSize: 12 }}
        >
          {APP_NAME} · v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
