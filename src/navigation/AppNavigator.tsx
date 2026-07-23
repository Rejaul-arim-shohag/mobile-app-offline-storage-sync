import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import CategoriesScreen from '../features/categories/screens/CategoriesScreen';
import TaskDetailScreen from '../features/tasks/screens/TaskDetailScreen';
import TaskListScreen from '../features/tasks/screens/TaskListScreen';
import {Task} from '../features/tasks/types/task';

const AppNavigator = () => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'categories'>('tasks');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
          onPress={() => {
            setActiveTab('tasks');
            setSelectedTask(null);
          }}>
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'categories' && styles.activeTab]}
          onPress={() => setActiveTab('categories')}>
          <Text style={[styles.tabText, activeTab === 'categories' && styles.activeTabText]}>Categories</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'categories' ? (
        <CategoriesScreen />
      ) : selectedTask ? (
        <TaskDetailScreen task={selectedTask} onBack={() => setSelectedTask(null)} />
      ) : (
        <TaskListScreen onSelectTask={setSelectedTask} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: 10,
  },
  activeTab: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    color: '#374151',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
});

export default AppNavigator;
