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
    color: '#0f172a',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
  },
});

export default ScreenHeader;
