import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import ScreenContainer from '../components/common/ScreenContainer';
import {colors} from '../theme/colors';
import {Task} from '../types/task';
import {formatToday} from '../utils/date';

const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'Review sprint goals',
    description: 'Check the top priorities for the day.',
    completed: false,
  },
  {
    id: '2',
    title: 'Write project notes',
    description: 'Keep a short summary for the team.',
    completed: true,
  },
];

const HomeScreen = () => {
  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Task Manager</Text>
        <Text style={styles.title}>Plan your day with structure</Text>
        <Text style={styles.subtitle}>
          This starter now uses a modular folder layout for screens, UI, and theme.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today</Text>
        <Text style={styles.cardDate}>{formatToday()}</Text>

        {sampleTasks.map(task => (
          <View key={task.id} style={styles.taskRow}>
            <View style={[styles.dot, task.completed && styles.dotCompleted]} />
            <View style={styles.taskContent}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskDescription}>{task.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
  },
  header: {
    marginBottom: 20,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  cardDate: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.primary,
    marginRight: 10,
  },
  dotCompleted: {
    backgroundColor: colors.success,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  taskDescription: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
});

export default HomeScreen;
