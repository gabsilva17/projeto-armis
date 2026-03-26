import { ChatDropdownMenu } from '@/src/components/chat/ChatDropdownMenu';
import { ChatInput } from '@/src/components/chat/ChatInput';
import { ChatMessageList } from '@/src/components/chat/ChatMessageList';
import { BOTTOM_NAV_HEIGHT } from '@/src/components/navigation/BottomNavBar';
import { getChatGreeting } from '@/src/services/chat/chatService';
import { useChatStore } from '@/src/stores/useChatStore';
import { Spacing, Typography, useTheme } from '@/src/theme';
import { DotsThreeVerticalIcon, ArrowLeftIcon } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function ArminiChatScreen() {
  const colors = useTheme();
  const { t } = useTranslation('chat');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    messages,
    suggestions,
    isLoading,
    error,
    ensureSessionBootstrap,
    sendMessage,
    sendMessageWithImage,
    clearMessages,
    clearError,
  } = useChatStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [composerText, setComposerText] = useState('');
  const chatGreeting = useMemo(() => getChatGreeting(), []);

  useEffect(() => {
    void ensureSessionBootstrap();
  }, [ensureSessionBootstrap]);

  const handleSuggestionSelect = (prompt: string) => {
    void sendMessage(prompt);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}> 
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('common:back')}
        >
          <ArrowLeftIcon size={20} color={colors.textPrimary} weight="bold" />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('title')}</Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setMenuOpen((v) => !v)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('chatOptions')}
        >
          <DotsThreeVerticalIcon size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.body, { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom }]}> 
        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.surface, borderColor: colors.error }]}> 
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity onPress={clearError} accessibilityRole="button" accessibilityLabel={t('dismissError')}>
              <Text style={[styles.errorDismiss, { color: colors.error }]}>{t('common:dismiss')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <ChatMessageList
          messages={messages}
          isLoading={isLoading}
          greeting={chatGreeting}
          messageOfDay=""
          suggestions={suggestions}
          onSuggestionSelect={handleSuggestionSelect}
        />

        <ChatInput
          value={composerText}
          onChangeText={setComposerText}
          onSend={sendMessage}
          onSendImage={sendMessageWithImage}
          disabled={isLoading}
        />
      </View>

      <ChatDropdownMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} onClearMessages={clearMessages} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  body: {
    flex: 1,
  },
  errorBanner: {
    marginHorizontal: Spacing[3],
    marginTop: Spacing[2],
    marginBottom: Spacing[1],
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[2],
  },
  errorText: {
    flex: 1,
    fontSize: Typography.size.sm,
  },
  errorDismiss: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.semibold,
  },
});