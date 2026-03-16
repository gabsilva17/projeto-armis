import { Spacing, Typography, useTheme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function WhistleblowingScreen() {
  const colors = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.iconWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="shield-checkmark-outline" size={40} color={colors.textPrimary} />
      </View>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Report concerns confidentially and securely. Your identity is protected.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
    gap: Spacing[4],
    paddingBottom: Spacing[16],
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontSize: Typography.size.base,
    textAlign: 'center',
    lineHeight: 22,
  },
});
