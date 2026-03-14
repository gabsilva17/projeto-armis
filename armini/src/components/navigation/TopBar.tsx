import { Colors, Spacing } from '@/src/theme';
import { ChatCircleIcon, UserIcon } from 'phosphor-react-native';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const REFRESH_THRESHOLD = 60;

interface TopBarProps {
  onProfilePress?: (x: number, y: number) => void;
  onChatPress?: (x: number, y: number) => void;
  chatOpen?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function TopBar({ onProfilePress, onChatPress, chatOpen, refreshing, onRefresh }: TopBarProps) {
  const insets = useSafeAreaInsets();
  const chatBtnRef = useRef<View>(null);
  const profileBtnRef = useRef<View>(null);
  const pullDistance = useSharedValue(0);
  const isRefreshing = useSharedValue(false);

  useEffect(() => {
    isRefreshing.value = !!refreshing;
    if (refreshing) {
      pullDistance.value = withTiming(REFRESH_THRESHOLD, { duration: 200 });
    } else {
      pullDistance.value = withTiming(0, { duration: 300 });
    }
  }, [refreshing, pullDistance, isRefreshing]);

  const pullGesture = Gesture.Pan()
    .activeOffsetY(10)
    .failOffsetY(-10)
    .onUpdate((e) => {
      'worklet';
      if (isRefreshing.value) return;
      if (e.translationY > 0) {
        pullDistance.value = Math.min(e.translationY, REFRESH_THRESHOLD * 1.5);
      }
    })
    .onEnd(() => {
      'worklet';
      if (isRefreshing.value) return;
      if (pullDistance.value >= REFRESH_THRESHOLD && onRefresh) {
        runOnJS(onRefresh)();
      } else {
        pullDistance.value = withTiming(0, { duration: 200 });
      }
    });

  const indicatorStyle = useAnimatedStyle(() => ({
    height: pullDistance.value > 0 ? pullDistance.value * 0.6 : 0,
    opacity: interpolate(
      pullDistance.value,
      [0, REFRESH_THRESHOLD * 0.3, REFRESH_THRESHOLD],
      [0, 0.3, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const handleProfilePress = () => {
    if (!onProfilePress) return;
    profileBtnRef.current?.measure((_fx: number, _fy: number, _width: number, _height: number, px: number, py: number) => {
      onProfilePress(px, py);
    });
  };

  const handleChatPress = () => {
    if (!onChatPress) return;
    chatBtnRef.current?.measure((_fx: number, _fy: number, _width: number, _height: number, px: number, py: number) => {
      onChatPress(px, py);
    });
  };

  return (
    <GestureDetector gesture={pullGesture}>
      <Animated.View>
        <View style={[styles.container, { paddingTop: insets.top + Spacing[2] }]}>
          {/* Left — profile button */}
          <TouchableOpacity ref={profileBtnRef} style={styles.chatBtn} onPress={handleProfilePress} activeOpacity={0.6}>
            <UserIcon size={26} color={Colors.black} />
          </TouchableOpacity>

          {/* Center spacer */}
          <View style={styles.spacer} />

          {/* Right — chat button (hidden while modal is open) */}
          {onChatPress && !chatOpen && (
            <TouchableOpacity
              ref={chatBtnRef}
              style={styles.chatBtn}
              onPress={handleChatPress}
              activeOpacity={0.6}
            >
              <ChatCircleIcon size={26} color={Colors.black} />
            </TouchableOpacity>
          )}
        </View>
        <Animated.View style={[styles.indicatorContainer, indicatorStyle]}>
          <ActivityIndicator size="small" color={Colors.textPrimary} />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[2],
    backgroundColor: Colors.background,
    zIndex: 5,
  },
  avatarBtn: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  spacer: {
    flex: 1,
  },
  chatBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
});
