import { Colors, Spacing, Typography } from '@/src/theme';
import { CloudArrowUpIcon } from 'phosphor-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

interface SubmitButtonProps {
  onPress: () => void;
  isLoading: boolean;
  disabled: boolean;
}

export function SubmitButton({ onPress, isLoading, disabled }: SubmitButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      style={({ pressed }) => [
        styles.button,
        (disabled || isLoading) && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Submit invoice"
    >
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <CloudArrowUpIcon size={20} color={disabled ? Colors.gray500 : Colors.white} />
        )}
        <Text style={[styles.text, disabled && styles.textDisabled]}>
          {isLoading ? 'Submitting…' : 'Submit Invoice'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginHorizontal: Spacing[6],
    marginBottom: Spacing[4],
    backgroundColor: Colors.black,
    borderRadius: 12,
    minHeight: 52,
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    cursor: 'pointer' as never,
  },
  buttonDisabled: {
    backgroundColor: Colors.gray200,
  },
  buttonPressed: {
    backgroundColor: Colors.gray800,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  text: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
  },
  textDisabled: {
    color: Colors.gray500,
  },
});
