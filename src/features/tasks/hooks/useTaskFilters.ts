import {useMemo} from 'react';
import {Task, TaskFilters} from '../types/task';
import {filterTasks} from '../utils/filterTasks';

export const useTaskFilters = (tasks: Task[], filters: TaskFilters) => {
  return useMemo(() => filterTasks(tasks, filters), [filters.categoryId, filters.search, filters.sortBy, filters.status, tasks]);
};
