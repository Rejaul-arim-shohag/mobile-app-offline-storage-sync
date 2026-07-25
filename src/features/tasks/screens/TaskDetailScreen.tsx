import React, {useEffect, useState} from 'react';
import {Alert, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import ScreenContainer from '../../../components/common/ScreenContainer';
import ScreenHeader from '../../../shared/components/ScreenHeader';
import {fetchCategories} from '../../categories/services/categoriesService';
import {taskService} from '../services/taskService';
import {Task} from '../types/task';

type TaskDetailScreenProps = {
  task: Task;
  onBack?: () => void;
};

const TaskDetailScreen = ({task, onBack}: TaskDetailScreenProps) => {
  const [title, setTitle] = useState(task.title);
  const [completed, setCompleted] = useState(task.completed);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories()
      .then(cats => {
        const match = cats.find(c => c.id.toString() === task.categoryId);
        setCategoryName(match?.name ?? task.categoryId);
      })
      .catch(() => setCategoryName(task.categoryId));
  }, [task.categoryId]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || isSaving || isDeleting) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await taskService.update(task.id, {title: trimmedTitle, completed});
      onBack?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleComplete = async () => {
    if (isSaving || isDeleting) {
      return;
    }
    const nextCompleted = !completed;
    try {
      setIsSaving(true);
      setError(null);
      await taskService.update(task.id, {title: title.trim() || task.title, completed: nextCompleted});
      setCompleted(nextCompleted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      `Delete "${task.title}"? This cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              setError(null);
              await taskService.remove(task.id);
              onBack?.();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Unable to delete task');
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  const isBusy = isSaving || isDeleting;

  return (
    <ScreenContainer style={styles.screen}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <ScreenHeader title={task.title} subtitle="Task details" />

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardEyebrow}>Details</Text>
          <View style={[styles.statusBadge, completed ? styles.statusBadgeDone : styles.statusBadgeOpen]}>
            <Text style={styles.statusBadgeText}>{completed ? 'Completed' : 'In progress'}</Text>
          </View>
        </View>

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="#94a3b8"
        />

        {task.dueDate ? (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Due date</Text>
            <Text style={styles.rowValue}>{task.dueDate}</Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Category</Text>
          <Text style={styles.rowValue}>{categoryName ?? task.categoryId}</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.toggleButton, completed ? styles.reopenButton : styles.completeButton, isBusy ? styles.disabledButton : null]}
          onPress={handleToggleComplete}
          disabled={isBusy}>
          <Text style={styles.toggleButtonText}>{completed ? 'Reopen Task' : 'Mark as Complete'}</Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, isBusy ? styles.disabledButton : null]}
            onPress={handleSave}
            disabled={isBusy}>
            <Text style={styles.primaryText}>{isSaving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, isBusy ? styles.disabledButton : null]}
            onPress={handleDelete}
            disabled={isBusy}>
            <Text style={styles.deleteText}>{isDeleting ? 'Deleting...' : 'Delete'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    paddingTop: 16,
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderColor: '#e5ebf5',
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardEyebrow: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardBadge: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderColor: '#dfe7f1',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeOpen: {
    backgroundColor: '#dbeafe',
  },
  statusBadgeDone: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  rowValue: {
    color: '#0f172a',
    fontSize: 13,
  },
  toggleButton: {
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 10,
  },
  completeButton: {
    backgroundColor: '#dcfce7',
  },
  reopenButton: {
    backgroundColor: '#fef9c3',
  },
  toggleButtonText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  deleteText: {
    color: '#b91c1c',
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

export default TaskDetailScreen;
