import { Shadows, Spacing, Typography, useTheme } from '@/src/theme';
import { HIT_SLOP } from '@/src/constants/ui.constants';
import { ArrowUpIcon } from 'phosphor-react-native';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: (text: string) => Promise<boolean>;
  disabled?: boolean;
  focusSignal?: number;
}

export function ChatInput({ value, onChangeText, onSend, disabled = false, focusSignal = 0 }: ChatInputProps) {
  const colors = useTheme();
  const { t } = useTranslation();
  const inputRef = useRef<TextInput>(null);

  const canSend = value.trim().length > 0 && !disabled;

  useEffect(() => {
    if (!focusSignal) return;
    inputRef.current?.focus();
  }, [focusSignal]);

  const handleSend = async () => {
    if (!canSend) return;
    const trimmedText = value.trim();

    onChangeText('');
    const ok = await onSend(trimmedText);

    // Restore text if nothing was sent.
    if (!ok) onChangeText(trimmedText);
  };

  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.background }]}>
      {/* Input row */}
      <View style={styles.row}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={t('chat:inputPlaceholder')}
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={2000}
          style={[styles.input, { color: colors.textPrimary }]}
          onSubmitEditing={() => { void handleSend(); }}
          blurOnSubmit={false}
          editable={!disabled}
          accessibilityLabel={t('chat:messageInput')}
        />

        <Pressable
          onPress={() => { void handleSend(); }}
          disabled={!canSend}
          style={styles.sendButton}
          hitSlop={HIT_SLOP.md}
          accessibilityRole="button"
          accessibilityLabel={t('chat:sendMessage')}
        >
          <ArrowUpIcon size={20} color={canSend ? colors.textPrimary : colors.gray400} weight="bold" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing[3],
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.md,
  },

  // Input row
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[2],
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    fontSize: Typography.size.base,
    backgroundColor: 'transparent',
    lineHeight: Typography.size.base * 1.4,
  },
  sendButton: {
    width: 36,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
