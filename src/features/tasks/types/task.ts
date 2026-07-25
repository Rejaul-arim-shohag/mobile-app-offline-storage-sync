export type TaskStatus = 'open' | 'done';

export interface Task {
  id: string;
  title: string;
  categoryId: string;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  completed: boolean;
  starred: boolean;
  isLocalOnly?: boolean;
}

export interface TaskFilters {
  categoryId?: string;
  status?: TaskStatus;
  search?: string;
  sortBy: 'dueDate' | 'createdAt';
}
