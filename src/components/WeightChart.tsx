import { useCallback, useMemo, useRef } from "react";
import { View } from "react-native";
import { CartesianChart, Line, Scatter } from "victory-native";
import { matchFont } from "@shopify/react-native-skia";
import { Gesture } from "react-native-gesture-handler";
import { colors } from "./ui";
import {
  dateObject,
  displayWeight,
  type Unit,
  type WeightEntry,
} from "../lib/weight";
export function WeightChart({
  entries,
  unit,
  onSelect,
}: {
  entries: WeightEntry[];
  unit: Unit;
  onSelect: (entry: WeightEntry) => void;
}) {
  const data = useMemo(
    () =>
      entries.map((e) => ({
        x: dateObject(e.date).getTime(),
        weight: displayWeight(e.weightKg, unit),
      })),
    [entries, unit],
  );
  const locations = useRef<{ x: number; y: number; entry: WeightEntry }[]>([]);
  const font = useMemo(
    () => matchFont({ fontFamily: "Helvetica", fontSize: 11 }),
    [],
  );
  const values = data.map((d) => d.weight);
  const low = Math.min(...values),
    high = Math.max(...values);
  const margin = Math.max((high - low) * 0.25, unit === "kg" ? 0.5 : 1);
  const first = data[0]?.x ?? 0,
    last = data[data.length - 1]?.x ?? first;
  const handleTap = useCallback(
    (event: { x: number; y: number }) => {
      const nearest = locations.current.reduce<{
        x: number;
        y: number;
        entry: WeightEntry;
      } | null>(
        (best, point) =>
          !best ||
          Math.hypot(event.x - point.x, event.y - point.y) <
            Math.hypot(event.x - best.x, event.y - best.y)
            ? point
            : best,
        null,
      );
      if (nearest && Math.hypot(event.x - nearest.x, event.y - nearest.y) < 30)
        onSelect(nearest.entry);
    },
    [onSelect],
  );
  // RNGH registers this callback; it never invokes it during render.
  const gesture = useMemo(
    // eslint-disable-next-line react-hooks/refs
    () => Gesture.Race(Gesture.Tap().runOnJS(true).onEnd(handleTap)),
    [handleTap],
  );
  return (
    <View
      style={{ height: 210 }}
      accessibilityLabel="体重推移グラフ。下の記録一覧からも編集できます。"
    >
      <CartesianChart
        data={data}
        xKey="x"
        yKeys={["weight"]}
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
          locations.current = entries.map((entry, i) => ({
            x: xScale(data[i].x),
            y: yScale(data[i].weight),
            entry,
          }));
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
    </View>
  );
}
