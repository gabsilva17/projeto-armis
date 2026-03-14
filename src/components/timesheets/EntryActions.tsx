import { Colors, Spacing, Typography } from '@/src/theme';
import { PencilSimpleIcon, TrashIcon, XIcon } from 'phosphor-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EntryActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function EntryActions({ onEdit, onDelete, onCancel }: EntryActionsProps) {
  return (
    <View style={styles.inlineActions}>
      <TouchableOpacity style={styles.inlineActionBtn} onPress={onEdit} activeOpacity={0.75}>
        <PencilSimpleIcon size={15} color={Colors.textPrimary} />
        <Text style={styles.inlineActionText}>Edit</Text>
      </TouchableOpacity>
      <View style={styles.inlineActionDivider} />
      <TouchableOpacity style={styles.inlineActionBtn} onPress={onDelete} activeOpacity={0.75}>
        <TrashIcon size={15} color={Colors.error} />
        <Text style={[styles.inlineActionText, { color: Colors.error }]}>Delete</Text>
      </TouchableOpacity>
      <View style={styles.inlineActionDivider} />
      <TouchableOpacity style={styles.inlineActionBtn} onPress={onCancel} activeOpacity={0.75}>
        <XIcon size={15} color={Colors.textMuted} />
        <Text style={[styles.inlineActionText, { color: Colors.textMuted }]}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  inlineActions: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Colors.border,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  inlineActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    gap: Spacing[2],
  },
  inlineActionDivider: { width: 1, backgroundColor: Colors.border },
  inlineActionText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
});
