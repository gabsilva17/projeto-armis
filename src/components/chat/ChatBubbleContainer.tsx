import { ChatInput } from './ChatInput';
import { ChatMessageList } from './ChatMessageList';
import { ChatDropdownMenu } from './ChatDropdownMenu';
import { Colors, Spacing } from '@/src/theme';
import { useChatStore } from '@/src/stores/useChatStore';
import { useChatAnimation } from '@/src/hooks/useChatAnimation';
import { getDefaultSuggestions, getChatGreeting } from '@/src/services/chat/chatService';
import { DotsThreeVerticalIcon, XIcon } from 'phosphor-react-native';
import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ChatHandle {
  open: (originX: number, originY: number) => void;
}

interface ChatBubbleContainerProps {
  onOpenChange?: (open: boolean) => void;
}

export const ChatBubbleContainer = forwardRef<ChatHandle, ChatBubbleContainerProps>(function ChatBubbleContainer({ onOpenChange }, ref) {
  const { messages, isLoading, sendMessage, clearMessages } = useChatStore();
  const insets = useSafeAreaInsets();
  const chatGreeting = useMemo(() => getChatGreeting(), []);
  const suggestions = useMemo(() => getDefaultSuggestions(), []);
  const [menuOpen, setMenuOpen] = useState(false);

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
          },
        ]}
        pointerEvents="auto"
      >
        {/* Content hidden during expand animation, fades in after */}
        <Animated.View style={[styles.chatContent, { opacity: contentOpacity }]}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setMenuOpen((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <DotsThreeVerticalIcon size={20} color={Colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <XIcon size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Body — KAV works correctly inside a Modal without overflow:hidden conflict */}
          <KeyboardAvoidingView
            style={styles.body}
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          >
            <ChatMessageList
              messages={messages}
              isLoading={isLoading}
              greeting={chatGreeting}
              messageOfDay=""
              suggestions={suggestions}
              onSuggestionSelect={sendMessage}
            />
            <View style={{ paddingBottom: insets.bottom }}>
              <ChatInput onSend={sendMessage} disabled={isLoading} />
            </View>
          </KeyboardAvoidingView>

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
    backgroundColor: Colors.background,
    // overflow: 'hidden' removed — it conflicted with KeyboardAvoidingView inside the Modal.
    // Safe to remove: chatContent opacity is 0 during the expand animation,
    // so child content is never visible outside the animating border radius.
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
    borderBottomColor: Colors.border,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
});
