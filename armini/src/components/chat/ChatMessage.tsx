import { Spacing, Typography, useTheme } from '@/src/theme';
import * as Clipboard from 'expo-clipboard';
import { CopyIcon, WrenchIcon } from 'phosphor-react-native';
import React, { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Markdown from 'react-native-markdown-display';
import { useTranslation } from 'react-i18next';
import { ExpenseActionButtons } from './ExpenseActionButtons';
import type { Message, ExpenseActionType } from '@/src/types/chat.types';

interface ChatMessageProps {
  message: Message;
  onExpenseAction?: (actionType: ExpenseActionType) => void;
}

export const ChatMessage = React.memo(function ChatMessage({ message, onExpenseAction }: ChatMessageProps) {
  const colors = useTheme();
  const { t } = useTranslation('chat');
  const isUser = message.sender === 'user';
  const [isSelectionModalVisible, setIsSelectionModalVisible] = useState(false);

  const handleCopyMessage = async () => {
    const content = message.content?.trim();
    if (!content) return;
    await Clipboard.setStringAsync(content);
  };

  const markdownStyles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          color: colors.textPrimary,
          fontSize: Typography.size.base,
          lineHeight: Typography.size.base * Typography.lineHeight.normal,
        },
        paragraph: {
          marginTop: 0,
          marginBottom: 4,
        },
        strong: {
          fontFamily: Typography.fontFamily.semibold,
          color: colors.textPrimary,
        },
        em: {
          fontStyle: 'italic',
          color: colors.textPrimary,
        },
        heading1: {
          fontSize: Typography.size.lg,
          fontFamily: Typography.fontFamily.bold,
          color: colors.textPrimary,
          marginBottom: Spacing[2],
          marginTop: Spacing[2],
        },
        heading2: {
          fontSize: Typography.size.md,
          fontFamily: Typography.fontFamily.bold,
          color: colors.textPrimary,
          marginBottom: Spacing[1],
          marginTop: Spacing[2],
        },
        heading3: {
          fontSize: Typography.size.base,
          fontFamily: Typography.fontFamily.semibold,
          color: colors.textPrimary,
          marginBottom: Spacing[1],
          marginTop: Spacing[2],
        },
        bullet_list: {
          marginVertical: Spacing[1],
        },
        ordered_list: {
          marginVertical: Spacing[1],
        },
        list_item: {
          marginBottom: 2,
          flexDirection: 'row',
        },
        bullet_list_icon: {
          color: colors.textPrimary,
          fontSize: Typography.size.base,
          lineHeight: Typography.size.base * Typography.lineHeight.normal,
          marginRight: Spacing[2],
        },
        ordered_list_icon: {
          color: colors.textPrimary,
          fontSize: Typography.size.base,
          lineHeight: Typography.size.base * Typography.lineHeight.normal,
          marginRight: Spacing[2],
        },
        code_inline: {
          backgroundColor: colors.gray200,
          color: colors.textPrimary,
          fontFamily: 'monospace' as const,
          fontSize: Typography.size.sm,
          borderRadius: 4,
          paddingHorizontal: 4,
        },
        fence: {
          backgroundColor: colors.gray100,
          borderRadius: 8,
          padding: Spacing[3],
          marginVertical: Spacing[2],
        },
        code_block: {
          backgroundColor: colors.gray100,
          borderRadius: 8,
          padding: Spacing[3],
          marginVertical: Spacing[2],
          color: colors.textPrimary,
          fontFamily: 'monospace' as const,
          fontSize: Typography.size.sm,
        },
        blockquote: {
          borderLeftWidth: 3,
          borderLeftColor: colors.gray300,
          paddingLeft: Spacing[3],
          marginVertical: Spacing[2],
          opacity: 0.8,
        },
        hr: {
          backgroundColor: colors.border,
          height: 1,
          marginVertical: Spacing[3],
        },
        link: {
          color: colors.textPrimary,
          textDecorationLine: 'underline',
        },
        table: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 6,
          marginVertical: Spacing[2],
        },
        th: {
          backgroundColor: colors.gray100,
          padding: Spacing[2],
          fontFamily: Typography.fontFamily.semibold,
        },
        td: {
          padding: Spacing[2],
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
      }),
    [colors],
  );

  const markdownRules = useMemo(
    () => ({
      text: (node: { key: string; content: string }, _children: unknown, _parent: unknown, styles: { text: object }, inheritedStyles: object = {}) => (
        <Text key={node.key} selectable style={[inheritedStyles, styles.text]}>
          {node.content}
        </Text>
      ),
      textgroup: (node: { key: string }, children: React.ReactNode, _parent: unknown, styles: { textgroup: object }) => (
        <Text key={node.key} selectable style={styles.textgroup}>
          {children}
        </Text>
      ),
    }),
    [],
  );

  if (message.toolCall) {
    const toolLabel = t(`toolNames.${message.toolCall.name}`, { defaultValue: message.toolCall.name });
    return (
      <Animated.View entering={FadeInDown.duration(180)} style={styles.containerToolCall}>
        <View style={[styles.toolCallRow, { backgroundColor: colors.gray100, borderColor: colors.gray200 }]}>
          <WrenchIcon size={14} color={colors.textSecondary} weight="fill" />
          <Text style={[styles.toolCallText, { color: colors.textSecondary }]}>{toolLabel}</Text>
        </View>
      </Animated.View>
    );
  }

  if (isUser) {
    return (
      <Animated.View entering={FadeInDown.duration(200).springify()} style={styles.containerUser}>
        <View
          style={[styles.bubbleUser, { backgroundColor: colors.bubbleUser }]}
          accessibilityRole="text"
          accessibilityLabel={`You: ${message.content || 'Image'}`}
        >
          {message.imageUri && (
            <Image source={{ uri: message.imageUri }} style={styles.messageImage} resizeMode="cover" />
          )}
          {message.content ? (
            <Text selectable style={[styles.textUser, { color: colors.bubbleUserText }]}>{message.content}</Text>
          ) : null}

        
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(200).springify()}
      style={styles.containerAI}
      accessibilityRole="text"
      accessibilityLabel={`Assistant: ${message.content}`}
    >
      <View>
        <Markdown style={markdownStyles} rules={markdownRules}>
          {message.content}
        </Markdown>
      </View>

      {message.actions && message.actions.length > 0 && onExpenseAction ? (
        <ExpenseActionButtons actions={message.actions} onAction={onExpenseAction} />
      ) : null}

      <View style={styles.aiActionsRow}>
        <Pressable onPress={() => void handleCopyMessage()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Copy assistant message">
          <CopyIcon size={16} color={colors.textSecondary} weight="regular" />
        </Pressable>
        <Pressable
          onPress={() => setIsSelectionModalVisible(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open full text selection"
          style={styles.selectAllButton}
        >
          <Text style={[styles.selectAllButtonText, { color: colors.textSecondary }]}>Selecionar texto</Text>
        </Pressable>
      </View>

      <Modal
        visible={isSelectionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSelectionModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Selecao de texto</Text>
              <Pressable onPress={() => setIsSelectionModalVisible(false)} accessibilityRole="button" accessibilityLabel="Close full text selection">
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>Fechar</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text selectable style={[styles.modalText, { color: colors.textPrimary }]}>
                {message.content}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  containerToolCall: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[1],
  },
  toolCallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    columnGap: Spacing[2],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  toolCallText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.medium,
    lineHeight: Typography.size.sm * Typography.lineHeight.normal,
  },
  containerUser: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[1],
    alignItems: 'flex-end',
  },
  containerAI: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[1],
  },
  bubbleUser: {
    maxWidth: '80%',
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginBottom: Spacing[2],
    marginHorizontal: -Spacing[4],
    marginTop: -Spacing[3],
  },
  textUser: {
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * Typography.lineHeight.normal,
  },
  aiActionsRow: {
    marginTop: Spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    columnGap: Spacing[3],
  },
  selectAllButton: {
    paddingVertical: 2,
  },
  selectAllButtonText: {
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * Typography.lineHeight.normal,
    textDecorationLine: 'underline',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: Spacing[4],
  },
  modalCard: {
    maxHeight: '75%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#999999',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  modalCloseText: {
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * Typography.lineHeight.normal,
  },
  modalContent: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
  },
  modalText: {
    fontSize: Typography.size.base,
    lineHeight: Typography.size.base * Typography.lineHeight.normal,
  },
});
