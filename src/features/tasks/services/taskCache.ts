import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../types/task';

const TASKS_KEY = '@tasks_cache';
const TASKS_LAST_REFRESHED_KEY = '@tasks_last_refreshed';

export const taskCache = {
  async read(): Promise<Task[]> {
    try {
      const raw = await AsyncStorage.getItem(TASKS_KEY);
      if (!raw) {
        return [];
      }
      return JSON.parse(raw) as Task[];
    } catch {
      return [];
    }
  },

  async write(tasks: Task[]): Promise<void> {
    const timestamp = new Date().toISOString();
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    await AsyncStorage.setItem(TASKS_LAST_REFRESHED_KEY, timestamp);
  },

  async getLastRefreshed(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TASKS_LAST_REFRESHED_KEY);
    } catch {
      return null;
    }
  },

  async addTask(task: Task): Promise<Task[]> {
    const current = await taskCache.read();
    const next = [task, ...current.filter(t => t.id !== task.id)];
    await taskCache.write(next);
    return next;
  },

  async updateTask(updatedTask: Task): Promise<Task[]> {
    const current = await taskCache.read();
    const next = current.map(t => (t.id === updatedTask.id ? updatedTask : t));
    await taskCache.write(next);
    return next;
  },

  async toggleStar(taskId: string): Promise<Task[]> {
    const current = await taskCache.read();
    const next = current.map(t =>
      t.id === taskId ? { ...t, starred: !t.starred } : t,
    );
    await taskCache.write(next);
    return next;
  },

  async removeTask(taskId: string): Promise<Task[]> {
    const current = await taskCache.read();
    const next = current.filter(t => t.id !== taskId);
    await taskCache.write(next);
    return next;
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(TASKS_KEY);
    await AsyncStorage.removeItem(TASKS_LAST_REFRESHED_KEY);
  },
};
