export type TaskStatus = 'open' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  dueDate?: string;
  createdAt: string;
  completed: boolean;
  starred: boolean;
}

export interface TaskFilters {
  categoryId?: string;
  status?: TaskStatus;
  search?: string;
  sortBy: 'dueDate' | 'createdAt';
}
