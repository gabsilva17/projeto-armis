import { BottomNavBar, BOTTOM_NAV_HEIGHT } from '@/src/components/navigation/BottomNavBar';
import { TopBar } from '@/src/components/navigation/TopBar';
import { ProfileSidebar, type ProfileHandle } from '@/src/components/navigation/ProfileSidebar';
import { ChatBubbleContainer, type ChatHandle } from '@/src/components/chat/ChatBubbleContainer';
import { RefreshProvider, useRefresh } from '@/src/contexts/RefreshContext';
import { useChatLauncherStore } from '@/src/stores/useChatLauncherStore';
import { useSidebarStore } from '@/src/stores/useSidebarStore';
import { Spacing, useTheme } from '@/src/theme';
import { MAIN_ROUTE_ORDER } from '@/src/constants/app.constants';
import { ANIMATION_DURATIONS, EASING } from '@/src/constants/animation.constants';
import { Slot, usePathname, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Dimensions, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { withTiming } from 'react-native-reanimated';
import type { EntryAnimationsValues } from 'react-native-reanimated';

const SLIDE_OFFSET = 80;
const PAGE_SLIDE_DURATION_MS = 170;

function normalizeRoutePath(route: string) {
  return route.replace(/\/\([^/]+\)/g, '');
}

function getRouteIndex(path: string) {
  const idx = MAIN_ROUTE_ORDER.findIndex((route) => {
    const normalizedRoute = normalizeRoutePath(route);
    return path.includes(normalizedRoute);
  });
  return idx === -1 ? 0 : idx;
}

export default function MainLayout() {
  return (
    <RefreshProvider>
      <MainLayoutInner />
    </RefreshProvider>
  );
}

function MainLayoutInner() {
  const colors = useTheme();
  const chatRef = useRef<ChatHandle>(null);
  const profileRef = useRef<ProfileHandle>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const { open: openSidebar, close: closeSidebar } = useSidebarStore();
  const insets = useSafeAreaInsets();
  const chatOpenRequestId = useChatLauncherStore((state) => state.chatOpenRequestId);
  const pendingOrigin = useChatLauncherStore((state) => state.pendingOrigin);
  const consumeChatOpenRequest = useChatLauncherStore((state) => state.consumeChatOpenRequest);

  const handleProfileOpenChange = (open: boolean) => {
    if (open) {
      openSidebar();
      return;
    }
    closeSidebar();
  };
  const { refreshing, refreshKey, triggerRefresh } = useRefresh();
  const pathname = usePathname();
  const router = useRouter();

  // --- Slide page transition using entering animation (runs on UI thread from frame 1) ---
  const prevIndexRef = useRef(getRouteIndex(pathname));
  const currentIndex = getRouteIndex(pathname);

  let direction = 0;
  if (currentIndex !== prevIndexRef.current) {
    direction = currentIndex > prevIndexRef.current ? 1 : -1;
    prevIndexRef.current = currentIndex;
  }

  const slideOffset = direction * SLIDE_OFFSET;
  const entering = (targetValues: EntryAnimationsValues) => {
    'worklet';
    return {
      initialValues: {
        originX: targetValues.targetOriginX + slideOffset,
        opacity: 1,
      },
      animations: {
        originX: withTiming(targetValues.targetOriginX, {
          duration: PAGE_SLIDE_DURATION_MS,
          easing: EASING.outCubic,
        }),
      },
    };
  };

  // Android back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!pathname.includes('/home')) {
        router.replace('/(main)/home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [pathname, router]);

  useEffect(() => {
    if (chatOpenRequestId === 0) return;

    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const fallbackX = screenWidth - Spacing[4] - 22;
    const fallbackY = insets.top + Spacing[2] + 22;
    const rawX = pendingOrigin?.x;
    const rawY = pendingOrigin?.y;
    const originX = Number.isFinite(rawX) ? Math.max(0, Math.min(rawX as number, screenWidth - 44)) : fallbackX;
    const originY = Number.isFinite(rawY) ? Math.max(0, Math.min(rawY as number, screenHeight - 44)) : fallbackY;

    chatRef.current?.open(originX, originY);
    consumeChatOpenRequest();
  }, [chatOpenRequestId, consumeChatOpenRequest, insets.top, pendingOrigin]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* TopBar */}
      <TopBar
        onProfilePress={(x, y) => profileRef.current?.open(x, y)}
        onChatPress={(x, y) => chatRef.current?.open(x, y)}
        chatOpen={chatOpen}
        refreshing={refreshing}
        onRefresh={triggerRefresh}
      />

      {/* Page content */}
      <View
        style={[
          styles.content,
          {
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <Animated.View key={`${currentIndex}-${refreshKey}`} entering={entering} style={styles.contentInner}>
          <Slot />
        </Animated.View>
      </View>

      {/* Bottom pill navbar */}
      <BottomNavBar />

      {/* Profile modal */}
      <ProfileSidebar ref={profileRef} onOpenChange={handleProfileOpenChange} />

      {/* Chat modal */}
      <ChatBubbleContainer ref={chatRef} onOpenChange={setChatOpen} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingBottom: BOTTOM_NAV_HEIGHT,
  },
  contentInner: {
    flex: 1,
    overflow: 'hidden',
  },
});
