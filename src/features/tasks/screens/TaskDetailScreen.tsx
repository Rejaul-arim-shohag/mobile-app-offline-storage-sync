import React, {useState} from 'react';
import {StyleSheet, Switch, Text, TextInput, TouchableOpacity, View} from 'react-native';
import ScreenContainer from '../../../components/common/ScreenContainer';
import ScreenHeader from '../../../shared/components/ScreenHeader';
import {Task} from '../types/task';

type TaskDetailScreenProps = {
  task: Task;
  onBack?: () => void;
};

const TaskDetailScreen = ({task, onBack}: TaskDetailScreenProps) => {
  const [isStarred, setIsStarred] = useState(task.starred);
  const [completed, setCompleted] = useState(task.completed);

  return (
    <ScreenContainer style={styles.screen}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <ScreenHeader title={task.title} subtitle="Task details" />

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardEyebrow}>Details</Text>
          <Text style={styles.cardBadge}>{completed ? 'Completed' : 'In progress'}</Text>
        </View>

        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} value={task.title} />

        <Text style={styles.label}>Description</Text>
        <TextInput style={styles.input} value={task.description} multiline />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Completed</Text>
          <Switch value={completed} onValueChange={setCompleted} />
        </View>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Starred locally</Text>
          <Switch value={isStarred} onValueChange={setIsStarred} />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Delete</Text>
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
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryText: {
    color: '#b91c1c',
    fontWeight: '600',
  },
});

export default TaskDetailScreen;
