import { SectionLabel } from '@/src/components/ui/Typography';
import { APP_NAME, USER_NAME } from '@/src/constants/app.constants';
import { useProfileAnimation } from '@/src/hooks/useProfileAnimation';
import { Colors, Spacing, Typography } from '@/src/theme';
import {
  BellIcon,
  CaretRightIcon,
  QuestionIcon,
  InfoIcon,
  SignOutIcon,
  GearIcon,
  UserIcon,
  XIcon,
  type Icon,
} from 'phosphor-react-native';
import { setStatusBarStyle } from 'expo-status-bar';
import { forwardRef, useImperativeHandle } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ProfileHandle {
  open: (originX: number, originY: number) => void;
}

interface ProfileModalProps {
  onOpenChange?: (open: boolean) => void;
}

interface ProfileMenuItemProps {
  icon: Icon;
  label: string;
  onPress?: () => void;
  destructive?: boolean;
}

function ProfileMenuItem({ icon: IconComponent, label, onPress, destructive }: ProfileMenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <IconComponent size={20} color={destructive ? Colors.gray400 : Colors.sidebarText} weight='bold' />
      <Text style={[styles.menuLabel, destructive && styles.menuLabelDestructive]}>{label}</Text>
      <CaretRightIcon size={16} color={Colors.gray700} style={styles.chevron} />
    </TouchableOpacity>
  );
}

export const ProfileSidebar = forwardRef<ProfileHandle, ProfileModalProps>(function ProfileSidebar({ onOpenChange }, ref) {
  const insets = useSafeAreaInsets();

  const {
    profileMounted,
    expandX,
    expandY,
    expandW,
    expandH,
    expandRadius,
    expandOpacity,
    contentOpacity,
    openProfile,
    closeProfile,
  } = useProfileAnimation();

  const handleOpen = (originX: number, originY: number) => {
    openProfile(originX, originY);
    onOpenChange?.(true);
    setStatusBarStyle('light');
  };

  const handleClose = () => {
    closeProfile();
    onOpenChange?.(false);
    setStatusBarStyle('dark');
  };

  useImperativeHandle(ref, () => ({
    open: handleOpen,
  }));

  return (
    <Modal
      visible={profileMounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[
          styles.expandContainer,
          {
            left: expandX,
            top: expandY,
            width: expandW,
            height: expandH,
            borderRadius: expandRadius,
            opacity: expandOpacity,
          },
        ]}
        pointerEvents="auto"
      >
        <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <XIcon size={24} color={Colors.sidebarText} />
            </TouchableOpacity>
          </View>

          {/* Profile info */}
          <View style={styles.profileSection}>
            <View style={styles.avatar} accessibilityLabel="User profile avatar" accessibilityRole="image">
              <UserIcon size={32} color={Colors.white} weight='bold' />
            </View>
            <Text style={styles.profileName}>{USER_NAME}</Text>
            <Text style={styles.profileRole}>Employee · ARMINI</Text>
          </View>

          <View style={styles.divider} />

          {/* Menu items */}
          <View style={styles.menu}>
            <SectionLabel style={styles.sectionLabel}>Account</SectionLabel>
            <ProfileMenuItem icon={UserIcon} label="Profile" />
            <ProfileMenuItem icon={BellIcon} label="Notifications" />

            <SectionLabel style={[styles.sectionLabel, { marginTop: Spacing[5] }]}>App</SectionLabel>
            <ProfileMenuItem icon={GearIcon} label="Settings" />
            <ProfileMenuItem icon={QuestionIcon} label="Help & Support" />
            <ProfileMenuItem icon={InfoIcon} label="About" />
          </View>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing[3] }]}>
            <View style={styles.divider} />
            <ProfileMenuItem icon={SignOutIcon} label="Sign out" destructive />
            <Text style={styles.version}>{APP_NAME} · v1.0</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  expandContainer: {
    position: 'absolute',
    backgroundColor: Colors.sidebarBackground,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing[4],
    paddingBottom: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[6],
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: Colors.gray800,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
    borderWidth: 2,
    borderColor: Colors.gray700,
  },
  profileName: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.sidebarText,
    marginBottom: Spacing[1],
  },
  profileRole: {
    fontSize: Typography.size.sm,
    color: Colors.sidebarTextMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.sidebarDivider,
    marginHorizontal: Spacing[5],
    marginVertical: Spacing[2],
  },
  menu: {
    flex: 1,
    paddingTop: Spacing[3],
  },
  sectionLabel: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[2],
    color: Colors.sidebarTextMuted,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4] - 2,
    gap: Spacing[3],
  },
  menuLabel: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.sidebarText,
  },
  menuLabelDestructive: {
    color: Colors.gray400,
  },
  chevron: {
    opacity: 0.4,
  },
  footer: {
    paddingBottom: Spacing[3],
  },
  version: {
    fontSize: Typography.size.xs,
    color: Colors.sidebarTextMuted,
    textAlign: 'center',
    paddingTop: Spacing[3],
    paddingBottom: Spacing[1],
  },
});
