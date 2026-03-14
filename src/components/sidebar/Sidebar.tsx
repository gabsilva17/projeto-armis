import { APP_NAME, SIDEBAR_WIDTH } from '@/src/constants/app.constants';
import { Colors, Spacing, Typography } from '@/src/theme';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SidebarItem } from './SidebarItem';
import { ClockIcon, HouseIcon, ReceiptIcon } from 'phosphor-react-native';
import type { Href } from 'expo-router';

interface SidebarProps {
  translateX: SharedValue<number>;
}

export function Sidebar({ translateX }: SidebarProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>{APP_NAME}</Text>
        </View>

        {/* Navigation */}
        <View style={styles.nav}>
          <SidebarItem icon={HouseIcon} label="Home" href={'/(main)/home' as Href} />
          <SidebarItem icon={ReceiptIcon} label="Finances" href={'/(main)/finances' as Href} />
          <SidebarItem icon={ClockIcon} label="Timesheets" href={'/(main)/timesheets' as Href} />
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: Colors.sidebarBackground,
    zIndex: 20,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[5],
  },
  appName: {
    fontSize: Typography.size['3xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.sidebarText,
    letterSpacing: 0.3,
  },
  nav: {
    flex: 1,
  },
});
