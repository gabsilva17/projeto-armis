import { COMPACT_STRIP_HEIGHT } from '@/src/components/timesheets/WeekStrip';
import { ROW_HEIGHT, SWIPE_THRESHOLD } from '@/src/components/timesheets/timesheetsConstants';
import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const WEEK_LABELS_HEIGHT = 28;

interface UseCalendarAnimationParams {
  numRows: number;
  focusRow: number;
  goToNextMonth: () => void;
  goToPreviousMonth: () => void;
}

export function useCalendarAnimation({
  numRows,
  focusRow,
  goToNextMonth,
  goToPreviousMonth,
}: UseCalendarAnimationParams) {
  const { width: screenWidth } = useWindowDimensions();
  const [isCalendarCompact, setIsCalendarCompact] = useState(false);

  const isCompact = useSharedValue(0);
  const panX = useSharedValue(0);
  const gestureDir = useSharedValue(0);
  const dragStartCompact = useSharedValue(0);
  const touchStartY = useSharedValue(0);
  const touchStartX = useSharedValue(0);
  const tasksGestureDecided = useSharedValue(false);
  const scrollY = useSharedValue(0);

  // Animated styles
  const calendarSwipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: panX.value }],
  }));

  const gridContainerStyle = useAnimatedStyle(() => ({
    height: interpolate(
      isCompact.value,
      [0, 1],
      [numRows * ROW_HEIGHT, COMPACT_STRIP_HEIGHT],
      Extrapolation.CLAMP,
    ),
  }));

  const fullGridStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          isCompact.value,
          [0, 1],
          [0, -focusRow * ROW_HEIGHT - 9],
          Extrapolation.CLAMP,
        ),
      },
    ],
    opacity: interpolate(isCompact.value, [0, 0.45], [1, 0], Extrapolation.CLAMP),
    pointerEvents: isCompact.value < 0.5 ? 'auto' : 'none',
  }));

  const weekStripStyle = useAnimatedStyle(() => ({
    opacity: interpolate(isCompact.value, [0.55, 1], [0, 1], Extrapolation.CLAMP),
    pointerEvents: isCompact.value >= 0.5 ? 'auto' : 'none',
  }));

  const weekLabelsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(isCompact.value, [0, 0.35], [1, 0], Extrapolation.CLAMP),
    height: interpolate(isCompact.value, [0, 0.5], [WEEK_LABELS_HEIGHT, 0], Extrapolation.CLAMP),
    marginBottom: interpolate(isCompact.value, [0, 0.5], [4, 0], Extrapolation.CLAMP),
  }));

  // Calendar gesture
  const calendarGesture = Gesture.Pan()
    .onBegin(() => {
      gestureDir.value = 0;
      dragStartCompact.value = isCompact.value;
    })
    .onUpdate((e) => {
      if (gestureDir.value === 0) {
        const absX = Math.abs(e.translationX);
        const absY = Math.abs(e.translationY);
        if (absX > 8 || absY > 8) {
          gestureDir.value = absX >= absY ? 1 : 2;
        }
      }
      if (gestureDir.value === 1) {
        panX.value = e.translationX;
      } else if (gestureDir.value === 2) {
        const totalRange = (numRows - 1) * ROW_HEIGHT;
        const delta = -e.translationY / totalRange;
        isCompact.value = Math.max(0, Math.min(1, dragStartCompact.value + delta));
      }
    })
    .onEnd((e) => {
      if (gestureDir.value === 1) {
        if (e.translationX < -SWIPE_THRESHOLD) {
          panX.value = withTiming(-screenWidth, { duration: 220 }, (finished) => {
            if (finished) {
              runOnJS(goToNextMonth)();
              panX.value = screenWidth;
              panX.value = withTiming(0, { duration: 220 });
            }
          });
        } else if (e.translationX > SWIPE_THRESHOLD) {
          panX.value = withTiming(screenWidth, { duration: 220 }, (finished) => {
            if (finished) {
              runOnJS(goToPreviousMonth)();
              panX.value = -screenWidth;
              panX.value = withTiming(0, { duration: 220 });
            }
          });
        } else {
          panX.value = withTiming(0, { duration: 200 });
        }
      } else if (gestureDir.value === 2) {
        const shouldCompact =
          e.velocityY < -300 ? true
          : e.velocityY > 300 ? false
          : isCompact.value > 0.5;

        isCompact.value = withSpring(shouldCompact ? 1 : 0, {
          damping: 20,
          stiffness: 200,
          mass: 0.8,
        });
        runOnJS(setIsCalendarCompact)(shouldCompact);
      }
      gestureDir.value = 0;
    });

  // Tasks scroll handler
  const tasksScrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  // Tasks gesture
  const tasksGesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesDown((e) => {
      touchStartY.value = e.allTouches[0].absoluteY;
      touchStartX.value = e.allTouches[0].absoluteX;
      tasksGestureDecided.value = false;
      dragStartCompact.value = isCompact.value;
    })
    .onTouchesMove((e, stateManager) => {
      if (tasksGestureDecided.value) return;

      const dy = e.allTouches[0].absoluteY - touchStartY.value;
      const dx = e.allTouches[0].absoluteX - touchStartX.value;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX > 8 || absY > 8) {
        tasksGestureDecided.value = true;
        if (absX > absY) {
          stateManager.fail();
          return;
        }
        if (isCompact.value > 0.9) {
          // Calendar is compact
          if (dy > 0 && scrollY.value <= 1) {
            stateManager.activate();
          } else {
            stateManager.fail();
          }
        } else {
          // Calendar is expanded
          if (dy < 0) {
            stateManager.activate();
          } else {
            stateManager.fail();
          }
        }
      }
    })
    .onUpdate((e) => {
      const totalRange = (numRows - 1) * ROW_HEIGHT;
      const delta = -e.translationY / totalRange;
      isCompact.value = Math.max(0, Math.min(1, dragStartCompact.value + delta));
    })
    .onEnd((e) => {
      const shouldCompact =
        e.velocityY < -300 ? true
        : e.velocityY > 300 ? false
        : isCompact.value > 0.5;

      isCompact.value = withSpring(shouldCompact ? 1 : 0, {
        damping: 20,
        stiffness: 200,
        mass: 0.8,
      });
      runOnJS(setIsCalendarCompact)(shouldCompact);
    });

  return {
    isCalendarCompact,
    calendarSwipeStyle,
    gridContainerStyle,
    fullGridStyle,
    weekStripStyle,
    weekLabelsStyle,
    calendarGesture,
    tasksScrollHandler,
    tasksGesture,
  };
}
