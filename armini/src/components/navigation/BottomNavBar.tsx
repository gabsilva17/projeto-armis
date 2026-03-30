import { Spacing } from '@/src/theme';
import { useTheme } from '@/src/theme';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  type AnimatedStyle,
} from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';
import { useNavBarStore } from '@/src/stores/useNavBarStore';
import { NAV_TAB_REGISTRY, FIXED_FIRST_TAB, FIXED_LAST_TAB } from '@/src/constants/navigation.constants';

const ITEM_WIDTH = 80;
export const BOTTOM_NAV_HEIGHT = 58;

interface BottomNavBarProps {
  animatedStyle?: AnimatedStyle<ViewStyle>;
}

export function BottomNavBar({ animatedStyle }: BottomNavBarProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { middleTabs } = useNavBarStore();

  const navItems = useMemo(() => [
    NAV_TAB_REGISTRY[FIXED_FIRST_TAB],
    ...middleTabs.map(id => NAV_TAB_REGISTRY[id]).filter(Boolean),
    NAV_TAB_REGISTRY[FIXED_LAST_TAB],
  ], [middleTabs]);

  const slotWidth = screenWidth / navItems.length;

  const activeIndex = useMemo(
    () => navItems.findIndex((item) => pathname.includes(item.route)),
    [pathname, navItems],
  );
  const highlightX = useSharedValue(0);

  useEffect(() => {
    const targetX = Math.max(activeIndex, 0) * slotWidth + (slotWidth - ITEM_WIDTH) / 2;
    highlightX.value = withSpring(targetX, {
      damping: 80,
      stiffness: 600,
    });
  }, [activeIndex, highlightX, slotWidth]);

  const highlightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: highlightX.value }],
  }));

  return (
    <Animated.View
      style={[styles.wrapper, { paddingBottom: insets.bottom, backgroundColor: colors.background, borderTopColor: colors.border }, animatedStyle]}
      pointerEvents="box-none"
    >
      <View style={styles.bar} accessibilityRole="tablist">
        {/* Sliding highlight */}
        <Animated.View style={[styles.pillHighlight, highlightStyle, { backgroundColor: colors.gray100 }]} />

        {navItems.map((item) => {
          const isActive = pathname.includes(item.route);
          return (
            <TouchableOpacity
              key={item.route}
              style={styles.navItem}
              activeOpacity={0.7}
              onPressIn={() => {
                if (isActive) return;
                router.replace(item.href);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={t(item.labelKey)}
            >
              <item.IconComponent
                size={22}
                color={isActive ? colors.black : colors.gray400}
                weight={'bold'}
              />
              <Text style={[styles.label, { color: isActive ? colors.black : colors.gray400 }, isActive && styles.labelActive]}>
                {t(item.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    borderTopWidth: 1,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[1],
  },
  pillHighlight: {
    position: 'absolute',
    left: 0,
    top: Spacing[1],
    bottom: Spacing[1],
    width: ITEM_WIDTH,
    borderRadius: 999,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 2,
    zIndex: 1,
  },
  label: {
    fontSize: 9,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.2,
  },
  labelActive: {
    fontFamily: 'Inter_600SemiBold',
  },
});
