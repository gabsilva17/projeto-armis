import { Colors, Spacing, Typography } from '@/src/theme';
import { ArrowUpIcon } from 'phosphor-react-native';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const canSend = text.trim().length > 0 && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    const trimmed = text.trim();
    setText('');
    onSend(trimmed);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder="Chat with ARMINI…"
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={2000}
          style={styles.input}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          editable={!disabled}
          accessibilityLabel="Message input"
        />
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <ArrowUpIcon
            size={18}
            color={canSend ? Colors.white : Colors.gray500}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing[2],
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 22,
    lineHeight: Typography.size.base * 1.4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer' as never,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray200,
  },
});
