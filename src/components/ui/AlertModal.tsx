import { ANIMATION_DURATIONS, SPRING_CONFIGS } from '@/src/constants/animation.constants';
import { Spacing, Typography, useTheme } from '@/src/theme';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface AlertButton {
  text: string;
  style?: 'default' | 'destructive' | 'cancel';
  onPress?: () => void;
}

export interface AlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface AlertModalProps {
  visible: boolean;
  config: AlertConfig | null;
  onDismiss: () => void;
}

export function AlertModal({ visible, config, onDismiss }: AlertModalProps) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      slideY.setValue(SCREEN_HEIGHT);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIMATION_DURATIONS.modalEnter,
          useNativeDriver: true,
        }),
        Animated.spring(slideY, {
          toValue: 0,
          ...SPRING_CONFIGS.expand,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropOpacity, slideY]);

  const animateOut = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: ANIMATION_DURATIONS.modalBackdropExit,
        useNativeDriver: true,
      }),
      Animated.timing(slideY, {
        toValue: SCREEN_HEIGHT,
        duration: ANIMATION_DURATIONS.modalSlideExit,
        useNativeDriver: true,
      }),
    ]).start(() => callback?.());
  };

  const handleButtonPress = (button: AlertButton) => {
    animateOut(() => {
      // Dismiss primeiro para limpar o estado antes de onPress potencialmente abrir outro alert
      onDismiss();
      button.onPress?.();
    });
  };

  const handleBackdropPress = () => {
    const cancelBtn = config?.buttons?.find((b) => b.style === 'cancel');
    animateOut(() => {
      onDismiss();
      cancelBtn?.onPress?.();
    });
  };

  if (!visible || !config) return null;

  const allButtons = config.buttons?.length ? config.buttons : [{ text: 'OK' }];
  const cancelButton = allButtons.find((b) => b.style === 'cancel');
  const actionButtons = allButtons.filter((b) => b.style !== 'cancel');

  return (
    <Modal transparent visible statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              paddingBottom: insets.bottom + Spacing[2],
              transform: [{ translateY: slideY }],
            },
          ]}
        >
          {/* Bloco principal */}
          <View style={[styles.mainCard, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{config.title}</Text>
              {config.message ? (
                <Text style={[styles.message, { color: colors.textSecondary }]}>{config.message}</Text>
              ) : null}
            </View>

            {actionButtons.map((button, index) => {
              const isDestructive = button.style === 'destructive';

              return (
                <Pressable
                  key={`${button.text}-${index}`}
                  style={({ pressed }) => [
                    styles.actionButton,
                    index < actionButtons.length - 1 && [styles.actionButtonBorder, { borderBottomColor: colors.border }],
                    pressed && { backgroundColor: colors.surface },
                  ]}
                  onPress={() => handleButtonPress(button)}
                  accessibilityRole="button"
                  accessibilityLabel={button.text}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      { color: colors.textPrimary },
                      isDestructive && { color: colors.error },
                    ]}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Botão Cancel separado */}
          {cancelButton ? (
            <Pressable
              style={({ pressed }) => [
                styles.cancelCard,
                { backgroundColor: colors.background },
                pressed && { backgroundColor: colors.surface },
              ]}
              onPress={() => handleButtonPress(cancelButton)}
              accessibilityRole="button"
              accessibilityLabel={cancelButton.text}
            >
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>
                {cancelButton.text}
              </Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetContainer: {
    paddingHorizontal: Spacing[3],
    gap: Spacing[2],
  },
  mainCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing[1],
  },
  title: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.bold,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    lineHeight: 19,
  },
  actionButton: {
    paddingVertical: Spacing[4],
    alignItems: 'center',
  },
  actionButtonBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionButtonText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.medium,
  },
  cancelCard: {
    borderRadius: 16,
    paddingVertical: Spacing[4],
    alignItems: 'center',
  },
  cancelText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.regular,
  },
});
