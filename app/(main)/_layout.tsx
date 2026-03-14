import { BottomNavBar, BOTTOM_NAV_HEIGHT } from '@/src/components/navigation/BottomNavBar';
import { TopBar } from '@/src/components/navigation/TopBar';
import { ProfileSidebar, type ProfileHandle } from '@/src/components/navigation/ProfileSidebar';
import { ChatBubbleContainer, type ChatHandle } from '@/src/components/chat/ChatBubbleContainer';
import { RefreshProvider, useRefresh } from '@/src/contexts/RefreshContext';
import { useSidebarStore } from '@/src/stores/useSidebarStore';
import { Colors } from '@/src/theme';
import { Slot, usePathname, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, withTiming } from 'react-native-reanimated';
import type { EntryAnimationsValues } from 'react-native-reanimated';

const ROUTES = ['/home', '/finances', '/timesheets', '/whistleblow'];
const SLIDE_OFFSET = 80;
const ANIM_DURATION = 300;

function getRouteIndex(path: string) {
  const idx = ROUTES.findIndex((r) => path.includes(r));
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
  const chatRef = useRef<ChatHandle>(null);
  const profileRef = useRef<ProfileHandle>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const { open: openSidebar, close: closeSidebar } = useSidebarStore();
  const insets = useSafeAreaInsets();

  const handleProfileOpenChange = (open: boolean) => {
    if (open) {
      openSidebar();
      return;
    }
    closeSidebar();
  };
  const { refreshing, triggerRefresh } = useRefresh();
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
        opacity: 0,
      },
      animations: {
        originX: withTiming(targetValues.targetOriginX, {
          duration: ANIM_DURATION,
          easing: Easing.out(Easing.cubic),
        }),
        opacity: withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) }),
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

  return (
    <View style={styles.root}>
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
        <Animated.View key={currentIndex} entering={entering} style={styles.contentInner}>
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
    backgroundColor: Colors.background,
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
