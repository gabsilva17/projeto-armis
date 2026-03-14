import { Colors } from '@/src/theme';
import { TouchableOpacity, View, StyleSheet } from 'react-native';

interface HamburgerButtonProps {
  onPress: () => void;
}

export function HamburgerButton({ onPress }: HamburgerButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.button}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.7}
    >
      <View style={styles.line} />
      <View style={styles.line} />
      <View style={styles.line} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  line: {
    width: 22,
    height: 2,
    backgroundColor: Colors.black,
    borderRadius: 1,
  },
  lineMid: {
    width: 16,
    alignSelf: 'flex-start',
  },
});
