import { Spacing } from '@/src/theme';
import { StyleSheet, View } from 'react-native';
import { SuggestionChip } from './SuggestionChip';
import type { SuggestionChip as SuggestionChipType } from '@/src/types/chat.types';

interface SuggestionChipsProps {
  chips: SuggestionChipType[];
  onSelect: (prompt: string) => void;
}

export function SuggestionChips({ chips, onSelect }: SuggestionChipsProps) {
  return (
    <View style={styles.container}>
      {chips.map((chip) => (
        <SuggestionChip key={chip.id} chip={chip} onPress={onSelect} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[6],
    gap: Spacing[3],
  },
});

