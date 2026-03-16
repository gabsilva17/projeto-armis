import { APP_NAME, ROUTES, USER_NAME } from '@/src/constants/app.constants';
import { useProfileAnimation } from '@/src/hooks/useProfileAnimation';
import { useTheme } from '@/src/theme';
import { useThemeStore } from '@/src/stores/useThemeStore';
import { Spacing, Typography } from '@/src/theme';
import {
  BellIcon,
  CaretRightIcon,
  GearIcon,
  InfoIcon,
  QuestionIcon,
  SignOutIcon,
  UserIcon,
  XIcon,
  type Icon,
} from 'phosphor-react-native';
import { setStatusBarStyle } from 'expo-status-bar';
import { useRouter, type Href } from 'expo-router';
import { forwardRef, useImperativeHandle } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CLOSE_TO_NAV_DELAY_MS = 180;

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
  noBorder?: boolean;
}

function ProfileMenuItem({ icon: IconComponent, label, onPress, destructive, noBorder }: ProfileMenuItemProps) {
  const colors = useTheme();
  return (
    <TouchableOpacity
      style={[styles.menuRow, noBorder && styles.menuRowNoBorder, { borderBottomColor: colors.sidebarDivider }]}
      onPress={onPress}
      activeOpacity={0.5}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <IconComponent
        size={18}
        color={destructive ? colors.error : colors.sidebarText}
        weight="regular"
      />
      <Text style={[styles.menuLabel, { color: destructive ? colors.error : colors.sidebarText }]}>{label}</Text>
      {!destructive && <CaretRightIcon size={13} color={colors.sidebarMuted} />}
    </TouchableOpacity>
  );
}

export const ProfileSidebar = forwardRef<ProfileHandle, ProfileModalProps>(function ProfileSidebar({ onOpenChange }, ref) {
  const colors = useTheme();
  const themeId = useThemeStore((s) => s.themeId);
  const router = useRouter();
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
    setStatusBarStyle(themeId === 'dark' ? 'light' : 'dark');
  };

  const handleOpenSettings = () => {
    handleClose();
    setTimeout(() => {
      router.push(ROUTES.SETTINGS as Href);
    }, CLOSE_TO_NAV_DELAY_MS);
  };

  useImperativeHandle(ref, () => ({
    open: handleOpen,
  }));

  const initials = USER_NAME
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
            backgroundColor: colors.sidebarBackground,
          },
        ]}
        pointerEvents="auto"
      >
        <Animated.View style={[styles.content, { opacity: contentOpacity }]}>

          {/* ── Close button — fixo fora do scroll ── */}
          <View style={[styles.header, { paddingTop: insets.top + Spacing[2] }]}>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Fechar perfil"
            >
              <XIcon size={20} color={colors.sidebarMuted} />
            </TouchableOpacity>
          </View>

          {/* ── Tudo scrollável ── */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing[8] }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <View style={styles.hero}>
              <View style={[styles.avatar, { backgroundColor: colors.sidebarText }]} accessibilityRole="image" accessibilityLabel="Avatar">
                <Text style={[styles.avatarInitials, { color: colors.sidebarBackground }]}>{initials}</Text>
              </View>
              <Text style={[styles.profileName, { color: colors.sidebarText }]}>{USER_NAME}</Text>
              <Text style={[styles.profileRole, { color: colors.sidebarMuted }]}>Employee · ARMIS</Text>
            </View>

            {/* Conta */}
            <Text style={[styles.sectionLabel, { color: colors.sidebarMuted }]}>Conta</Text>
            <View style={[styles.section, { borderTopColor: colors.sidebarDivider }]}>
              <ProfileMenuItem icon={UserIcon} label="Perfil" />
              <ProfileMenuItem icon={BellIcon} label="Notificações" noBorder />
            </View>

            {/* Aplicação */}
            <Text style={[styles.sectionLabel, { color: colors.sidebarMuted }]}>Aplicação</Text>
            <View style={[styles.section, { borderTopColor: colors.sidebarDivider }]}>
              <ProfileMenuItem icon={GearIcon} label="Definições" onPress={handleOpenSettings} />
              <ProfileMenuItem icon={QuestionIcon} label="Ajuda & Suporte" />
              <ProfileMenuItem icon={InfoIcon} label="Sobre" noBorder />
            </View>

            {/* Logout — sem borders */}
            <View style={styles.logoutRow}>
              <ProfileMenuItem icon={SignOutIcon} label="Terminar sessão" destructive noBorder />
            </View>

            <Text style={[styles.versionLabel, { color: colors.sidebarDivider }]}>{APP_NAME} · v1.0</Text>
          </ScrollView>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  expandContainer: {
    position: 'absolute',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },

  // ── Header (fixo)
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[2],
  },

  // ── Scroll
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing[6],
  },

  // ── Hero (centrado, sem separador)
  hero: {
    alignItems: 'center',
    paddingTop: Spacing[4],
    paddingBottom: Spacing[8],
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },
  avatarInitials: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: 1,
  },
  profileName: {
    fontSize: Typography.size['2xl'],
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: Spacing[1],
    textAlign: 'center',
  },
  profileRole: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
  },

  // ── Section labels (subtis)
  sectionLabel: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.medium,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: Spacing[1],
    marginTop: Spacing[5],
  },

  // ── Section wrapper (border-top + items com border-bottom)
  section: {
    borderTopWidth: 1,
  },

  // ── Menu rows
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
  },
  menuRowNoBorder: {
    borderBottomWidth: 0,
  },
  menuLabel: {
    flex: 1,
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.medium,
  },

  // ── Logout (sem borders, espaçamento próprio)
  logoutRow: {
    marginTop: Spacing[8],
  },

  // ── Footer
  versionLabel: {
    marginTop: Spacing[8],
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
});
