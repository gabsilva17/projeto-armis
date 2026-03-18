import { useTheme } from '@/src/theme';
import { ANIMATION_DURATIONS, EASING } from '@/src/constants/animation.constants';
import { IMAGE_PICKER_SHEET, IMAGE_UPLOAD_CONFIG } from '@/src/constants/image.constants';
import { HIT_SLOP } from '@/src/constants/ui.constants';
import { Shadows, Spacing, Typography } from '@/src/theme';
import * as ImagePicker from 'expo-image-picker';
import { ArrowUpIcon, CameraIcon, ImagesIcon, PaperclipIcon, XIcon } from 'phosphor-react-native';
import { useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeInUp,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface ChatInputProps {
  onSend: (text: string) => Promise<boolean>;
  onSendImage?: (base64: string, uri: string, text: string) => Promise<boolean>;
  disabled?: boolean;
}

export function ChatInput({ onSend, onSendImage, disabled = false }: ChatInputProps) {
  const colors = useTheme();
  const [text, setText] = useState('');
  const [pendingImage, setPendingImage] = useState<{ uri: string; base64: string } | null>(null);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Clip icon — press feedback via timing (sem bounce)
  const clipScale = useSharedValue(1);
  const clipAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: clipScale.value }],
  }));

  const canSend = (text.trim().length > 0 || pendingImage !== null) && !disabled;

  const handleSend = async () => {
    if (!canSend) return;
    const trimmedText = text.trim();

    if (pendingImage) {
      const imageToSend = pendingImage;

      // Clear preview immediately to provide submit feedback.
      setPendingImage(null);
      setText('');

      await onSendImage?.(imageToSend.base64, imageToSend.uri, trimmedText);
    } else {
      setText('');
      const ok = await onSend(trimmedText);

      // Restore text if nothing was sent.
      if (!ok) setText(trimmedText);
    }
  };

  const takePhoto = async () => {
    setAttachMenuOpen(false);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Camera access is needed to take a photo.');
          return;
        }
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: IMAGE_UPLOAD_CONFIG.mediaTypes,
        quality: IMAGE_UPLOAD_CONFIG.quality,
        base64: IMAGE_UPLOAD_CONFIG.base64,
      });
      if (!result.canceled && result.assets[0]) {
        setPendingImage({ uri: result.assets[0].uri, base64: result.assets[0].base64 ?? '' });
      }
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not open camera.');
    }
  };

  const pickFromLibrary = async () => {
    setAttachMenuOpen(false);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Photo library access is needed.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: IMAGE_UPLOAD_CONFIG.mediaTypes,
        quality: IMAGE_UPLOAD_CONFIG.quality,
        base64: IMAGE_UPLOAD_CONFIG.base64,
      });
      if (!result.canceled && result.assets[0]) {
        setPendingImage({ uri: result.assets[0].uri, base64: result.assets[0].base64 ?? '' });
      }
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not open photo library.');
    }
  };

  const handleClipPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [...IMAGE_PICKER_SHEET.options], cancelButtonIndex: IMAGE_PICKER_SHEET.cancelButtonIndex },
        (index) => {
          if (index === 1) takePhoto();
          if (index === 2) pickFromLibrary();
        },
      );
    } else {
      setAttachMenuOpen((v) => !v);
    }
  };

  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.background }]}>
      {/* Image preview strip */}
      {pendingImage && (
        <Animated.View
          entering={FadeInUp.duration(ANIMATION_DURATIONS.chatPreviewEnter).easing(EASING.outCubic)}
          exiting={FadeOutDown.duration(ANIMATION_DURATIONS.chatPreviewExit).easing(EASING.inCubic)}
          style={styles.previewRow}
        >
          <View style={styles.previewWrapper}>
            <Image source={{ uri: pendingImage.uri }} style={styles.previewImage} resizeMode="cover" />
            <Pressable
              style={[styles.previewRemove, { backgroundColor: colors.black }]}
              onPress={() => setPendingImage(null)}
              hitSlop={HIT_SLOP.sm}
              accessibilityRole="button"
              accessibilityLabel="Remove image"
            >
              <XIcon size={11} color={colors.white} weight="bold" />
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Inline attach menu — Android only */}
      {attachMenuOpen && (
        <Animated.View
          entering={FadeInUp.duration(ANIMATION_DURATIONS.chatAttachMenuEnter).easing(EASING.outCubic)}
          exiting={FadeOutDown.duration(ANIMATION_DURATIONS.chatAttachMenuExit).easing(EASING.inCubic)}
          style={[styles.attachMenu, { borderBottomColor: colors.border }]}
        >
          <Pressable
            style={({ pressed }) => [styles.attachOption, pressed && { backgroundColor: colors.surface }]}
            onPress={takePhoto}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
          >
            <CameraIcon size={19} color={colors.textPrimary} weight="fill" />
            <Text style={[styles.attachOptionLabel, { color: colors.textPrimary }]}>Camera</Text>
          </Pressable>
          <View style={[styles.attachDivider, { backgroundColor: colors.border }]} />
          <Pressable
            style={({ pressed }) => [styles.attachOption, pressed && { backgroundColor: colors.surface }]}
            onPress={pickFromLibrary}
            accessibilityRole="button"
            accessibilityLabel="Choose from gallery"
          >
            <ImagesIcon size={19} color={colors.textPrimary} weight="fill" />
            <Text style={[styles.attachOptionLabel, { color: colors.textPrimary }]}>Gallery</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Input row */}
      <View style={styles.row}>
        <Pressable
          onPress={handleClipPress}
          onPressIn={() => { clipScale.value = withTiming(0.82, { duration: ANIMATION_DURATIONS.pressIn, easing: EASING.outCubic }); }}
          onPressOut={() => { clipScale.value = withTiming(1, { duration: ANIMATION_DURATIONS.pressOut, easing: EASING.outCubic }); }}
          disabled={disabled}
          hitSlop={HIT_SLOP.md}
          accessibilityRole="button"
          accessibilityLabel="Attach image"
        >
          <Animated.View style={[styles.clipButton, clipAnimStyle]}>
            <PaperclipIcon
              size={22}
              color={attachMenuOpen ? colors.textPrimary : disabled ? colors.gray400 : colors.textSecondary}
              weight={attachMenuOpen ? 'fill' : 'regular'}
            />
          </Animated.View>
        </Pressable>

        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={pendingImage ? 'Add a caption…' : 'Chat with ARMINI…'}
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={2000}
          style={[styles.input, { color: colors.textPrimary }]}
          onSubmitEditing={() => { void handleSend(); }}
          blurOnSubmit={false}
          editable={!disabled}
          accessibilityLabel="Message input"
        />

        <Pressable
          onPress={() => { void handleSend(); }}
          disabled={!canSend}
          style={styles.sendButton}
          hitSlop={HIT_SLOP.md}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <ArrowUpIcon size={20} color={canSend ? colors.textPrimary : colors.gray400} weight="bold" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing[3],
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.md,
  },

  // Image preview
  previewRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[3],
    paddingTop: Spacing[2],
  },
  previewWrapper: {
    position: 'relative',
  },
  previewImage: {
    width: 68,
    height: 68,
    borderRadius: 12,
  },
  previewRemove: {
    position: 'absolute',
    top: -7,
    right: -7,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },

  // Attach menu
  attachMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  attachOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: 11,
  },
  attachOptionLabel: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  attachDivider: {
    width: StyleSheet.hairlineWidth,
    height: 22,
  },

  // Input row
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[2],
  },
  clipButton: {
    width: 36,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    fontSize: Typography.size.base,
    backgroundColor: 'transparent',
    lineHeight: Typography.size.base * 1.4,
  },
  sendButton: {
    width: 36,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
