import React from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';

type ScreenContainerProps = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};

const ScreenContainer = ({children, style}: ScreenContainerProps) => {
  return <View style={[styles.container, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
});

export default ScreenContainer;
