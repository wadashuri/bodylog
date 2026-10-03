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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePhotos } from "../../features/photo/PhotoProvider";
import {
  filterPhotos,
  photoYearMonths,
  photoYears,
  type PhotoEntry,
  type PhotoFilter,
} from "../../features/photo/model";
import { dateObject } from "../../features/weight/model";
import { thumbUri } from "../../services/photoStorage";
import { colors, styles } from "../../components/ui";
function shortDate(date: string): string {
  return dateObject(date).toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
  });
}
function yearMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  return `${year}年${Number(month)}月`;
}
export default function Photos() {
  const { photos } = usePhotos();
  const [filter, setFilter] = useState<PhotoFilter>({ mode: "all" });
  const years = photoYears(photos);
  const yearMonths = photoYearMonths(photos);
  const shown = filterPhotos(photos, filter);
  function selectMode(mode: PhotoFilter["mode"]) {
    if (mode === "all") setFilter({ mode: "all" });
    else if (mode === "year") setFilter({ mode: "year", year: years[0] ?? "" });
    else setFilter({ mode: "month", yearMonth: yearMonths[0] ?? "" });
  }
  function openRecord(photo: PhotoEntry) {
    router.push({ pathname: "/", params: { date: photo.date } });
  }
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={{ flex: 1, padding: 20, gap: 14 }}>
        <Text style={styles.title}>写真</Text>
        <View style={s.segment}>
          {(
            [
              ["all", "全て"],
              ["year", "年別"],
              ["month", "月別"],
            ] as const
          ).map(([mode, label]) => (
            <Pressable
              key={mode}
              accessibilityRole="button"
              accessibilityState={{ selected: filter.mode === mode }}
              onPress={() => selectMode(mode)}
              style={[s.tab, filter.mode === mode && s.activeTab]}
            >
              <Text
                style={[
                  s.tabText,
                  filter.mode === mode && { color: colors.ink },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        {filter.mode === "year" && years.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
          >
            <View style={{ flexDirection: "row", gap: 8 }}>
              {years.map((year) => (
                <Pressable
                  key={year}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter.year === year }}
                  onPress={() => setFilter({ mode: "year", year })}
                  style={[s.chip, filter.year === year && s.activeChip]}
                >
                  <Text
                    style={[
                      s.chipText,
                      filter.year === year && { color: colors.ink },
                    ]}
                  >
                    {year}年
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
        {filter.mode === "month" && yearMonths.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
          >
            <View style={{ flexDirection: "row", gap: 8 }}>
              {yearMonths.map((yearMonth) => (
                <Pressable
                  key={yearMonth}
                  accessibilityRole="button"
                  accessibilityState={{
                    selected: filter.yearMonth === yearMonth,
                  }}
                  onPress={() => setFilter({ mode: "month", yearMonth })}
                  style={[
                    s.chip,
                    filter.yearMonth === yearMonth && s.activeChip,
                  ]}
                >
                  <Text
                    style={[
                      s.chipText,
                      filter.yearMonth === yearMonth && { color: colors.ink },
                    ]}
                  >
                    {yearMonthLabel(yearMonth)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
        {shown.length ? (
          <FlatList
            data={shown}
            keyExtractor={(photo) => photo.date}
            numColumns={2}
            columnWrapperStyle={{ gap: 10 }}
            contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${shortDate(item.date)}の写真を開く`}
                onPress={() => openRecord(item)}
                style={s.cell}
              >
                <Image
                  source={{ uri: thumbUri(item.thumbName) }}
                  style={s.cellImage}
                />
                <View style={s.cellLabel}>
                  <Text style={s.cellLabelText}>{shortDate(item.date)}</Text>
                </View>
              </Pressable>
            )}
          />
        ) : (
          <View style={s.empty}>
            <Ionicons
              name="images-outline"
              size={42}
              color={colors.accentText}
            />
            <Text style={s.emptyText}>
              {photos.length
                ? "この期間の写真はありません"
                : "まだ写真がありません"}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  segment: {
    backgroundColor: colors.card,
    borderRadius: 11,
    flexDirection: "row",
    padding: 4,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 8 },
  activeTab: { backgroundColor: colors.pale },
  tabText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeChip: { backgroundColor: colors.pale, borderColor: colors.accent },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
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
