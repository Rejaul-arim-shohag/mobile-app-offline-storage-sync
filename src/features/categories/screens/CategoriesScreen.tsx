import React, {useState} from 'react';
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import ScreenContainer from '../../../components/common/ScreenContainer';
import ScreenHeader from '../../../shared/components/ScreenHeader';

const initialCategories = ['Work', 'Personal', 'Health'];

const CategoriesScreen = () => {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState('');

  const addCategory = () => {
    if (!name.trim()) {
      return;
    }

    setCategories(prev => [...prev, name.trim()]);
    setName('');
  };

  return (
    <ScreenContainer style={styles.screen}>
      <ScreenHeader title="Categories" subtitle="Add and review task buckets" />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="New category"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity style={styles.addButton} onPress={addCategory}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {categories.map(category => (
          <View key={category} style={styles.categoryItem}>
            <Text style={styles.text}>{category}</Text>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    paddingTop: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#dfe7f1',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addButtonText: {
    color: '#fff',
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
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  categoryItem: {
    borderBottomColor: '#f3f4f6',
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  text: {
    color: '#111827',
    fontSize: 15,
  },
});

export default CategoriesScreen;
