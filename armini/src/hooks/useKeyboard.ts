import { useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';

export function useKeyboard() {
  const keyboardHeight = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const showSub = Keyboard.addListener('keyboardWillShow', (e) => {
      keyboardHeight.value = withTiming(e.endCoordinates.height, { duration: e.duration });
    });
    const hideSub = Keyboard.addListener('keyboardWillHide', (e) => {
      keyboardHeight.value = withTiming(0, { duration: e.duration });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return { keyboardHeight };
}
