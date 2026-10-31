"use client";

import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from "react";
import {
  KEYS,
  newTaskId,
  toggleInList,
  useLocalStorage,
  type ProductionTask,
} from "@/lib/store";

interface Collections {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  completed: string[];
  toggleCompleted: (id: string) => void;
  productionList: string[];
  toggleProduction: (id: string) => void;
  tasks: ProductionTask[];
  addTask: (t: Omit<ProductionTask, "id" | "createdAt">) => void;
  updateTask: (id: string, patch: Partial<ProductionTask>) => void;
  deleteTask: (id: string) => void;
}

const Ctx = createContext<Collections | null>(null);

export function CollectionsProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useLocalStorage<string[]>(KEYS.favorites, []);
  const [completed, setCompleted] = useLocalStorage<string[]>(KEYS.completed, []);
  const [productionList, setProductionList] = useLocalStorage<string[]>(KEYS.productionList, []);
  const [tasks, setTasks] = useLocalStorage<ProductionTask[]>(KEYS.tasks, []);

  const toggleFavorite = useCallback((id: string) => setFavorites((l) => toggleInList(l, id)), [setFavorites]);
  const toggleCompleted = useCallback((id: string) => setCompleted((l) => toggleInList(l, id)), [setCompleted]);
  const toggleProduction = useCallback((id: string) => setProductionList((l) => toggleInList(l, id)), [setProductionList]);

  const addTask = useCallback(
    (t: Omit<ProductionTask, "id" | "createdAt">) =>
      setTasks((list) => [...list, { ...t, id: newTaskId(), createdAt: new Date().toISOString() }]),
    [setTasks]
  );
  const updateTask = useCallback(
    (id: string, patch: Partial<ProductionTask>) =>
      setTasks((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    [setTasks]
  );
  const deleteTask = useCallback((id: string) => setTasks((list) => list.filter((t) => t.id !== id)), [setTasks]);

  return (
    <Ctx.Provider
      value={{ favorites, toggleFavorite, completed, toggleCompleted, productionList, toggleProduction, tasks, addTask, updateTask, deleteTask }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCollections(): Collections {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCollections must be used inside CollectionsProvider");
  return ctx;
}

/** Stable key for an opportunity instance (event + occurrence year). */
export function oppKey(eventId: string, year: number): string {
  return `${eventId}@${year}`;
}
