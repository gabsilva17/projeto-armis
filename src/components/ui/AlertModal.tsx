import { ANIMATION_DURATIONS } from '@/src/constants/animation.constants';
import { HIT_SLOP } from '@/src/constants/ui.constants';
import { Spacing, Typography, useTheme } from '@/src/theme';
import { X } from 'phosphor-react-native';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      cardScale.setValue(0.9);
      cardOpacity.setValue(0);
      backdropOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIMATION_DURATIONS.modalEnter,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 1,
          duration: ANIMATION_DURATIONS.modalEnter,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: ANIMATION_DURATIONS.modalEnter,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropOpacity, cardScale, cardOpacity]);

  const animateOut = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: ANIMATION_DURATIONS.modalBackdropExit,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.9,
        duration: ANIMATION_DURATIONS.modalBackdropExit,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: ANIMATION_DURATIONS.modalBackdropExit,
        useNativeDriver: true,
      }),
    ]).start(() => callback?.());
  };

  const handleButtonPress = (button: AlertButton) => {
    animateOut(() => {
      onDismiss();
      button.onPress?.();
    });
  };

  const handleClose = () => {
    const cancelBtn = config?.buttons?.find((b) => b.style === 'cancel');
    animateOut(() => {
      onDismiss();
      cancelBtn?.onPress?.();
    });
  };

  if (!visible || !config) return null;

  const allButtons = config.buttons?.length ? config.buttons : [{ text: 'OK' }];
  const actionButtons = allButtons.filter((b) => b.style !== 'cancel');

  // Primeiro botão de ação fica filled (preto), os restantes ficam outline
  const primaryButton = actionButtons[0];
  const secondaryButtons = actionButtons.slice(1);

  return (
    <Modal transparent visible statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          {/* X no canto superior direito */}
          <Pressable
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={HIT_SLOP.md}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={18} color={colors.textMuted} weight="bold" />
          </Pressable>

          {/* Conteúdo */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{config.title}</Text>
            {config.message ? (
              <Text style={[styles.message, { color: colors.textSecondary }]}>{config.message}</Text>
            ) : null}
          </View>

          {/* Botões */}
          <View style={styles.buttonRow}>
            {secondaryButtons.map((button, index) => (
              <Pressable
                key={`${button.text}-${index}`}
                style={({ pressed }) => [
                  styles.button,
                  styles.outlineButton,
                  { borderColor: colors.textPrimary },
                  pressed && { opacity: 0.6 },
                ]}
                onPress={() => handleButtonPress(button)}
                accessibilityRole="button"
                accessibilityLabel={button.text}
              >
                <Text style={[styles.outlineText, { color: colors.textPrimary }]}>
                  {button.text}
                </Text>
              </Pressable>
            ))}

            {primaryButton ? (
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.filledButton,
                  { backgroundColor: colors.textPrimary },
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => handleButtonPress(primaryButton)}
                accessibilityRole="button"
                accessibilityLabel={primaryButton.text}
              >
                <Text style={[styles.filledText, { color: colors.textInverse }]}>
                  {primaryButton.text}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[8],
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing[4],
    right: Spacing[4],
    zIndex: 1,
  },
  content: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[5],
    paddingRight: Spacing[10],
    paddingBottom: Spacing[4],
    gap: Spacing[2],
  },
  title: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.semibold,
  },
  message: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 19,
  },
  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[5],
    gap: Spacing[2],
  },
  button: {
    flex: 1,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filledButton: {},
  filledText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
  },
  outlineButton: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  outlineText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
  },
});
