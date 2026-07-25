import AsyncStorage from '@react-native-async-storage/async-storage';
import {taskCache} from '../services/taskCache';
import {Task} from '../types/task';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('taskCache service', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Cached task 1',
      categoryId: '1',
      createdAt: '2026-07-25T10:00:00.000Z',
      completed: false,
      starred: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reads tasks from AsyncStorage correctly', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(mockTasks),
    );

    const result = await taskCache.read();
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@tasks_cache');
    expect(result).toEqual(mockTasks);
  });

  it('writes tasks and timestamp to AsyncStorage', async () => {
    await taskCache.write(mockTasks);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tasks_cache',
      JSON.stringify(mockTasks),
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@tasks_last_refreshed',
      expect.any(String),
    );
  });

  it('toggles starred flag locally in cache', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(mockTasks),
    );

    const updatedList = await taskCache.toggleStar('1');
    expect(updatedList[0].starred).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});
