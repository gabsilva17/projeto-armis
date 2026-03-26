import { QuickActionsSection } from '@/src/components/home/QuickActionsSection';
import { useChatLauncherStore } from '@/src/stores/useChatLauncherStore';
import { useChatStore } from '@/src/stores/useChatStore';
import { Spacing, Typography, useTheme } from '@/src/theme';
import { useGreeting } from '@/src/hooks/useGreeting';
import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const colors = useTheme();
  const { greeting, messageOfDay } = useGreeting();
  const router = useRouter();
  const requestOpenChat = useChatLauncherStore((state) => state.requestOpenChat);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  const handleNavigate = useCallback(
    (route: string) => router.push(route as Href),
    [router],
  );

  const handleOpenChat = useCallback(() => {
    requestOpenChat();
  }, [requestOpenChat]);

  const handleChatPrompt = useCallback(
    (prompt: string) => {
      requestOpenChat();
      // Pequeno delay para garantir que o chat abre antes de enviar
      setTimeout(() => void sendMessage(prompt), 300);
    },
    [requestOpenChat, sendMessage],
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.greetingSection, { borderBottomColor: colors.black }]}>
        <Text style={[styles.kicker, { color: colors.textMuted }]}>ARMIS DIGITAL HUB</Text>
        <Text style={[styles.greeting, { color: colors.textPrimary }]}>{greeting}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{messageOfDay}</Text>
      </View>

      <Text style={[styles.todayLabel, { color: colors.textMuted }]}>{today}</Text>

      <QuickActionsSection
        onNavigate={handleNavigate}
        onOpenChat={handleOpenChat}
        onChatPrompt={handleChatPrompt}
      />

      <Text style={[styles.footnote, { color: colors.textMuted }]}>Tap a workflow to continue.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[16],
  },
  greetingSection: {
    paddingTop: Spacing[4],
    paddingBottom: Spacing[4],
    borderBottomWidth: 2,
  },
  kicker: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.semibold,
    letterSpacing: 1.2,
    marginBottom: Spacing[2],
  },
  greeting: {
    fontSize: Typography.size['3xl'],
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing[1],
    lineHeight: 42,
  },
  subtitle: {
    fontSize: Typography.size.base,
    lineHeight: 22,
  },
  todayLabel: {
    marginTop: Spacing[4],
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  footnote: {
    marginTop: Spacing[4],
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.regular,
  },
});
