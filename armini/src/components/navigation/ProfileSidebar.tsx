import { APP_NAME, USER_NAME } from '@/src/constants/app.constants';
import { useProfileAnimation } from '@/src/hooks/useProfileAnimation';
import { Colors, Spacing, Typography } from '@/src/theme';
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
import { forwardRef, useImperativeHandle } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  noBorder?: boolean;
}

function ProfileMenuItem({ icon: IconComponent, label, onPress, destructive, noBorder }: ProfileMenuItemProps) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, noBorder && styles.menuRowNoBorder]}
      onPress={onPress}
      activeOpacity={0.5}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <IconComponent
        size={18}
        color={destructive ? '#e05c5c' : ROW_ICON}
        weight="regular"
      />
      <Text style={[styles.menuLabel, destructive && styles.menuLabelDestructive]}>{label}</Text>
      {!destructive && <CaretRightIcon size={13} color={ROW_CARET} />}
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
    setStatusBarStyle('dark');
  };

  const handleClose = () => {
    closeProfile();
    onOpenChange?.(false);
    setStatusBarStyle('dark');
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
              <XIcon size={20} color={ICON_MUTED} />
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
              <View style={styles.avatar} accessibilityRole="image" accessibilityLabel="Avatar">
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
              <Text style={styles.profileName}>{USER_NAME}</Text>
              <Text style={styles.profileRole}>Employee · ARMIS</Text>
            </View>

            {/* Conta */}
            <Text style={styles.sectionLabel}>Conta</Text>
            <View style={styles.section}>
              <ProfileMenuItem icon={UserIcon} label="Perfil" />
              <ProfileMenuItem icon={BellIcon} label="Notificações" noBorder />
            </View>

            {/* Aplicação */}
            <Text style={styles.sectionLabel}>Aplicação</Text>
            <View style={styles.section}>
              <ProfileMenuItem icon={GearIcon} label="Definições" />
              <ProfileMenuItem icon={QuestionIcon} label="Ajuda & Suporte" />
              <ProfileMenuItem icon={InfoIcon} label="Sobre" noBorder />
            </View>

            {/* Logout — sem borders */}
            <View style={styles.logoutRow}>
              <ProfileMenuItem icon={SignOutIcon} label="Terminar sessão" destructive noBorder />
            </View>

            <Text style={styles.versionLabel}>{APP_NAME} · v1.0</Text>
          </ScrollView>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

// ── Tokens ──────────────────────────────────────────────────────────────────
const BG         = '#111111';
const DIVIDER    = '#1e1e1e';
const ROW_ICON   = Colors.white;
const ROW_CARET  = '#3a3a3a';
const ICON_MUTED = '#505050';

const styles = StyleSheet.create({
  expandContainer: {
    position: 'absolute',
    backgroundColor: BG,
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
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },
  avatarInitials: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.bold,
    color: BG,
    letterSpacing: 1,
  },
  profileName: {
    fontSize: Typography.size['2xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: Spacing[1],
    textAlign: 'center',
  },
  profileRole: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.regular,
    color: ICON_MUTED,
    textAlign: 'center',
  },

  // ── Section labels (subtis)
  sectionLabel: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.medium,
    color: '#3a3a3a',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: Spacing[1],
    marginTop: Spacing[5],
  },

  // ── Section wrapper (border-top + items com border-bottom)
  section: {
    borderTopWidth: 1,
    borderTopColor: DIVIDER,
  },

  // ── Menu rows
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  menuRowNoBorder: {
    borderBottomWidth: 0,
  },
  menuLabel: {
    flex: 1,
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.white,
  },
  menuLabelDestructive: {
    color: '#e05c5c',
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
    color: '#2e2e2e',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
});
