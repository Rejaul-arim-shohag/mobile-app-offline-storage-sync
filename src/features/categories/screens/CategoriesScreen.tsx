import React, {useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import ScreenContainer from '../../../components/common/ScreenContainer';
import ScreenHeader from '../../../shared/components/ScreenHeader';
import {fetchCategories} from '../services/categoriesService';

const ListSeparator = () => <View style={styles.separator} />;

const CategoriesScreen = () => {
  const [categories, setCategories] = useState<{id: number; name: string}[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const nextCategories = await fetchCategories();
        setCategories(nextCategories);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load categories');
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const addCategory = () => {
    if (!name.trim()) {
      return;
    }

    setCategories(prev => [...prev, {id: Date.now(), name: name.trim()}]);
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
        {loading ? (
          <ActivityIndicator size="small" color="#2563eb" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : categories.length === 0 ? (
          <Text style={styles.emptyText}>No categories yet.</Text>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => (
              <View style={styles.categoryItem}>
                <Text style={styles.text}>{item.name}</Text>
              </View>
            )}
            ItemSeparatorComponent={ListSeparator}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
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
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  listContent: {
    paddingVertical: 2,
  },
  separator: {
    height: 10,
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
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
});

export default CategoriesScreen;
