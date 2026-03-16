import { ChatInput } from './ChatInput';
import { ChatMessageList } from './ChatMessageList';
import { ChatDropdownMenu } from './ChatDropdownMenu';
import { useTheme } from '@/src/theme';
import { Spacing } from '@/src/theme';
import { useChatStore } from '@/src/stores/useChatStore';
import { useChatAnimation } from '@/src/hooks/useChatAnimation';
import { getDefaultSuggestions, getChatGreeting } from '@/src/services/chat/chatService';
import { DotsThreeVerticalIcon, XIcon } from 'phosphor-react-native';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import ReAnimated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboard } from '@/src/hooks/useKeyboard';

export interface ChatHandle {
  open: (originX: number, originY: number) => void;
}

interface ChatBubbleContainerProps {
  onOpenChange?: (open: boolean) => void;
}

export const ChatBubbleContainer = forwardRef<ChatHandle, ChatBubbleContainerProps>(function ChatBubbleContainer({ onOpenChange }, ref) {
  const colors = useTheme();
  const { messages, isLoading, sendMessage, sendMessageWithImage, clearMessages } = useChatStore();
  const insets = useSafeAreaInsets();
  const chatGreeting = useMemo(() => getChatGreeting(), []);
  const suggestions = useMemo(() => getDefaultSuggestions(), []);
  const [menuOpen, setMenuOpen] = useState(false);

  const { keyboardHeight } = useKeyboard();
  const bottomInset = useSharedValue(insets.bottom);
  useEffect(() => {
    bottomInset.value = insets.bottom;
  }, [insets.bottom, bottomInset]);
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

  return (
    <Modal
      visible={chatMounted}
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
            <ChatMessageList
              messages={messages}
              isLoading={isLoading}
              greeting={chatGreeting}
              messageOfDay=""
              suggestions={suggestions}
              onSuggestionSelect={sendMessage}
            />
            <ChatInput onSend={sendMessage} onSendImage={sendMessageWithImage} disabled={isLoading} />
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
});
