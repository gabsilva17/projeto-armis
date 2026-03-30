import { ChatInput } from './ChatInput';
import { ChatMessageList } from './ChatMessageList';
import { ChatDropdownMenu } from './ChatDropdownMenu';
import { Spacing, useTheme } from '@/src/theme';
import { useChatStore } from '@/src/stores/useChatStore';
import { useChatAnimation } from '@/src/hooks/useChatAnimation';
import { getChatGreeting } from '@/src/services/chat/chatService';
import { CaretDownIcon, DotsThreeVerticalIcon, WarningCircleIcon, XIcon } from 'phosphor-react-native';
import { ROUTES } from '@/src/constants/app.constants';
import { useFinancesStore } from '@/src/stores/useFinancesStore';
import { useRouter } from 'expo-router';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ReAnimated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '@/src/hooks/useKeyboard';
import type { ExpenseActionType } from '@/src/types/chat.types';

export interface ChatHandle {
  open: (originX: number, originY: number) => void;
}

interface ChatBubbleContainerProps {
  onOpenChange?: (open: boolean) => void;
}

export const ChatBubbleContainer = forwardRef<ChatHandle, ChatBubbleContainerProps>(function ChatBubbleContainer({ onOpenChange }, ref) {
  const colors = useTheme();
  const {
    messages,
    suggestions,
    isLoading,
    error,
    ensureSessionBootstrap,
    sendMessage,
    clearMessages,
    clearError,
  } = useChatStore();
  const insets = useSafeAreaInsets();
  const chatGreeting = useMemo(() => getChatGreeting(), []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [errorExpanded, setErrorExpanded] = useState(false);
  const prevError = useRef(error);

  // Colapsar automaticamente quando surge um novo erro
  useEffect(() => {
    if (error && error !== prevError.current) {
      setErrorExpanded(false);
    }
    prevError.current = error;
  }, [error]);

  const { keyboardHeight } = useKeyboard();
  const bottomInset = useSharedValue(insets.bottom);
  useEffect(() => {
    bottomInset.value = insets.bottom;
  }, [insets.bottom, bottomInset]);

  useEffect(() => {
    void ensureSessionBootstrap();
  }, [ensureSessionBootstrap]);
  const spacerStyle = useAnimatedStyle(() => ({
    height: keyboardHeight.value > 0 ? keyboardHeight.value : bottomInset.value,
  }));

  const {
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
  } = useChatAnimation();

  const handleOpen = (originX: number, originY: number) => {
    openChat(originX, originY);
    onOpenChange?.(true);
  };

  const handleClose = () => {
    closeChat();
    onOpenChange?.(false);
  };

  useImperativeHandle(ref, () => ({
    open: handleOpen,
  }));

  const router = useRouter();

  const handleSuggestionSelect = (prompt: string) => {
    void sendMessage(prompt);
  };

  const handleExpenseAction = useCallback((actionType: ExpenseActionType) => {
    if (actionType === 'photo-expense') {
      handleClose();
      useFinancesStore.getState().requestScanReceipt();
      // Aguarda a animação de fecho do chat antes de navegar
      setTimeout(() => {
        router.push(ROUTES.FINANCES);
      }, 350);
    } else if (actionType === 'chat-expense') {
      void sendMessage('Quero registar a despesa por chat, pede-me os dados um a um.');
    }
  }, [handleClose, router, sendMessage]);

  return (
    <Modal
      visible={chatMounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onShow={() => {
        // Safety fallback: keep fade-in feel while recovering from stuck opacity states.
        expandOpacity.setValue(1);
        setTimeout(() => {
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: false,
          }).start();
        }, 340);
      }}
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
            backgroundColor: colors.background,
          },
        ]}
        pointerEvents="auto"
      >
        {/* Content hidden during expand animation, fades in after */}
        <Animated.View style={[styles.chatContent, { opacity: contentOpacity }]}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setMenuOpen((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <DotsThreeVerticalIcon size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <XIcon size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {error ? (
              <View style={[styles.errorBanner, { backgroundColor: colors.surface, borderColor: colors.error }]}>
                <TouchableOpacity
                  style={styles.errorHeader}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setErrorExpanded((v) => !v);
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={errorExpanded ? 'Collapse error details' : 'Expand error details'}
                >
                  <WarningCircleIcon size={16} color={colors.error} weight="fill" />
                  <Text style={[styles.errorTitle, { color: colors.error }]} numberOfLines={1}>
                    {error.length > 60 ? error.slice(0, 57) + '...' : error}
                  </Text>
                  <View style={[styles.errorCaret, errorExpanded && styles.errorCaretExpanded]}>
                    <CaretDownIcon size={14} color={colors.error} weight="bold" />
                  </View>
                </TouchableOpacity>

                {errorExpanded && (
                  <View style={[styles.errorDetails, { borderTopColor: colors.error }]}>
                    <Text style={[styles.errorDetailText, { color: colors.textSecondary }]} selectable>
                      {error}
                    </Text>
                    <TouchableOpacity
                      onPress={clearError}
                      style={[styles.errorDismissButton, { borderColor: colors.error }]}
                      accessibilityRole="button"
                      accessibilityLabel="Dismiss chat error"
                    >
                      <Text style={[styles.errorDismissText, { color: colors.error }]}>Dismiss</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : null}

            <ChatMessageList
              messages={messages}
              isLoading={isLoading}
              greeting={chatGreeting}
              messageOfDay=""
              suggestions={suggestions}
              onSuggestionSelect={handleSuggestionSelect}
              onExpenseAction={handleExpenseAction}
            />
            <ChatInput
              value={composerText}
              onChangeText={setComposerText}
              onSend={sendMessage}
              disabled={isLoading}
            />
            <ReAnimated.View style={spacerStyle} />
          </View>

          {/* Options dropdown */}
          <ChatDropdownMenu
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            onClearMessages={clearMessages}
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  expandContainer: {
    position: 'absolute',
    // overflow: 'hidden' removido — chatContent opacity é 0 durante a animação de expansão,
    // por isso o conteúdo filho nunca é visível fora do border radius animado.
  },
  chatContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingBottom: 8,
    paddingTop: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingBottom: 55,
  },
  errorBanner: {
    marginHorizontal: Spacing[3],
    marginTop: Spacing[2],
    marginBottom: Spacing[1],
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    gap: Spacing[2],
  },
  errorTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  errorCaret: {
    transform: [{ rotate: '0deg' }],
  },
  errorCaretExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  errorDetails: {
    paddingHorizontal: Spacing[3],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing[3],
  },
  errorDetailText: {
    fontSize: 13,
    lineHeight: 19,
  },
  errorDismissButton: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing[1],
    paddingHorizontal: Spacing[3],
    borderRadius: 6,
    borderWidth: 1,
  },
  errorDismissText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
