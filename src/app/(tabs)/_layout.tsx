import { Tabs } from "expo-router";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../components/ui";
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="graph"
        options={{
          title: "グラフ",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" size={size} color={color} />
          ),
        }}
      />
      {/* index.tsx is the 記録 screen so cold launch at "/" opens it directly */}
      <Tabs.Screen
        name="index"
        options={{
          title: "記録",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: focused ? colors.accent : colors.pale,
              }}
            >
              <Ionicons
                name="create"
                size={19}
                color={focused ? colors.onAccent : color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="photos"
        options={{
          title: "写真",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="images-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "設定",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
