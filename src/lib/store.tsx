import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import * as db from "./database";
import type { Unit, WeightEntry } from "./weight";
import * as StoreReview from "expo-store-review";
type State = {
  entries: WeightEntry[];
  unit: Unit;
  onboardingDone: boolean;
  ready: boolean;
  error: string | null;
  reload: () => Promise<void>;
  save: (date: string, kg: number) => Promise<void>;
  remove: (date: string) => Promise<void>;
  changeUnit: (unit: Unit) => Promise<void>;
  completeOnboarding: () => Promise<void>;
};
const Context = createContext<State | null>(null);
export function WeightProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [unit, setUnit] = useState<Unit>("kg");
  const [onboardingDone, setOnboarding] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    try {
      const [rows, savedUnit, done] = await Promise.all([
        db.listWeights(),
        db.getSetting("unit"),
        db.getSetting("onboarding"),
      ]);
      setError(null);
      setEntries(rows);
      setUnit(savedUnit === "lb" ? "lb" : "kg");
      setOnboarding(done === "done");
      setReady(true);
    } catch {
      setError("記録を読み込めませんでした。もう一度お試しください。");
    }
  }, []);
  // SQLite resolves asynchronously before any state update.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);
  async function save(date: string, kg: number) {
    await db.saveWeight(date, kg);
    const rows = await db.listWeights();
    setEntries(rows);
    // 7日分を記録した後、一度だけ自然なタイミングでレビューを依頼。
    if (rows.length >= 7) {
      void (async () => {
        if (
          !(await db.getSetting("reviewRequested")) &&
          (await StoreReview.isAvailableAsync())
        ) {
          await db.setSetting("reviewRequested", "yes");
          await StoreReview.requestReview();
        }
      })().catch(() => {
        /* レビューAPIの失敗で記録を妨げない */
      });
    }
  }
  async function remove(date: string) {
    await db.deleteWeight(date);
    setEntries(await db.listWeights());
  }
  async function changeUnit(next: Unit) {
    await db.setSetting("unit", next);
    setUnit(next);
  }
  async function completeOnboarding() {
    await db.setSetting("onboarding", "done");
    setOnboarding(true);
  }
  return (
    <Context.Provider
      value={{
        entries,
        unit,
        onboardingDone,
        ready,
        error,
        reload,
        save,
        remove,
        changeUnit,
        completeOnboarding,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWeights() {
  const value = useContext(Context);
  if (!value) throw new Error("WeightProvider is required");
  return value;
}
