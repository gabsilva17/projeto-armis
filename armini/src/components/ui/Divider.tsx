import { Colors } from '@/src/theme';
import { View, StyleSheet, ViewProps } from 'react-native';

export function Divider({ style, ...props }: ViewProps) {
  return <View style={[styles.divider, style]} {...props} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
});
