import React, {useMemo, useState} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenContainer from '../../../components/common/ScreenContainer';
import ScreenHeader from '../../../shared/components/ScreenHeader';
import {useTaskFilters} from '../hooks/useTaskFilters';
import {Task, TaskFilters} from '../types/task';

const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'Review sprint goals',
    description: 'Check the list of priorities for the week.',
    categoryId: 'work',
    dueDate: '2026-07-24',
    createdAt: '2026-07-20T08:30:00.000Z',
    completed: false,
    starred: true,
  },
  {
    id: '2',
    title: 'Plan weekend trip',
    description: 'Map out tickets and lodging.',
    categoryId: 'personal',
    dueDate: '2026-07-25',
    createdAt: '2026-07-21T10:00:00.000Z',
    completed: true,
    starred: false,
  },
];

type TaskListScreenProps = {
  onSelectTask?: (task: Task) => void;
};

const TaskListScreen = ({onSelectTask}: TaskListScreenProps) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'open' | 'done' | undefined>('open');
  const [sortBy, setSortBy] = useState<'dueDate' | 'createdAt'>('createdAt');

  const filters = useMemo<TaskFilters>(
    () => ({
      search,
      status,
      sortBy,
    }),
    [search, sortBy, status],
  );

  const visibleTasks = useTaskFilters(sampleTasks, filters);

  return (
    <ScreenContainer style={styles.screen}>
      <ScreenHeader title="Tasks" subtitle="Filter, sort, and review work locally" />

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.input}
          placeholder="Search tasks"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94a3b8"
        />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.pill, status === 'open' && styles.pillActive]}
          onPress={() => setStatus(status === 'open' ? undefined : 'open')}>
          <Text style={[styles.pillText, status === 'open' && styles.pillTextActive]}>Open</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pill, status === 'done' && styles.pillActive]}
          onPress={() => setStatus(status === 'done' ? undefined : 'done')}>
          <Text style={[styles.pillText, status === 'done' && styles.pillTextActive]}>Done</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pill, sortBy === 'dueDate' && styles.pillActive]}
          onPress={() => setSortBy(sortBy === 'dueDate' ? 'createdAt' : 'dueDate')}>
          <Text style={[styles.pillText, sortBy === 'dueDate' && styles.pillTextActive]}>Sort by due date</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={visibleTasks}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <TouchableOpacity onPress={() => onSelectTask?.(item)}>
            <TaskRow task={item} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </ScreenContainer>
  );
};

const TaskRow = ({task}: {task: Task}) => {
  return (
    <View style={styles.taskCard}>
      <View style={styles.taskMeta}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        {task.starred ? <Text style={styles.star}>★</Text> : null}
      </View>
      <Text style={styles.taskDescription}>{task.description}</Text>
      <View style={styles.taskFooter}>
        <Text style={styles.taskStatus}>{task.completed ? 'Done' : 'Open'}</Text>
        <Text style={styles.taskDue}>Due {task.dueDate ?? 'soon'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    paddingTop: 16,
  },
  searchWrap: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#dfe7f1',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    backgroundColor: '#e8eef8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: '#2563eb',
  },
  pillText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
  },
  listContent: {
    gap: 8,
    paddingBottom: 24,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderColor: '#e5ebf5',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  taskMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
  taskDescription: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 19,
  },
  taskFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  taskStatus: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
  taskDue: {
    color: '#94a3b8',
    fontSize: 12,
  },
  star: {
    color: '#f59e0b',
    fontSize: 16,
  },
});

export default TaskListScreen;
