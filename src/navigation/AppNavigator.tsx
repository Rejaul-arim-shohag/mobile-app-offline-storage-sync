import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import CategoriesScreen from '../features/categories/screens/CategoriesScreen';
import TaskListScreen from '../features/tasks/screens/TaskListScreen';

const AppNavigator = () => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'categories'>('tasks');

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
          onPress={() => setActiveTab('tasks')}>
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'categories' && styles.activeTab]}
          onPress={() => setActiveTab('categories')}>
          <Text style={[styles.tabText, activeTab === 'categories' && styles.activeTabText]}>Categories</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'tasks' ? <TaskListScreen /> : <CategoriesScreen />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
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
