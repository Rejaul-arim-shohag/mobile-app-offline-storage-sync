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

type TaskListScreenProps = {
  onSelectTask?: (task: Task) => void;
};

const SHEET_HIDDEN_OFFSET = 380;
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatDateToYmd = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseYmdDate = (value: string): Date | null => {
  if (!value) {
    return null;
  }

  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!year || !month || !day) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const TaskListScreen = ({onSelectTask}: TaskListScreenProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'open' | 'done' | undefined>('open');
  const [sortBy, setSortBy] = useState<'dueDate' | 'createdAt'>('createdAt');
  const [isCreateSheetVisible, setIsCreateSheetVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('general');
  const [categoryName, setCategoryName] = useState('General');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
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
  const selectedDueDate = useMemo(() => parseYmdDate(dueDate), [dueDate]);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cells: Array<number | null> = [];

    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push(null);
    }

    for (let day = 1; day <= totalDays; day += 1) {
      cells.push(day);
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [calendarMonth]);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const nextTasks = await taskService.list();
        setTasks(nextTasks);
      } catch {
        // Keep current list when task fetch fails.
      }
    };

    loadTasks();
  }, []);

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
        if (categories.length > 0) {
          setCategoryId(categories[0].id.toString());
          setCategoryName(categories[0].name);
        }
        setIsCategoryDropdownOpen(false);
        setIsCalendarOpen(false);
        setDueDate('');
        setCreateError(null);
      }
    });
  };

  const openCalendar = () => {
    const baseDate = selectedDueDate ?? new Date();
    setCalendarMonth(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
    setIsCalendarOpen(true);
  };

  const changeCalendarMonth = (direction: -1 | 1) => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const selectDueDate = (day: number) => {
    const selected = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    setDueDate(formatDateToYmd(selected));
    setIsCalendarOpen(false);
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
        categoryId: categoryId.trim() || (categories[0]?.id.toString() ?? 'general'),
        dueDate: dueDate.trim() || undefined,
        completed: false,
        starred: false,
      });

      setTasks(prev => [createdTask, ...prev]);
      closeCreateSheet();
    } catch (err) {
      console.log('taskService', err);
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

              <View>
                <Text style={styles.dropdownLabel}>Due Date</Text>
                <TouchableOpacity style={styles.dropdownTrigger} onPress={openCalendar}>
                  <Text style={styles.dropdownText}>{dueDate || 'Select due date'}</Text>
                  <Text style={styles.dropdownChevron}>▼</Text>
                </TouchableOpacity>

                {dueDate ? (
                  <TouchableOpacity onPress={() => setDueDate('')} style={styles.clearDateButton}>
                    <Text style={styles.clearDateText}>Clear due date</Text>
                  </TouchableOpacity>
                ) : null}

                {isCalendarOpen ? (
                  <View style={styles.calendarWrap}>
                    <View style={styles.calendarHeader}>
                      <TouchableOpacity onPress={() => changeCalendarMonth(-1)} style={styles.calendarNavButton}>
                        <Text style={styles.calendarNavText}>{'<'}</Text>
                      </TouchableOpacity>
                      <Text style={styles.calendarMonthText}>
                        {calendarMonth.toLocaleDateString(undefined, {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Text>
                      <TouchableOpacity onPress={() => changeCalendarMonth(1)} style={styles.calendarNavButton}>
                        <Text style={styles.calendarNavText}>{'>'}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.calendarGrid}>
                      {WEEKDAY_LABELS.map(label => (
                        <Text key={label} style={styles.calendarWeekdayText}>
                          {label}
                        </Text>
                      ))}

                      {calendarDays.map((day, index) => {
                        if (!day) {
                          return <View key={`empty-${index}`} style={styles.calendarDayCell} />;
                        }

                        const currentDate = new Date(
                          calendarMonth.getFullYear(),
                          calendarMonth.getMonth(),
                          day,
                        );
                        const currentDateYmd = formatDateToYmd(currentDate);
                        const isSelected = dueDate === currentDateYmd;

                        return (
                          <TouchableOpacity
                            key={currentDateYmd}
                            style={[styles.calendarDayCell, isSelected ? styles.calendarDayCellSelected : null]}
                            onPress={() => selectDueDate(day)}>
                            <Text
                              style={[
                                styles.calendarDayText,
                                isSelected ? styles.calendarDayTextSelected : null,
                              ]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
              </View>

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
  clearDateButton: {
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  clearDateText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarWrap: {
    backgroundColor: '#fff',
    borderColor: '#dfe7f1',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    padding: 10,
  },
  calendarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarNavButton: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  calendarNavText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '700',
  },
  calendarMonthText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 6,
  },
  calendarWeekdayText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    width: '14.28%',
  },
  calendarDayCell: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 30,
    width: '14.28%',
  },
  calendarDayCellSelected: {
    backgroundColor: '#2563eb',
  },
  calendarDayText: {
    color: '#334155',
    fontSize: 13,
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: '700',
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
