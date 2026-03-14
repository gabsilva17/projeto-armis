import { Button } from '@/src/components/ui/Button';
import { Colors, Spacing } from '@/src/theme';
import { CameraIcon, ImageIcon } from 'phosphor-react-native';
import { Platform, StyleSheet, View } from 'react-native';

interface CaptureButtonsProps {
  hasPhoto: boolean;
  onTakePhoto: () => void;
  onPickLibrary: () => void;
}

export function CaptureButtons({ hasPhoto, onTakePhoto, onPickLibrary }: CaptureButtonsProps) {
  return (
    <View style={styles.container}>
      {Platform.OS !== 'web' && (
        <Button
          variant="secondary"
          onPress={onTakePhoto}
          label={hasPhoto ? 'Retake' : 'Take Photo'}
          icon={<CameraIcon size={20} color={Colors.textPrimary} />}
          style={styles.button}
          accessibilityLabel={hasPhoto ? 'Retake photo' : 'Take photo'}
        />
      )}
      <Button
        variant="secondary"
        onPress={onPickLibrary}
        label={hasPhoto ? 'Choose different' : 'Choose from Library'}
        icon={<ImageIcon size={20} color={Colors.textPrimary} />}
        style={styles.button}
        accessibilityLabel={hasPhoto ? 'Choose different photo' : 'Choose from library'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: Spacing[3],
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[4],
  },
  button: {
    width: '100%',
  },
});
