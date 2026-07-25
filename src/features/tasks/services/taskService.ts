import {supabase} from '../../../lib/supabase';
import {Task} from '../types/task';

type TaskRow = {
  id: string | number;
  title: string;
  created_at: string;
  category_id: string | number;
  status: 'open' | 'done';
  due_date: string | null;
  updated_at?: string | null;
};

type CreateTaskInput = {
  title: string;
  categoryId: string;
  dueDate?: string;
  completed: boolean;
  starred?: boolean;
};

const mapTaskRowToTask = (row: TaskRow): Task => {
  return {
    id: String(row.id),
    title: row.title,
    categoryId: String(row.category_id),
    dueDate: row.due_date ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    completed: row.status === 'done',
    starred: false,
  };
};

export const taskService = {
  async list(): Promise<Task[]> {
    const {data, error} = await supabase
      .from('tasks')
      .select('id, title, created_at, category_id, status, due_date, updated_at')
      .order('created_at', {ascending: false});

    if (error) {
      throw error;
    }

    return (data ?? []).map(row => mapTaskRowToTask(row as TaskRow));
  },

  async create(task: CreateTaskInput): Promise<Task> {
    const now = new Date().toISOString();
    const categoryIdAsNumber = Number(task.categoryId);

    const {data, error} = await supabase
      .from('tasks')
      .insert({
        title: task.title,
        category_id: Number.isNaN(categoryIdAsNumber) ? task.categoryId : categoryIdAsNumber,
        status: task.completed ? 'done' : 'open',
        due_date: task.dueDate ?? null,
        created_at: now,
        updated_at: now,
      })
      .select('id, title, created_at, category_id, status, due_date, updated_at')
      .single();

    if (error) {
      throw error;
    }

    const mapped = mapTaskRowToTask(data as TaskRow);
    return {
      ...mapped,
      starred: task.starred ?? false,
    };
  },
};
