import { useTheme } from '@/src/theme';
import { Spacing, Typography } from '@/src/theme';
import { TrashIcon } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ChatMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onClearMessages: () => void;
}

export function ChatDropdownMenu({ isOpen, onClose, onClearMessages }: ChatMenuProps) {
  const colors = useTheme();
  const [mounted, setMounted] = useState(false);
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const close = () => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start(() => {
      setMounted(false);
      onClose();
    });
  };

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      scale.setValue(0.85);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      <Pressable
        style={[StyleSheet.absoluteFillObject, { zIndex: 50 }]}
        onPress={close}
      />
      <Animated.View
        style={[
          styles.dropdown,
          {
            opacity,
            transform: [{ scale }],
            zIndex: 100,
            backgroundColor: colors.white,
            borderColor: colors.border,
            shadowColor: colors.black,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.dropdownItem}
          onPress={() => {
            close();
            onClearMessages();
          }}
        >
          <TrashIcon size={16} color={colors.error} />
          <Text style={[styles.dropdownItemText, { color: colors.error }]}>Delete chat</Text>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    position: 'absolute',
    top: 80,
    left: Spacing[4],
    borderRadius: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    minWidth: 160,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3] + 2,
  },
  dropdownItemText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.medium,
  },
});
