import { useWindowDimensions } from 'react-native';
import { SIDEBAR_BREAKPOINT } from '../constants/app.constants';

export function useResponsive() {
  const { width } = useWindowDimensions();
  return { isWide: width >= SIDEBAR_BREAKPOINT };
}
