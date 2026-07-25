import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
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
import {createCategory, fetchCategories} from '../services/categoriesService';

const ListSeparator = () => <View style={styles.separator} />;
const SHEET_HIDDEN_OFFSET = 360;

const CategoriesScreen = () => {
  const [categories, setCategories] = useState<{id: number; name: string}[]>([]);
  const [name, setName] = useState('');
  const [isCreateSheetVisible, setIsCreateSheetVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sheetTranslateY = useRef(new Animated.Value(SHEET_HIDDEN_OFFSET)).current;

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
        setName('');
        setCreateError(null);
      }
    });
  };

  const addCategory = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || isCreating) {
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);
      const createdCategory = await createCategory(trimmedName);
      setCategories(prev => [...prev, createdCategory]);
      setName('');
      closeCreateSheet();
    } catch (err) {
      console.log('err', err);
      setCreateError(err instanceof Error ? err.message : 'Unable to create category');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScreenContainer style={styles.screen}>
      <ScreenHeader title="Categories" subtitle="Add and review task buckets" />

      <TouchableOpacity style={styles.openSheetButton} onPress={openCreateSheet}>
        <Text style={styles.addButtonText}>Create Category</Text>
      </TouchableOpacity>

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

      {isCreateSheetVisible ? (
        <View style={styles.sheetRoot} pointerEvents="box-none">
          <Pressable style={styles.sheetBackdrop} onPress={closeCreateSheet} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Animated.View style={[styles.sheet, {transform: [{translateY: sheetTranslateY}]}]}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Create Category</Text>
              <TextInput
                style={styles.input}
                placeholder="Category name"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#94a3b8"
                autoFocus
              />
              {createError ? <Text style={styles.errorText}>{createError}</Text> : null}
              <View style={styles.sheetActions}>
                <TouchableOpacity style={[styles.sheetButton, styles.cancelButton]} onPress={closeCreateSheet}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sheetButton, styles.addButton, isCreating ? styles.disabledButton : null]}
                  onPress={addCategory}
                  disabled={isCreating}>
                  <Text style={styles.addButtonText}>{isCreating ? 'Creating...' : 'Create'}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      ) : null}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    paddingTop: 16,
  },
  openSheetButton: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 10,
    marginBottom: 12,
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
  input: {
    backgroundColor: '#fff',
    borderColor: '#dfe7f1',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderColor: '#e5ebf5',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  sheetRoot: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  sheetBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 12,
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
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  sheetButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelButton: {
    backgroundColor: '#e2e8f0',
  },
  disabledButton: {
    opacity: 0.7,
  },
  cancelButtonText: {
    color: '#334155',
    fontWeight: '600',
  },
});

export default CategoriesScreen;
