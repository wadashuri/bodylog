import { useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePhotos } from "../../features/photo/PhotoProvider";
import {
  filterPhotos,
  photoForDate,
  type PhotoEntry,
} from "../../features/photo/model";
import { dateObject } from "../../features/weight/model";
import { photoUri } from "../../services/photoStorage";
import { colors, styles } from "../../components/ui";
type Slot = "before" | "after";
function shortDate(date: string): string {
  return dateObject(date).toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
  });
}
const SLOT_LABEL: Record<Slot, string> = { before: "Before", after: "After" };
export default function Compare() {
  const { photos } = usePhotos();
  const [beforeDate, setBeforeDate] = useState<string | null>(null);
  const [afterDate, setAfterDate] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);
  const before = beforeDate ? photoForDate(photos, beforeDate) : undefined;
  const after = afterDate ? photoForDate(photos, afterDate) : undefined;
  function pick(photo: PhotoEntry) {
    if (activeSlot === "before" && photo.date !== afterDate)
      setBeforeDate(photo.date);
    else if (activeSlot === "after" && photo.date !== beforeDate)
      setAfterDate(photo.date);
    setActiveSlot(null);
  }
  function renderSlot(slot: Slot, photo: PhotoEntry | undefined) {
    const label = SLOT_LABEL[slot];
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          photo ? `${label}の写真を変更` : `${label}の写真を選ぶ`
        }
        onPress={() => setActiveSlot(activeSlot === slot ? null : slot)}
        style={s.slot}
      >
        {photo ? (
          <>
            <Image
              source={{ uri: photoUri(photo.fileName) }}
              style={s.slotImage}
            />
            <View style={s.slotFooter}>
              <Text style={s.slotLabel}>{label}</Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text style={styles.text}>{shortDate(photo.date)}</Text>
                <Ionicons name="pencil" size={16} color={colors.muted} />
              </View>
            </View>
          </>
        ) : (
          <View style={s.slotPlaceholder}>
            <Ionicons
              name="image-outline"
              size={32}
              color={colors.accentText}
            />
            <Text style={styles.text}>タップして{label}の写真を選ぶ</Text>
          </View>
        )}
      </Pressable>
    );
  }
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={{ flex: 1, padding: 20, gap: 14 }}>
        <Text style={styles.title}>比較</Text>
        {photos.length < 2 ? (
          <View style={s.empty}>
            <Ionicons
              name="swap-horizontal-outline"
              size={42}
              color={colors.accentText}
            />
            <Text style={s.emptyText}>比較するには写真が2枚以上必要です</Text>
          </View>
        ) : activeSlot ? (
          <>
            <Text style={styles.text}>
              {SLOT_LABEL[activeSlot]}の写真を選ぶ
            </Text>
            <FlatList
              data={filterPhotos(photos, { mode: "all" })}
              keyExtractor={(photo) => photo.date}
              numColumns={2}
              columnWrapperStyle={{ gap: 10 }}
              contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${shortDate(item.date)}を選ぶ`}
                  onPress={() => pick(item)}
                  style={s.cell}
                >
                  <Image
                    source={{ uri: photoUri(item.fileName) }}
                    style={s.cellImage}
                  />
                  <View style={s.cellLabel}>
                    <Text style={s.cellLabelText}>{shortDate(item.date)}</Text>
                  </View>
                </Pressable>
              )}
            />
          </>
        ) : (
          <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 20 }}>
            {renderSlot("before", before)}
            {renderSlot("after", after)}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  slot: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  slotImage: { width: "100%", height: 260, backgroundColor: colors.pale },
  slotFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  slotLabel: { fontSize: 13, fontWeight: "700", color: colors.accentText },
  slotPlaceholder: {
    height: 260,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 20,
  },
  cell: { width: "48%" },
  cellImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: colors.pale,
  },
  cellLabel: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#00000088",
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  cellLabelText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  emptyText: { fontSize: 16, fontWeight: "600", color: colors.ink },
});
