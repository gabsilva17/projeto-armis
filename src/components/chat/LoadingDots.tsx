import { useTheme } from '@/src/theme';
import { Spacing } from '@/src/theme';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

function Dot({ delay, color }: { delay: number; color: string }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, animatedStyle]} />;
}

export function LoadingDots() {
  const colors = useTheme();
  return (
    <View style={styles.container}>
      <Dot delay={0} color={colors.gray500} />
      <Dot delay={150} color={colors.gray500} />
      <Dot delay={300} color={colors.gray500} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
