import { ManualInvoiceEntry } from '@/src/components/finances/ManualInvoiceEntry';
import { useTheme } from '@/src/theme';
import { StyleSheet, View } from 'react-native';

export default function FinancesScreen() {
  const colors = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ManualInvoiceEntry />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
