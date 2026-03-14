import { InvoiceCapture } from '@/src/components/finances/InvoiceCapture';
import { Colors } from '@/src/theme';
import { StyleSheet, View } from 'react-native';

export default function FinancesScreen() {
  return (
    <View style={styles.container}>
      <InvoiceCapture />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
