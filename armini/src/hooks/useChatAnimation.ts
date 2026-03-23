import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing } from 'react-native';

const BUTTON_SIZE = 44;

export function useChatAnimation() {
  const [chatMounted, setChatMounted] = useState(false);
  const openingLockRef = useRef(false);

  const { width: SW, height: SH } = Dimensions.get('window');
  const originRef = useRef({ x: SW - BUTTON_SIZE - 16, y: 60 });
  const expandX = useRef(new Animated.Value(0)).current;
  const expandY = useRef(new Animated.Value(0)).current;
  const expandW = useRef(new Animated.Value(BUTTON_SIZE)).current;
  const expandH = useRef(new Animated.Value(BUTTON_SIZE)).current;
  const expandRadius = useRef(new Animated.Value(BUTTON_SIZE / 2)).current;
  const expandOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const SPRING_OPEN = { useNativeDriver: false, damping: 26, stiffness: 230, mass: 0.85 } as const;

  // Start the expand animation only after the Modal is fully mounted,
  // avoiding the one-frame flicker caused by native value propagation delay.
  useEffect(() => {
    if (!chatMounted) return;

    expandOpacity.setValue(1);

    Animated.parallel([
      Animated.spring(expandX, { toValue: 0, ...SPRING_OPEN }),
      Animated.spring(expandY, { toValue: 0, ...SPRING_OPEN }),
      Animated.spring(expandW, { toValue: SW, ...SPRING_OPEN }),
      Animated.spring(expandH, { toValue: SH, ...SPRING_OPEN }),
      Animated.sequence([
        Animated.delay(140),
        Animated.spring(expandRadius, { toValue: 0, ...SPRING_OPEN }),
      ]),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: false,
      }).start();
    }, 340);

    return () => clearTimeout(timer);
  }, [chatMounted]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!chatMounted) {
      openingLockRef.current = false;
    }
  }, [chatMounted]);

  const openChat = (originX: number, originY: number) => {
    if (chatMounted || openingLockRef.current) {
      return;
    }
    openingLockRef.current = true;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    originRef.current = { x: originX, y: originY };

    // Reset to button origin with opacity 0 — Modal mounts invisibly,
    // then the useEffect above kicks off the animation after mount.
    expandX.setValue(originX);
    expandY.setValue(originY);
    expandW.setValue(BUTTON_SIZE);
    expandH.setValue(BUTTON_SIZE);
    expandRadius.setValue(BUTTON_SIZE / 2);
    expandOpacity.setValue(0);
    contentOpacity.setValue(0);

    setChatMounted(true);
  };

  const closeChat = () => {
    openingLockRef.current = false;
    contentOpacity.setValue(0);
    const { x, y } = originRef.current;

    Animated.parallel([
      Animated.timing(expandRadius, {
        toValue: BUTTON_SIZE / 2,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.delay(60),
        Animated.parallel([
          Animated.timing(expandX, { toValue: x, duration: 260, easing: Easing.in(Easing.exp), useNativeDriver: false }),
          Animated.timing(expandY, { toValue: y, duration: 260, easing: Easing.in(Easing.exp), useNativeDriver: false }),
          Animated.timing(expandW, { toValue: BUTTON_SIZE, duration: 260, easing: Easing.in(Easing.exp), useNativeDriver: false }),
          Animated.timing(expandH, { toValue: BUTTON_SIZE, duration: 260, easing: Easing.in(Easing.exp), useNativeDriver: false }),
        ]),
      ]),
    ]).start(() => {
      expandOpacity.setValue(0);
      setChatMounted(false);
    });
  };

  return {
    chatMounted,
    expandX,
    expandY,
    expandW,
    expandH,
    expandRadius,
    expandOpacity,
    contentOpacity,
    openChat,
    closeChat,
  };
}
