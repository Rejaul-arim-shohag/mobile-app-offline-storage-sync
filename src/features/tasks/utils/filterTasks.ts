import {Task, TaskFilters} from '../types/task';

export const filterTasks = (tasks: Task[], filters: TaskFilters) => {
  const categoryFiltered = filters.categoryId
    ? tasks.filter(task => task.categoryId === filters.categoryId)
    : tasks;

  const statusFiltered = filters.status
    ? categoryFiltered.filter(task =>
        filters.status === 'done' ? task.completed : !task.completed,
      )
    : categoryFiltered;

  const searchFiltered = filters.search
    ? statusFiltered.filter(task =>
        task.title.toLowerCase().includes(filters.search!.toLowerCase()),
      )
    : statusFiltered;

  return [...searchFiltered].sort((left, right) => {
    if (filters.sortBy === 'dueDate') {
      return (left.dueDate ?? '').localeCompare(right.dueDate ?? '');
    }

    return left.createdAt.localeCompare(right.createdAt);
  });
};
