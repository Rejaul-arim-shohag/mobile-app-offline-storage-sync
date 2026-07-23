import React from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
import {colors} from '../../theme/colors';

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
    backgroundColor: colors.background,
    padding: 24,
  },
});

export default ScreenContainer;
