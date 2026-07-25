import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
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
import { useDebounce } from '../hooks/useDebounce';
import { useTaskFilters } from '../hooks/useTaskFilters';
import { useTasks } from '../hooks/useTasks';
import { Task, TaskFilters } from '../types/task';

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

const formatRelativeTime = (isoString: string | null): string => {
  if (!isoString) {
    return 'Never';
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return 'Never';
  }
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 10) {
    return 'Just now';
  }
  if (diffSec < 60) {
    return `${diffSec}s ago`;
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const TaskListScreen = ({ onSelectTask }: TaskListScreenProps) => {
  const {
    tasks,
    isRefreshing,
    isOffline,
    lastRefreshedAt,
    error: syncError,
    refreshTasks,
    createTask: submitCreateTask,
    toggleStar,
  } = useTasks();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [status, setStatus] = useState<'open' | 'done' | undefined>('open');
  const [sortBy, setSortBy] = useState<'dueDate' | 'createdAt'>('createdAt');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined,
  );

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

  const sheetTranslateY = useRef(
    new Animated.Value(SHEET_HIDDEN_OFFSET),
  ).current;

  // Filter state processed via selector outside render tree
  const filters = useMemo<TaskFilters>(
    () => ({
      search: debouncedSearch,
      status,
      sortBy,
      categoryId: selectedCategory,
    }),
    [debouncedSearch, sortBy, status, selectedCategory],
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
        setCategoriesError(
          err instanceof Error ? err.message : 'Unable to load categories',
        );
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
    }).start(({ finished }) => {
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
    setCalendarMonth(
      prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1),
    );
  };

  const selectDueDate = (day: number) => {
    const selected = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      day,
    );
    setDueDate(formatDateToYmd(selected));
    setIsCalendarOpen(false);
  };

  const handleCreateTask = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isCreating) {
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);

      await submitCreateTask({
        title: trimmedTitle,
        categoryId:
          categoryId.trim() || (categories[0]?.id.toString() ?? 'general'),
        dueDate: dueDate.trim() || undefined,
        completed: false,
        starred: false,
      });

      closeCreateSheet();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : 'Unable to create task',
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScreenContainer style={styles.screen}>
      <ScreenHeader
        title="Tasks"
        subtitle="Offline-first task management & caching"
      />

      {/* Sync status banner surfacing last refreshed time, offline state & background refresh indicator */}
      <View style={styles.syncBanner}>
        <View style={styles.syncLeft}>
          {isOffline ? (
            <View style={styles.offlineBadge}>
              <View style={styles.offlineDot} />
              <Text style={styles.offlineText}>Offline (Cached Data)</Text>
            </View>
          ) : (
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>
                Refreshed: {formatRelativeTime(lastRefreshedAt)}
              </Text>
            </View>
          )}
        </View>

        {isRefreshing ? (
          <View style={styles.refreshingWrap}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.refreshingText}>Refreshing...</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.refreshButton} onPress={refreshTasks}>
            <Text style={styles.refreshButtonText}>Sync</Text>
          </TouchableOpacity>
        )}
      </View>

      {syncError && isOffline ? (
        <View style={styles.errorNotice}>
          <Text style={styles.errorNoticeText}>
            Unable to connect to server. Showing local cached tasks.
          </Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.createButton} onPress={openCreateSheet}>
        <Text style={styles.createButtonText}>+ Create Task</Text>
      </TouchableOpacity>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.input}
          placeholder="Search tasks by title"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.pill, status === 'open' && styles.pillActive]}
          onPress={() => setStatus(status === 'open' ? undefined : 'open')}
        >
          <Text
            style={[
              styles.pillText,
              status === 'open' && styles.pillTextActive,
            ]}
          >
            Open
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pill, status === 'done' && styles.pillActive]}
          onPress={() => setStatus(status === 'done' ? undefined : 'done')}
        >
          <Text
            style={[
              styles.pillText,
              status === 'done' && styles.pillTextActive,
            ]}
          >
            Done
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pill, sortBy === 'dueDate' && styles.pillActive]}
          onPress={() =>
            setSortBy(sortBy === 'dueDate' ? 'createdAt' : 'dueDate')
          }
        >
          <Text
            style={[
              styles.pillText,
              sortBy === 'dueDate' && styles.pillTextActive,
            ]}
          >
            Sort: {sortBy === 'dueDate' ? 'Due Date' : 'Created Time'}
          </Text>
        </TouchableOpacity>
      </View>

      {categories.length > 0 ? (
        <View style={styles.categoryFilterRow}>
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === undefined && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(undefined)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === undefined && styles.categoryChipTextActive,
              ]}
            >
              All Categories
            </Text>
          </TouchableOpacity>
          {categories.map(cat => {
            const catIdStr = cat.id.toString();
            const isSelected = selectedCategory === catIdStr;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipActive,
                ]}
                onPress={() =>
                  setSelectedCategory(isSelected ? undefined : catIdStr)
                }
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      <FlatList
        data={visibleTasks}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshTasks}
            tintColor="#2563eb"
          />
        }
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            onSelect={() => onSelectTask?.(item)}
            onToggleStar={() => toggleStar(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No tasks found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try matching a different task title.'
                : 'Create a new task to get started.'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {isCreateSheetVisible ? (
        <View style={styles.sheetRoot} pointerEvents="box-none">
          <Pressable style={styles.sheetBackdrop} onPress={closeCreateSheet} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <Animated.View
              style={[
                styles.sheet,
                { transform: [{ translateY: sheetTranslateY }] },
              ]}
            >
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Create Task</Text>

              <TextInput
                style={styles.sheetInput}
                placeholder="Task title"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#94a3b8"
              />

              <View>
                <Text style={styles.dropdownLabel}>Category</Text>
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => setIsCategoryDropdownOpen(prev => !prev)}
                >
                  <Text style={styles.dropdownText}>{categoryName}</Text>
                  <Text style={styles.dropdownChevron}>
                    {isCategoryDropdownOpen ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {isCategoryDropdownOpen ? (
                  <View style={styles.dropdownMenu}>
                    {categories.length === 0 ? (
                      <Text style={styles.dropdownEmptyText}>
                        No categories available
                      </Text>
                    ) : (
                      categories.map(item => {
                        const selected = categoryId === item.id.toString();
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.dropdownItem,
                              selected ? styles.dropdownItemSelected : null,
                            ]}
                            onPress={() => {
                              setCategoryId(item.id.toString());
                              setCategoryName(item.name);
                              setIsCategoryDropdownOpen(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                selected
                                  ? styles.dropdownItemTextSelected
                                  : null,
                              ]}
                            >
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
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={openCalendar}
                >
                  <Text style={styles.dropdownText}>
                    {dueDate || 'Select due date'}
                  </Text>
                  <Text style={styles.dropdownChevron}>▼</Text>
                </TouchableOpacity>

                {dueDate ? (
                  <TouchableOpacity
                    onPress={() => setDueDate('')}
                    style={styles.clearDateButton}
                  >
                    <Text style={styles.clearDateText}>Clear due date</Text>
                  </TouchableOpacity>
                ) : null}

                {isCalendarOpen ? (
                  <View style={styles.calendarWrap}>
                    <View style={styles.calendarHeader}>
                      <TouchableOpacity
                        onPress={() => changeCalendarMonth(-1)}
                        style={styles.calendarNavButton}
                      >
                        <Text style={styles.calendarNavText}>{'<'}</Text>
                      </TouchableOpacity>
                      <Text style={styles.calendarMonthText}>
                        {calendarMonth.toLocaleDateString(undefined, {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Text>
                      <TouchableOpacity
                        onPress={() => changeCalendarMonth(1)}
                        style={styles.calendarNavButton}
                      >
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
                          return (
                            <View
                              key={`empty-${index}`}
                              style={styles.calendarDayCell}
                            />
                          );
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
                            style={[
                              styles.calendarDayCell,
                              isSelected
                                ? styles.calendarDayCellSelected
                                : null,
                            ]}
                            onPress={() => selectDueDate(day)}
                          >
                            <Text
                              style={[
                                styles.calendarDayText,
                                isSelected
                                  ? styles.calendarDayTextSelected
                                  : null,
                              ]}
                            >
                              {day}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
              </View>

              {categoriesError ? (
                <Text style={styles.errorText}>{categoriesError}</Text>
              ) : null}

              {createError ? (
                <Text style={styles.errorText}>{createError}</Text>
              ) : null}

              <View style={styles.sheetActions}>
                <TouchableOpacity
                  style={[styles.sheetActionButton, styles.cancelButton]}
                  onPress={closeCreateSheet}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sheetActionButton,
                    styles.confirmButton,
                    isCreating ? styles.disabledButton : null,
                  ]}
                  onPress={handleCreateTask}
                  disabled={isCreating}
                >
                  <Text style={styles.confirmButtonText}>
                    {isCreating ? 'Creating...' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      ) : null}
    </ScreenContainer>
  );
};

const TaskRow = React.memo(
  ({
    task,
    onSelect,
    onToggleStar,
  }: {
    task: Task;
    onSelect: () => void;
    onToggleStar: () => void;
  }) => {
    return (
      <TouchableOpacity onPress={onSelect} activeOpacity={0.7}>
        <View style={styles.taskCard}>
          <View style={styles.taskMeta}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <TouchableOpacity
              onPress={onToggleStar}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.star}>{task.starred ? '★' : '☆'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.taskFooter}>
            <View style={styles.footerLeft}>
              <View
                style={[
                  styles.statusTag,
                  task.completed ? styles.statusTagDone : styles.statusTagOpen,
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    task.completed
                      ? styles.statusTagTextDone
                      : styles.statusTagTextOpen,
                  ]}
                >
                  {task.completed ? 'Done' : 'Open'}
                </Text>
              </View>
              {task.isLocalOnly || task.id.startsWith('local_') ? (
                <View style={styles.pendingTag}>
                  <Text style={styles.pendingTagText}>Pending Sync</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.taskDue}>
              {task.dueDate ? `Due ${task.dueDate}` : 'No due date'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

const styles = StyleSheet.create({
  screen: {
    paddingTop: 12,
  },
  syncBanner: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  syncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  offlineDot: {
    backgroundColor: '#f59e0b',
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  offlineText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '600',
  },
  onlineBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  onlineDot: {
    backgroundColor: '#10b981',
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  onlineText: {
    color: '#475569',
    fontSize: 12,
  },
  refreshingWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  refreshingText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refreshButtonText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
  },
  errorNotice: {
    backgroundColor: '#fffbe6',
    borderColor: '#ffe58f',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
  },
  errorNoticeText: {
    color: '#d48806',
    fontSize: 12,
  },
  createButton: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    marginBottom: 12,
    paddingVertical: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
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
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
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
  categoryFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  categoryChip: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryChipActive: {
    backgroundColor: '#1e293b',
  },
  categoryChipText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    gap: 10,
    paddingBottom: 24,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderColor: '#e5ebf5',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
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
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  taskFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  footerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  pendingTag: {
    backgroundColor: '#fffbe6',
    borderColor: '#ffe58f',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingTagText: {
    color: '#d48806',
    fontSize: 10,
    fontWeight: '700',
  },
  statusTag: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusTagOpen: {
    backgroundColor: '#dbeafe',
  },
  statusTagDone: {
    backgroundColor: '#dcfce7',
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTagTextOpen: {
    color: '#1d4ed8',
  },
  statusTagTextDone: {
    color: '#15803d',
  },
  taskDue: {
    color: '#94a3b8',
    fontSize: 12,
  },
  star: {
    color: '#f59e0b',
    fontSize: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
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
