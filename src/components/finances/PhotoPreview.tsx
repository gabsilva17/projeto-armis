import { Colors, Spacing } from '@/src/theme';
import { XIcon } from 'phosphor-react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';

interface PhotoPreviewProps {
  uri: string;
  onRemove: () => void;
}

export function PhotoPreview({ uri, onRemove }: PhotoPreviewProps) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri }}
        style={styles.image}
        resizeMode="cover"
        accessibilityLabel="Invoice photo preview"
      />
      <Pressable
        onPress={onRemove}
        style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Remove photo"
      >
        <XIcon size={18} color={Colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing[6],
    marginBottom: Spacing[4],
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 300,
  },
  removeButton: {
    position: 'absolute',
    top: Spacing[3],
    right: Spacing[3],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer' as never,
  },
  removeButtonPressed: {
    backgroundColor: Colors.gray700,
  },
});
