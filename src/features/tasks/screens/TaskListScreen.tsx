import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenContainer from '../../../components/common/ScreenContainer';
import ScreenHeader from '../../../shared/components/ScreenHeader';
import {
  Category,
  fetchCategories,
} from '../../categories/services/categoriesService';
import {useTaskFilters} from '../hooks/useTaskFilters';
import {taskService} from '../services/taskService';
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

const SHEET_HIDDEN_OFFSET = 380;

const TaskListScreen = ({onSelectTask}: TaskListScreenProps) => {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'open' | 'done' | undefined>('open');
  const [sortBy, setSortBy] = useState<'dueDate' | 'createdAt'>('createdAt');
  const [isCreateSheetVisible, setIsCreateSheetVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('general');
  const [categoryName, setCategoryName] = useState('General');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const sheetTranslateY = useRef(new Animated.Value(SHEET_HIDDEN_OFFSET)).current;

  const filters = useMemo<TaskFilters>(
    () => ({
      search,
      status,
      sortBy,
    }),
    [search, sortBy, status],
  );

  const visibleTasks = useTaskFilters(tasks, filters);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesError(null);
        const nextCategories = await fetchCategories();
        setCategories(nextCategories);

        if (nextCategories.length > 0) {
          setCategoryId(nextCategories[0].id.toString());
          setCategoryName(nextCategories[0].name);
        }
      } catch (err) {
        setCategoriesError(err instanceof Error ? err.message : 'Unable to load categories');
      }
    };

    loadCategories();
  }, []);

  const openCreateSheet = () => {
    setCreateError(null);
    setIsCreateSheetVisible(true);
    Animated.spring(sheetTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
      mass: 0.9,
    }).start();
  };

  const closeCreateSheet = () => {
    Animated.timing(sheetTranslateY, {
      toValue: SHEET_HIDDEN_OFFSET,
      duration: 180,
      useNativeDriver: true,
    }).start(({finished}) => {
      if (finished) {
        setIsCreateSheetVisible(false);
        setTitle('');
        setDescription('');
        if (categories.length > 0) {
          setCategoryId(categories[0].id.toString());
          setCategoryName(categories[0].name);
        }
        setIsCategoryDropdownOpen(false);
        setDueDate('');
        setCreateError(null);
      }
    });
  };

  const createTask = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isCreating) {
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);

      const createdTask = await taskService.create({
        title: trimmedTitle,
        description: description.trim(),
        categoryId: categoryId.trim() || (categories[0]?.id.toString() ?? 'general'),
        dueDate: dueDate.trim() || undefined,
        completed: false,
        starred: false,
      });

      setTasks(prev => [createdTask, ...prev]);
      closeCreateSheet();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Unable to create task');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScreenContainer style={styles.screen}>
      <ScreenHeader title="Tasks" subtitle="Filter, sort, and review work locally" />

      <TouchableOpacity style={styles.createButton} onPress={openCreateSheet}>
        <Text style={styles.createButtonText}>Create Task</Text>
      </TouchableOpacity>

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

      {isCreateSheetVisible ? (
        <View style={styles.sheetRoot} pointerEvents="box-none">
          <Pressable style={styles.sheetBackdrop} onPress={closeCreateSheet} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Animated.View style={[styles.sheet, {transform: [{translateY: sheetTranslateY}]}]}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Create Task</Text>

              <TextInput
                style={styles.sheetInput}
                placeholder="Title"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                style={styles.sheetInput}
                placeholder="Description"
                value={description}
                onChangeText={setDescription}
                placeholderTextColor="#94a3b8"
              />

              <View>
                <Text style={styles.dropdownLabel}>Category</Text>
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => setIsCategoryDropdownOpen(prev => !prev)}>
                  <Text style={styles.dropdownText}>{categoryName}</Text>
                  <Text style={styles.dropdownChevron}>{isCategoryDropdownOpen ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {isCategoryDropdownOpen ? (
                  <View style={styles.dropdownMenu}>
                    {categories.length === 0 ? (
                      <Text style={styles.dropdownEmptyText}>No categories available</Text>
                    ) : (
                      categories.map(item => {
                        const selected = categoryId === item.id.toString();
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={[styles.dropdownItem, selected ? styles.dropdownItemSelected : null]}
                            onPress={() => {
                              setCategoryId(item.id.toString());
                              setCategoryName(item.name);
                              setIsCategoryDropdownOpen(false);
                            }}>
                            <Text
                              style={[styles.dropdownItemText, selected ? styles.dropdownItemTextSelected : null]}>
                              {item.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                ) : null}
              </View>

              <TextInput
                style={styles.sheetInput}
                placeholder="Due Date (YYYY-MM-DD)"
                value={dueDate}
                onChangeText={setDueDate}
                placeholderTextColor="#94a3b8"
              />

              {categoriesError ? <Text style={styles.errorText}>{categoriesError}</Text> : null}

              {createError ? <Text style={styles.errorText}>{createError}</Text> : null}

              <View style={styles.sheetActions}>
                <TouchableOpacity style={[styles.sheetActionButton, styles.cancelButton]} onPress={closeCreateSheet}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sheetActionButton, styles.confirmButton, isCreating ? styles.disabledButton : null]}
                  onPress={createTask}
                  disabled={isCreating}>
                  <Text style={styles.confirmButtonText}>{isCreating ? 'Creating...' : 'Create'}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      ) : null}
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
  createButton: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 10,
    marginBottom: 12,
    paddingVertical: 10,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '700',
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
  sheetRoot: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 10,
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: '#cbd5e1',
    borderRadius: 999,
    height: 5,
    marginBottom: 4,
    width: 42,
  },
  sheetTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '700',
  },
  sheetInput: {
    backgroundColor: '#fff',
    borderColor: '#dfe7f1',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  dropdownTrigger: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#dfe7f1',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownChevron: {
    color: '#64748b',
    fontSize: 11,
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderColor: '#dfe7f1',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownItemSelected: {
    backgroundColor: '#eff6ff',
  },
  dropdownItemText: {
    color: '#334155',
    fontSize: 14,
  },
  dropdownItemTextSelected: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  dropdownEmptyText: {
    color: '#64748b',
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  sheetActionButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelButton: {
    backgroundColor: '#e2e8f0',
  },
  cancelButtonText: {
    color: '#334155',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#2563eb',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
  },
});

export default TaskListScreen;
