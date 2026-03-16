import { ActionListRow } from '@/src/components/ui/ActionListRow';
import type { SuggestionChip as SuggestionChipType } from '@/src/types/chat.types';

interface SuggestionChipProps {
  chip: SuggestionChipType;
  onPress: (prompt: string) => void;
}

export function SuggestionChip({ chip, onPress }: SuggestionChipProps) {
  return (
    <ActionListRow
      title={chip.label}
      onPress={() => onPress(chip.prompt)}
      accessibilityLabel={chip.label}
    />
  );
}
