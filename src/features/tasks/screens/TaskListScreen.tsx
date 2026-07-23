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

const TaskListScreen = () => {
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

      <TextInput
        style={styles.input}
        placeholder="Search tasks"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.pill, status === 'open' && styles.pillActive]}
          onPress={() => setStatus(status === 'open' ? undefined : 'open')}>
          <Text style={styles.pillText}>Open</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pill, status === 'done' && styles.pillActive]}
          onPress={() => setStatus(status === 'done' ? undefined : 'done')}>
          <Text style={styles.pillText}>Done</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pill, sortBy === 'dueDate' && styles.pillActive]}
          onPress={() => setSortBy(sortBy === 'dueDate' ? 'createdAt' : 'dueDate')}>
          <Text style={styles.pillText}>Sort by due date</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={visibleTasks}
        keyExtractor={item => item.id}
        renderItem={({item}) => <TaskRow task={item} />}
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
      <Text style={styles.taskStatus}>{task.completed ? 'Done' : 'Open'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    paddingTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#d1d5db',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: '#2563eb',
  },
  pillText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    gap: 8,
    paddingBottom: 24,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  taskMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  taskDescription: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 4,
  },
  taskStatus: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  star: {
    color: '#f59e0b',
    fontSize: 16,
  },
});

export default TaskListScreen;
