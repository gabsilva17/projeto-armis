import { useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';

export function useKeyboard() {
  const keyboardHeight = useSharedValue(0);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // iOS dispara "Will" com duração exata da animação do teclado;
    // Android apenas dispara "Did" (sem duração fiável — usamos 250ms fixo).
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      keyboardHeight.value = withTiming(e.endCoordinates.height, { duration: e.duration ?? 250 });
    });
    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      keyboardHeight.value = withTiming(0, { duration: e.duration ?? 250 });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return { keyboardHeight };
}
