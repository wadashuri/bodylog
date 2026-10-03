import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Directory, File, Paths } from "expo-file-system";
const PHOTOS_DIR = new Directory(Paths.document, "photos");
const THUMBS_DIR = new Directory(PHOTOS_DIR, "thumbs");
function ensureDirectories() {
  if (!PHOTOS_DIR.exists) PHOTOS_DIR.create({ intermediates: true });
  if (!THUMBS_DIR.exists) THUMBS_DIR.create({ intermediates: true });
}
async function resizeAndSave(
  sourceUri: string,
  width: number,
  compress: number,
): Promise<string> {
  const rendered = await ImageManipulator.manipulate(sourceUri)
    .resize({ width, height: null })
    .renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress });
  return saved.uri;
}
export type CapturedPhoto = { fileName: string; thumbName: string };
export async function capturePhoto(
  date: string,
): Promise<CapturedPhoto | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error("カメラの権限がありません");
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 1,
  });
  if (result.canceled || !result.assets[0]) return null;
  const sourceUri = result.assets[0].uri;
  ensureDirectories();
  const fileName = `${date}.jpg`;
  const thumbName = `${date}.jpg`;
  const fullUri = await resizeAndSave(sourceUri, 1280, 0.7);
  const thumbTempUri = await resizeAndSave(sourceUri, 300, 0.5);
  const destFull = new File(PHOTOS_DIR, fileName);
  const destThumb = new File(THUMBS_DIR, thumbName);
  if (destFull.exists) destFull.delete();
  if (destThumb.exists) destThumb.delete();
  await new File(fullUri).move(destFull);
  await new File(thumbTempUri).move(destThumb);
  return { fileName, thumbName };
}
export function photoUri(fileName: string): string {
  return new File(PHOTOS_DIR, fileName).uri;
}
export function thumbUri(thumbName: string): string {
  return new File(THUMBS_DIR, thumbName).uri;
}
export function deletePhotoFiles(fileName: string, thumbName: string): void {
  const full = new File(PHOTOS_DIR, fileName);
  if (full.exists) full.delete();
  const thumb = new File(THUMBS_DIR, thumbName);
  if (thumb.exists) thumb.delete();
}
