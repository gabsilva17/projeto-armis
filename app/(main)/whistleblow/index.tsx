import { Colors, Spacing, Typography } from '@/src/theme';
import { useTopbarRefresh } from '@/src/hooks/useTopbarRefresh';
import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function WhistleblowingScreen() {
  const handleRefresh = useCallback(async () => {
    // No remote data in this screen yet; keep topbar refresh behavior consistent.
  }, []);

  useTopbarRefresh(handleRefresh);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.iconWrapper}>
        <Ionicons name="shield-checkmark-outline" size={40} color={Colors.textPrimary} />
      </View>
      <Text style={styles.subtitle}>
        Report concerns confidentially and securely. Your identity is protected.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
