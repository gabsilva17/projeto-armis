import { Colors, Spacing, Typography } from '@/src/theme';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { SuggestionChip as SuggestionChipType } from '@/src/types/chat.types';

interface SuggestionChipProps {
  chip: SuggestionChipType;
  onPress: (prompt: string) => void;
}

export function SuggestionChip({ chip, onPress }: SuggestionChipProps) {
  return (
    <Pressable
      onPress={() => onPress(chip.prompt)}
      style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
      accessibilityRole="button"
      accessibilityLabel={chip.label}
    >
      <Text style={styles.label}>{chip.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    cursor: 'pointer' as never,
  },
  chipPressed: {
    backgroundColor: Colors.gray100,
    borderColor: Colors.gray300,
  },
  label: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
});
