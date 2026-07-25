import {useCallback, useEffect, useState} from 'react';
import {taskCache} from '../services/taskCache';
import {taskService} from '../services/taskService';
import {Task} from '../types/task';
import {mergeTasksWithCache} from '../utils/mergeTasks';

export interface UseTasksReturn {
  tasks: Task[];
  isRefreshing: boolean;
  isOffline: boolean;
  lastRefreshedAt: string | null;
  error: string | null;
  refreshTasks: () => Promise<void>;
  createTask: (input: {
    title: string;
    categoryId: string;
    dueDate?: string;
    completed: boolean;
    starred?: boolean;
  }) => Promise<Task>;
  updateTask: (
    id: string,
    updates: {title: string; completed: boolean},
  ) => Promise<Task>;
  toggleStar: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export const useTasks = (): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Helper to sync any locally created tasks (`isLocalOnly: true`) to backend
   * whenever connectivity is established during refresh.
   */
  const syncPendingLocalTasks = async (cachedList: Task[]): Promise<Task[]> => {
    let currentList = [...cachedList];
    const pendingLocals = currentList.filter(
      t => t.isLocalOnly || t.id.startsWith('local_'),
    );

    for (const localTask of pendingLocals) {
      try {
        const syncedRemote = await taskService.create({
          title: localTask.title,
          categoryId: localTask.categoryId,
          dueDate: localTask.dueDate,
          completed: localTask.completed,
          starred: localTask.starred,
        });

        // Preserve local starred status if user starred it locally
        syncedRemote.starred = localTask.starred;

        // Replace local temporary task with newly created remote task
        currentList = currentList.map(t =>
          t.id === localTask.id ? syncedRemote : t,
        );
      } catch {
        // Failed to sync this local task; keep it as local-only for next sync attempt
      }
    }

    return currentList;
  };

  /**
   * Background refresh & merge logic:
   * 1. Reads local cache.
   * 2. Attempts to sync pending offline-created tasks to remote backend.
   * 3. Fetches fresh remote tasks from Supabase.
   * 4. Merges remote data with local cache (preserving `starred` and unsynced local tasks).
   * 5. Saves merged result into local cache & updates UI state.
   */
  const refreshTasks = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      let cached = await taskCache.read();

      // First, attempt to push any unsynced local tasks to the backend
      cached = await syncPendingLocalTasks(cached);

      // Next, fetch latest tasks from remote backend
      const remote = await taskService.list();

      // Merge remote data with cached state while preserving local starred flags & remaining unsynced items
      const merged = mergeTasksWithCache(remote, cached);

      await taskCache.write(merged);
      const updatedTimestamp = await taskCache.getLastRefreshed();

      setTasks(merged);
      setLastRefreshedAt(updatedTimestamp);
      setIsOffline(false);
    } catch (err) {
      // If network is offline, keep showing local cached tasks (including offline created tasks)
      setIsOffline(true);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to sync with server. Showing cached tasks.',
      );
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  /**
   * Initial load:
   * 1. Reads local cache first and populates UI immediately.
   * 2. Triggers background refresh & merge from backend.
   */
  useEffect(() => {
    let isMounted = true;

    const initializeState = async () => {
      // 1. Read from local cache first
      const cached = await taskCache.read();
      const lastRefreshed = await taskCache.getLastRefreshed();

      if (isMounted) {
        setTasks(cached);
        setLastRefreshedAt(lastRefreshed);
      }

      // 2. Refresh from backend and merge
      await refreshTasks();
    };

    initializeState();

    return () => {
      isMounted = false;
    };
  }, [refreshTasks]);

  /**
   * Create Task:
   * Tries pushing to backend first.
   * If backend succeeds -> saves remote task to cache & UI state.
   * If internet is unavailable / backend fails -> creates task locally with temp ID,
   * caches it locally, updates UI state, and marks as offline for future background merge.
   */
  const createTask = async (input: {
    title: string;
    categoryId: string;
    dueDate?: string;
    completed: boolean;
    starred?: boolean;
  }): Promise<Task> => {
    setError(null);
    try {
      const created = await taskService.create(input);
      const updatedList = await taskCache.addTask(created);
      setTasks(updatedList);
      setIsOffline(false);
      return created;
    } catch {
      // Fallback: Internet unavailable or backend request failed -> cache locally!
      const localTask: Task = {
        id: `local_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        title: input.title,
        categoryId: input.categoryId,
        dueDate: input.dueDate,
        createdAt: new Date().toISOString(),
        completed: input.completed,
        starred: input.starred ?? false,
        isLocalOnly: true,
      };

      const updatedList = await taskCache.addTask(localTask);
      setTasks(updatedList);
      setIsOffline(true);
      return localTask;
    }
  };

  /**
   * Update task:
   * Writes to backend if online. Updates local cache & state immediately.
   * If offline, updates local cache directly so edits are preserved locally.
   */
  const updateTask = async (
    id: string,
    updates: {title: string; completed: boolean},
  ): Promise<Task> => {
    setError(null);
    const existing = tasks.find(t => t.id === id);

    let updatedTask: Task;

    if (id.startsWith('local_') || existing?.isLocalOnly) {
      // Local-only task, update in local cache directly
      updatedTask = {
        ...existing!,
        title: updates.title,
        completed: updates.completed,
        updatedAt: new Date().toISOString(),
      };
    } else {
      try {
        updatedTask = await taskService.update(id, updates);
        if (existing) {
          updatedTask.starred = existing.starred;
        }
        setIsOffline(false);
      } catch {
        // Network unavailable, update local copy in cache
        updatedTask = {
          ...existing!,
          title: updates.title,
          completed: updates.completed,
          updatedAt: new Date().toISOString(),
        };
        setIsOffline(true);
      }
    }

    const updatedList = await taskCache.updateTask(updatedTask);
    setTasks(updatedList);
    return updatedTask;
  };

  /**
   * Toggle star (Local-only field):
   * Updates local cache immediately as `starred` is a per-device flag.
   */
  const toggleStar = async (id: string): Promise<void> => {
    try {
      const updatedList = await taskCache.toggleStar(id);
      setTasks(updatedList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update star state');
    }
  };

  /**
   * Delete Task:
   * Tries to remove from backend if online. Removes from local cache immediately.
   */
  const deleteTask = async (id: string): Promise<void> => {
    setError(null);
    if (!id.startsWith('local_')) {
      try {
        await taskService.remove(id);
        setIsOffline(false);
      } catch {
        setIsOffline(true);
      }
    }
    const updatedList = await taskCache.removeTask(id);
    setTasks(updatedList);
  };

  return {
    tasks,
    isRefreshing,
    isOffline,
    lastRefreshedAt,
    error,
    refreshTasks,
    createTask,
    updateTask,
    toggleStar,
    deleteTask,
  };
};
