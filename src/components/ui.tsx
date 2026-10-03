import {
  Pressable,
  StyleSheet,
  Text,
  type ViewStyle,
  type StyleProp,
} from "react-native";
export const colors = {
  bg: "#FAF8F5",
  card: "#FFFFFF",
  ink: "#2C3540",
  muted: "#7B828B",
  accent: "#F2AE68",
  accentText: "#A65C24",
  border: "#EAE5DF",
  pale: "#FFF1E2",
  danger: "#B84E43",
};
export function Button({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        style,
        { opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, gap: 20, paddingBottom: 36 },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    color: colors.muted,
    fontWeight: "700",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  text: { fontSize: 14, lineHeight: 23, color: colors.muted },
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 17,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonText: { color: "#3A2614", fontWeight: "800", fontSize: 16 },
});
