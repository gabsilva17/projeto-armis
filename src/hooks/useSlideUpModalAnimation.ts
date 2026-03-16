import { ANIMATION_DURATIONS, SPRING_CONFIGS } from '@/src/constants/animation.constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

interface UseSlideUpModalAnimationOptions {
  visible: boolean;
  screenHeight: number;
}

export function useSlideUpModalAnimation({ visible, screenHeight }: UseSlideUpModalAnimationOptions) {
  const [mounted, setMounted] = useState(false);
  const slideY = useRef(new Animated.Value(screenHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!mounted || !visible) return;

    slideY.setValue(screenHeight);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: ANIMATION_DURATIONS.modalEnter,
        useNativeDriver: true,
      }),
      Animated.spring(slideY, {
        toValue: 0,
        ...SPRING_CONFIGS.expand,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, mounted, screenHeight, slideY, visible]);

  const animateClose = useCallback(
    (callback: () => void) => {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: ANIMATION_DURATIONS.modalBackdropExit,
          useNativeDriver: true,
        }),
        Animated.timing(slideY, {
          toValue: screenHeight,
          duration: ANIMATION_DURATIONS.modalSlideExit,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMounted(false);
        callback();
      });
    },
    [backdropOpacity, screenHeight, slideY],
  );

  return {
    mounted,
    slideY,
    backdropOpacity,
    animateClose,
  };
}
