import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import * as db from "../../services/database";
import * as storage from "../../services/photoStorage";
import type { PhotoEntry } from "./model";
type State = {
  photos: PhotoEntry[];
  ready: boolean;
  error: string | null;
  capture: (date: string) => Promise<void>;
  remove: (date: string) => Promise<void>;
};
const Context = createContext<State | null>(null);
export function PhotoProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    try {
      const rows = await db.listPhotos();
      setError(null);
      setPhotos(rows);
      setReady(true);
    } catch {
      setError("写真を読み込めませんでした。もう一度お試しください。");
    }
  }, []);
  useEffect(() => {
    // 非同期の読み込み完了で状態を更新する。レンダー中には更新しない。
    void Promise.resolve().then(reload);
  }, [reload]);
  async function capture(date: string) {
    const captured = await storage.capturePhoto(date);
    if (!captured) return;
    await db.savePhotoRecord(date, captured.fileName, captured.thumbName);
    setPhotos(await db.listPhotos());
  }
  async function remove(date: string) {
    const existing = photos.find((p) => p.date === date);
    await db.deletePhotoRecord(date);
    if (existing)
      storage.deletePhotoFiles(existing.fileName, existing.thumbName);
    setPhotos(await db.listPhotos());
  }
  return (
    <Context.Provider value={{ photos, ready, error, capture, remove }}>
      {children}
    </Context.Provider>
  );
}
export function usePhotos() {
  const value = useContext(Context);
  if (!value) throw new Error("PhotoProvider is required");
  return value;
}
