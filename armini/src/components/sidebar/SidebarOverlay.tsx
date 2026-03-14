import Animated, {
  useAnimatedStyle,
  type DerivedValue,
} from 'react-native-reanimated';
import { TouchableWithoutFeedback } from 'react-native';

interface SidebarOverlayProps {
  opacity: DerivedValue<number>;
  onPress: () => void;
  pointerEvents: 'none' | 'auto';
}

export function SidebarOverlay({ opacity, onPress, pointerEvents }: SidebarOverlayProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <Animated.View
        pointerEvents={pointerEvents}
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#000',
            zIndex: 90,
          },
          animatedStyle,
        ]}
      />
    </TouchableWithoutFeedback>
  );
}
