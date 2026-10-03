import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CartesianChart, Line, Scatter } from "victory-native";
import { matchFont } from "@shopify/react-native-skia";
import { Gesture } from "react-native-gesture-handler";
import { colors } from "../../components/ui";
import {
  dateObject,
  displayWeight,
  prettyDate,
  type Unit,
  type WeightEntry,
} from "./model";
type Point = { x: number; y: number; entry: WeightEntry };
export function WeightChart({
  entries,
  unit,
  goalWeightKg,
  onLongPress,
}: {
  entries: WeightEntry[];
  unit: Unit;
  goalWeightKg?: number | null;
  onLongPress: (entry: WeightEntry) => void;
}) {
  const goal = goalWeightKg != null ? displayWeight(goalWeightKg, unit) : null;
  const data = useMemo(
    () =>
      entries.map((e) => ({
        x: dateObject(e.date).getTime(),
        weight: displayWeight(e.weightKg, unit),
        goal: goal ?? displayWeight(e.weightKg, unit),
      })),
    [entries, unit, goal],
  );
  const [locations, setLocations] = useState<Point[]>([]);
  const [selected, setSelected] = useState<Point | null>(null);
  const [width, setWidth] = useState(0);
  const font = useMemo(
    () => matchFont({ fontFamily: "Helvetica", fontSize: 11 }),
    [],
  );
  const values = data.flatMap((d) => [d.weight, d.goal]);
  const low = Math.min(...values),
    high = Math.max(...values);
  const margin = Math.max((high - low) * 0.25, unit === "kg" ? 0.5 : 1);
  const first = data[0]?.x ?? 0,
    last = data[data.length - 1]?.x ?? first;
  const findNearest = useCallback(
    (event: { x: number; y: number }) => {
      const nearest = locations.reduce<Point | null>(
        (best, point) =>
          !best ||
          Math.hypot(event.x - point.x, event.y - point.y) <
            Math.hypot(event.x - best.x, event.y - best.y)
            ? point
            : best,
        null,
      );
      return nearest &&
        Math.hypot(event.x - nearest.x, event.y - nearest.y) < 30
        ? nearest
        : null;
    },
    [locations],
  );
  const handleTap = useCallback(
    (event: { x: number; y: number }) => {
      const nearest = findNearest(event);
      setSelected((previous) =>
        nearest && previous?.entry === nearest.entry ? null : nearest,
      );
    },
    [findNearest],
  );
  const handleLongPress = useCallback(
    (event: { x: number; y: number }) => {
      const nearest = findNearest(event);
      if (nearest) {
        setSelected(null);
        onLongPress(nearest.entry);
      }
    },
    [findNearest, onLongPress],
  );
  const longPress = useMemo(
    () =>
      Gesture.LongPress()
        .runOnJS(true)
        .minDuration(450)
        .onStart(handleLongPress),
    [handleLongPress],
  );
  const tap = useMemo(
    () => Gesture.Tap().runOnJS(true).onEnd(handleTap),
    [handleTap],
  );
  const gesture = useMemo(
    () => Gesture.Exclusive(longPress, tap),
    [longPress, tap],
  );
  const selectedIndex = selected
    ? entries.findIndex((e) => e === selected.entry)
    : -1;
  const previousEntry = selectedIndex > 0 ? entries[selectedIndex - 1] : null;
  const tooltipDiff =
    selected && previousEntry
      ? displayWeight(selected.entry.weightKg - previousEntry.weightKg, unit)
      : null;
  return (
    <View
      style={{ flex: 1 }}
      accessibilityLabel="体重推移グラフ。丸をタップすると詳細、長押しで編集・削除できます。"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <CartesianChart
        data={data}
        xKey="x"
        yKeys={["weight", "goal"]}
        padding={{ top: 15, right: 14, bottom: 5, left: 0 }}
        domain={{
          x:
            first === last
              ? [first - 86400000, last + 86400000]
              : [first, last],
          y: [low - margin, high + margin],
        }}
        domainPadding={{ left: 12, right: 12 }}
        customGestures={gesture}
        onScaleChange={(xScale, yScale) => {
          const next = entries.map((entry, i) => ({
            x: xScale(data[i].x),
            y: yScale(data[i].weight),
            entry,
          }));
          setLocations((previous) =>
            previous.length === next.length &&
            previous.every(
              (point, i) =>
                point.x === next[i].x &&
                point.y === next[i].y &&
                point.entry === next[i].entry,
            )
              ? previous
              : next,
          );
        }}
        axisOptions={{
          font,
          labelColor: colors.muted,
          lineColor: colors.border,
          tickCount: { x: 4, y: 5 },
          formatXLabel: (value) => {
            const d = new Date(Number(value));
            return `${d.getMonth() + 1}/${d.getDate()}`;
          },
          formatYLabel: (value) => Number(value).toFixed(1),
        }}
      >
        {({ points }) => (
          <>
            {goal != null && (
              <Line
                points={points.goal}
                color={colors.danger}
                strokeWidth={2}
                curveType="linear"
              />
            )}
            <Line
              points={points.weight}
              color={colors.accentText}
              strokeWidth={3}
              curveType="linear"
            />
            <Scatter points={points.weight} radius={5} color={colors.card} />
            <Scatter
              points={points.weight}
              radius={5}
              color={colors.accentText}
              style="stroke"
              strokeWidth={2}
            />
          </>
        )}
      </CartesianChart>
      {selected && (
        <View
          pointerEvents="none"
          style={[
            s.tooltip,
            {
              left: Math.min(Math.max(selected.x - 55, 4), width - 114),
              top: Math.max(selected.y - 68, 4),
            },
          ]}
        >
          <Text style={s.tooltipDate}>{prettyDate(selected.entry.date)}</Text>
          <Text style={s.tooltipWeight}>
            {displayWeight(selected.entry.weightKg, unit).toFixed(1)} {unit}
          </Text>
          {tooltipDiff != null && (
            <Text style={s.tooltipDiff}>
              {tooltipDiff > 0 ? "+" : ""}
              {tooltipDiff.toFixed(1)} {unit}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  tooltip: {
    position: "absolute",
    width: 110,
    backgroundColor: colors.ink,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 2,
  },
  tooltipDate: { color: colors.card, fontSize: 11, fontWeight: "600" },
  tooltipWeight: { color: colors.card, fontSize: 15, fontWeight: "700" },
  tooltipDiff: { color: colors.card, fontSize: 11, opacity: 0.8 },
});
