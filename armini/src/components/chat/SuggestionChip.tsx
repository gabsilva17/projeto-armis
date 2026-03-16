import { Colors, Spacing, Typography } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SuggestionChip as SuggestionChipType } from '@/src/types/chat.types';

interface SuggestionChipProps {
  chip: SuggestionChipType;
  onPress: (prompt: string) => void;
}

export function SuggestionChip({ chip, onPress }: SuggestionChipProps) {
  return (
    <Pressable
      onPress={() => onPress(chip.prompt)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
      accessibilityLabel={chip.label}
    >
      <View style={styles.body}>
        <Text style={styles.label}>{chip.label}</Text>
      </View>
      <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
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
    borderBottomColor: Colors.border,
  },
  rowPressed: {
    backgroundColor: Colors.gray100,
  },
  body: {
    flex: 1,
  },
  label: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textPrimary,
  },
});
