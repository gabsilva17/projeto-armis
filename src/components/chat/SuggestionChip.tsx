import { useTheme } from '@/src/theme';
import { Spacing, Typography } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SuggestionChip as SuggestionChipType } from '@/src/types/chat.types';

interface SuggestionChipProps {
  chip: SuggestionChipType;
  onPress: (prompt: string) => void;
}

export function SuggestionChip({ chip, onPress }: SuggestionChipProps) {
  const colors = useTheme();
  return (
    <Pressable
      onPress={() => onPress(chip.prompt)}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.border },
        pressed && { backgroundColor: colors.gray100 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={chip.label}
    >
      <View style={styles.body}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>{chip.label}</Text>
      </View>
      <Ionicons name="arrow-forward" size={16} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
  },
  body: {
    flex: 1,
  },
  label: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.semibold,
  },
});
