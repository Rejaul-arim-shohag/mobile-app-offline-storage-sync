import {Task} from '../types/task';

export const taskService = {
  async list(): Promise<Task[]> {
    return [];
  },

  async create(task: Omit<Task, 'id' | 'createdAt'> & {createdAt?: string}): Promise<Task> {
    return {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: task.createdAt ?? new Date().toISOString(),
      starred: false,
    };
  },
};
