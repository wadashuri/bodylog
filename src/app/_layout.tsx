import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { WeightProvider } from "../features/weight/WeightProvider";
import { PhotoProvider } from "../features/photo/PhotoProvider";
import { colors } from "../components/ui";
export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <WeightProvider>
          <PhotoProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
              }}
            >
              <Stack.Screen name="(tabs)" />
            </Stack>
          </PhotoProvider>
        </WeightProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
