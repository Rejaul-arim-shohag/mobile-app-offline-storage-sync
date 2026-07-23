import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
};

const ScreenHeader = ({title, subtitle}: ScreenHeaderProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 4,
  },
});

export default ScreenHeader;
