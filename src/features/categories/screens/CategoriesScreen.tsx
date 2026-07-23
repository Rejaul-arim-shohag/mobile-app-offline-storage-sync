import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import ScreenContainer from '../../../components/common/ScreenContainer';
import ScreenHeader from '../../../shared/components/ScreenHeader';

const CategoriesScreen = () => {
  return (
    <ScreenContainer style={styles.screen}>
      <ScreenHeader title="Categories" subtitle="Add and review task buckets" />

      <View style={styles.card}>
        <Text style={styles.text}>Work</Text>
        <Text style={styles.text}>Personal</Text>
        <Text style={styles.text}>Health</Text>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  text: {
    color: '#111827',
    fontSize: 15,
  },
});

export default CategoriesScreen;
