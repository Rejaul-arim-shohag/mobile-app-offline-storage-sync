import {Task} from '../types/task';

/**
 * Merges newly fetched remote tasks with locally cached tasks.
 * 1. Preserves local-only fields (such as `starred`) per device.
 * 2. Retains locally created tasks (`isLocalOnly` or `id.startsWith('local_')`)
 *    that haven't been synced to the backend yet.
 */
export const mergeTasksWithCache = (
  remoteTasks: Task[],
  cachedTasks: Task[],
): Task[] => {
  const cachedMap = new Map<string, Task>(cachedTasks.map(t => [t.id, t]));

  // Retain unsynced locally created tasks
  const unsyncedLocalTasks = cachedTasks.filter(
    t => t.isLocalOnly || t.id.startsWith('local_'),
  );

  const mergedRemote = remoteTasks.map(remote => {
    const cached = cachedMap.get(remote.id);
    return {
      ...remote,
      // Preserve local-only `starred` field if present in cache, default to remote/false
      starred: cached !== undefined ? cached.starred : (remote.starred ?? false),
    };
  });

  const remoteIds = new Set(mergedRemote.map(r => r.id));
  const remainingLocals = unsyncedLocalTasks.filter(l => !remoteIds.has(l.id));

  return [...remainingLocals, ...mergedRemote];
};
