import {Task} from '../types/task';
import {mergeTasksWithCache} from '../utils/mergeTasks';

describe('mergeTasksWithCache', () => {
  const cachedTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Fix cache bug',
      categoryId: '1',
      dueDate: '2026-07-26',
      createdAt: '2026-07-25T10:00:00.000Z',
      completed: false,
      starred: true, // Starred locally!
    },
    {
      id: 'task-2',
      title: 'Setup Supabase',
      categoryId: '1',
      dueDate: '2026-07-27',
      createdAt: '2026-07-25T11:00:00.000Z',
      completed: true,
      starred: false,
    },
  ];

  const remoteTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Fix cache bug (Updated title from backend)',
      categoryId: '1',
      dueDate: '2026-07-26',
      createdAt: '2026-07-25T10:00:00.000Z',
      completed: false,
      starred: false, // Remote returns false because starred is local-only
    },
    {
      id: 'task-2',
      title: 'Setup Supabase',
      categoryId: '1',
      dueDate: '2026-07-27',
      createdAt: '2026-07-25T11:00:00.000Z',
      completed: true,
      starred: false,
    },
    {
      id: 'task-3',
      title: 'New remote task',
      categoryId: '2',
      dueDate: '2026-07-28',
      createdAt: '2026-07-25T12:00:00.000Z',
      completed: false,
      starred: false,
    },
  ];

  it('preserves local starred flag when remote data refreshes', () => {
    const merged = mergeTasksWithCache(remoteTasks, cachedTasks);

    expect(merged).toHaveLength(3);

    // task-1 title should update from remote, but starred remains true from cache
    const task1 = merged.find(t => t.id === 'task-1');
    expect(task1).toBeDefined();
    expect(task1?.title).toBe('Fix cache bug (Updated title from backend)');
    expect(task1?.starred).toBe(true);

    // task-3 is new from remote, starred defaults to false
    const task3 = merged.find(t => t.id === 'task-3');
    expect(task3?.starred).toBe(false);
  });
});
