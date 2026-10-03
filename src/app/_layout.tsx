import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WeightProvider } from '../lib/store';
import { colors } from '../components/ui';
export default function Layout() {
  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><WeightProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}><Stack.Screen name="index"/><Stack.Screen name="settings"/><Stack.Screen name="record" options={{ presentation: 'modal' }}/></Stack></WeightProvider></SafeAreaProvider></GestureHandlerRootView>;
}
