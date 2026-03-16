import { useTheme } from '@/src/theme';
import { Spacing, Typography } from '@/src/theme';
import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Markdown from 'react-native-markdown-display';
import type { Message } from '@/src/types/chat.types';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = React.memo(function ChatMessage({ message }: ChatMessageProps) {
  const colors = useTheme();
  const isUser = message.sender === 'user';

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

  if (isUser) {
    return (
      <Animated.View
        entering={FadeInDown.duration(200).springify()}
        style={styles.containerUser}
      >
        <View
          style={[styles.bubbleUser, { backgroundColor: colors.bubbleUser }]}
          accessibilityRole="text"
          accessibilityLabel={`You: ${message.content || 'Image'}`}
        >
          {message.imageUri && (
            <Image source={{ uri: message.imageUri }} style={styles.messageImage} resizeMode="cover" />
          )}
          {message.content ? <Text style={[styles.textUser, { color: colors.bubbleUserText }]}>{message.content}</Text> : null}
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
      <Markdown style={markdownStyles}>{message.content}</Markdown>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
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
});
