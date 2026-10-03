import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useWeights } from '../lib/store';
import { dateObject, displayWeight, localDate, parseWeight, prettyDate } from '../lib/weight';
import { Button, colors, styles } from '../components/ui';
export default function Record() {
  const params = useLocalSearchParams<{ date?: string }>();
  const { entries, unit, save, remove } = useWeights();
  const [date, setDate] = useState(params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : localDate());
  const existing = entries.find(e => e.date === date);
  const last = entries[entries.length - 1];
  const [value, setValue] = useState(existing ? displayWeight(existing.weightKg, unit).toFixed(1) : last ? displayWeight(last.weightKg, unit).toFixed(1) : '');
  const [replace, setReplace] = useState(true);
  const [showDate, setShowDate] = useState(false);
  const [busy, setBusy] = useState(false);
  const kg = parseWeight(value, unit);
  function key(input: string) {
    void Haptics.selectionAsync().catch(() => {});
    if (input === 'C') { setValue(''); setReplace(false); return; }
    if (input === 'back') { setValue(value.slice(0, -1)); setReplace(false); return; }
    const base = replace ? '' : value;
    if (input === '.' && base.includes('.')) return;
    const next = input === '.' && !base ? '0.' : base === '0' && input !== '.' ? input : base + input;
    if (/^\d{0,3}(\.\d{0,2})?$/.test(next)) { setValue(next); setReplace(false); }
  }
  async function submit() {
    if (kg === null || busy) return;
    setBusy(true);
    try { await save(date, kg); void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); router.back(); }
    catch { Alert.alert('保存できませんでした', '記録は閉じずに残しています。もう一度お試しください。'); }
    finally { setBusy(false); }
  }
  function confirmDelete() {
    Alert.alert('この日の記録を削除しますか？', prettyDate(date), [{ text: 'キャンセル', style: 'cancel' }, { text: '削除', style: 'destructive', onPress: async () => { setBusy(true); try { await remove(date); router.back(); } catch { Alert.alert('削除できませんでした', 'もう一度お試しください。'); } finally { setBusy(false); } } }]);
  }
  return <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={[styles.content, { gap: 24 }]}>
    <View style={styles.row}><Text style={styles.title}>{existing ? '体重を編集' : '体重を記録'}</Text><Pressable accessibilityRole="button" accessibilityLabel="閉じる" hitSlop={15} disabled={busy} onPress={() => router.back()}><Ionicons name="close" size={25} color={colors.ink}/></Pressable></View>
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityLabel="記録日を変更" disabled={busy} onPress={() => setShowDate(!showDate)} style={styles.row}><Text style={styles.text}>記録日</Text><View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}><Text style={{ fontSize: 15, color: colors.ink }}>{prettyDate(date)}</Text><Ionicons name="calendar-outline" size={19} color={colors.accent}/></View></Pressable>
      {showDate && <DateTimePicker value={dateObject(date)} maximumDate={new Date()} minimumDate={new Date('2000-01-01T12:00:00')} mode="date" display="spinner" locale="ja-JP" themeVariant="light" onChange={(_, next) => { if (!next) return; const nextDate = localDate(next); setDate(nextDate); const record = entries.find(e => e.date === nextDate); setValue(record ? displayWeight(record.weightKg, unit).toFixed(1) : last ? displayWeight(last.weightKg, unit).toFixed(1) : ''); setReplace(true); }}/ >}
      <View style={s.weight}><Text style={[s.number, replace && { color: colors.accent }]}>{value || '0.0'}</Text><Text style={s.unit}>{unit}</Text></View>
      <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 12 }}>{replace && value ? '前回の値を表示しています。そのまま保存できます。' : '数字をタップして入力'}</Text>
    </View>
    <View style={s.keypad}>{['1','2','3','4','5','6','7','8','9','.','0','back'].map(k => <Pressable key={k} disabled={busy} accessibilityRole="button" accessibilityLabel={k === 'back' ? '1文字消す' : k === '.' ? '小数点' : k} onPress={() => key(k)} style={({ pressed }) => [s.key, { backgroundColor: pressed ? colors.pale : colors.card }]}>{k === 'back' ? <Ionicons name="backspace-outline" size={27} color={colors.ink}/> : <Text style={s.keyText}>{k}</Text>}</Pressable>)}</View>
    {value && kg === null && <Text style={{ color: colors.danger, fontSize: 13 }}>20〜350kg相当の体重を入力してください。</Text>}
    <Button label={busy ? '保存中…' : existing ? '変更を保存' : '記録を保存'} disabled={kg === null || busy} onPress={() => void submit()}/>
    <View style={styles.row}><Pressable accessibilityRole="button" disabled={busy} hitSlop={12} onPress={() => key('C')}><Text style={styles.text}>入力をクリア</Text></Pressable>{existing && <Pressable accessibilityRole="button" disabled={busy} hitSlop={12} onPress={confirmDelete}><Text style={{ color: colors.danger, fontSize: 14 }}>この記録を削除</Text></Pressable>}</View>
  </ScrollView></SafeAreaView>;
}
const s = StyleSheet.create({ weight: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', gap: 10, marginTop: 28, marginBottom: 14 }, number: { fontSize: 64, fontWeight: '500', color: colors.ink, fontVariant: ['tabular-nums'], letterSpacing: -2 }, unit: { fontSize: 20, color: colors.muted }, keypad: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, key: { width: '31%', flexGrow: 1, height: 72, justifyContent: 'center', alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: colors.border }, keyText: { fontSize: 30, color: colors.ink, fontWeight: '500' } });
