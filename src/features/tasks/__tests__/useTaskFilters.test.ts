import {useTaskFilters} from '../hooks/useTaskFilters';
import {Task} from '../types/task';

describe('useTaskFilters', () => {
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Ship feature',
      description: 'Deploy the task manager MVP',
      categoryId: 'work',
      dueDate: '2026-07-24',
      createdAt: '2026-07-20T08:30:00.000Z',
      completed: false,
      starred: true,
    },
    {
      id: '2',
      title: 'Grocery run',
      description: 'Buy vegetables',
      categoryId: 'personal',
      dueDate: '2026-07-22',
      createdAt: '2026-07-21T10:00:00.000Z',
      completed: true,
      starred: false,
    },
  ];

  it('filters by status and search and sorts by due date', () => {
    const result = useTaskFilters(tasks, {
      search: 'ship',
      status: 'open',
      sortBy: 'dueDate',
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });
});
