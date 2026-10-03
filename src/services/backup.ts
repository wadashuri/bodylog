import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { toWeightCsv, type WeightEntry } from "../features/weight/model";
export async function exportWeightsCsv(entries: WeightEntry[]): Promise<void> {
  const file = new File(Paths.cache, `bodylog-${Date.now()}.csv`);
  file.write(toWeightCsv(entries));
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/csv",
      dialogTitle: "体重データを書き出す",
    });
  }
}
export async function pickWeightCsvText(): Promise<string | null> {
  const picked = await File.pickFileAsync();
  if (picked.canceled || !picked.result) return null;
  return picked.result.text();
}
