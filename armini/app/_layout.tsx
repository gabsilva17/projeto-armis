import '@/src/i18n';
import i18n from '@/src/i18n';
import { AlertProvider } from '@/src/contexts/AlertContext';
import { Toast } from '@/src/components/ui/Toast';
import { useSidebarStore } from '@/src/stores/useSidebarStore';
import { useTimesheetsStore } from '@/src/stores/useTimesheetsStore';
import { useFinancesStore } from '@/src/stores/useFinancesStore';
import { useToastStore } from '@/src/stores/useToastStore';
import { useAiAvailabilityStore } from '@/src/stores/useAiAvailabilityStore';
import { Spacing, Typography } from '@/src/theme';
import { themes } from '@/src/theme/colors';
import { useThemeStore } from '@/src/stores/useThemeStore';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });

SplashScreen.preventAutoHideAsync();

const AI_RECHECK_INTERVAL_MS = 15_000;

type DegradedKind = 'aiGatewayOffline' | 'mcpOffline';

function showDegradedToast(kind: DegradedKind) {
  useToastStore.getState().show({
    title: i18n.t(`common:toast.${kind}.title`),
    message: i18n.t(`common:toast.${kind}.body`),
    variant: 'warning',
  });
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      const currentTheme = themes[useThemeStore.getState().themeId];
      return (
        <View style={[errorStyles.container, { backgroundColor: currentTheme.background }]}> 
          <Text style={[errorStyles.title, { color: currentTheme.textPrimary }]}>{i18n.t('error.somethingWentWrong')}</Text>
          <Text style={[errorStyles.message, { color: currentTheme.textSecondary }]}>
            {this.state.error?.message ?? i18n.t('error.generic')}
          </Text>
          <Text style={[errorStyles.retry, { color: currentTheme.textPrimary }]} onPress={this.reset}>
            {i18n.t('error.tapToRetry')}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[6],
  },
  title: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing[3],
  },
  message: {
    fontSize: Typography.size.base,
    textAlign: 'center',
    marginBottom: Spacing[5],
  },
  retry: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.semibold,
  },
});

function AppStatusBar() {
  const isOpen = useSidebarStore((s) => s.isOpen);
  return <StatusBar style={isOpen ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setButtonStyleAsync('light');
      NavigationBar.setButtonStyleAsync('dark');
    }
  }, []);

  useEffect(() => {
    if (!fontsLoaded) return;
    SplashScreen.hideAsync();
    // Hidratar stores de domínio com dados do backend
    void useTimesheetsStore.getState().load();
    void useFinancesStore.getState().load();

    // Boot ping ao AI Gateway. Sondamos periodicamente para apanhar quedas
    // em runtime sem reabrir a app. Mostramos um toast por transição para
    // cada estado degradado (Phase 8): AI Gateway offline e MCP offline são
    // notificações distintas, mas cada uma só dispara quando *entramos* nesse
    // estado — senão o utilizador ficava soterrado em toasts em cada poll.
    const initial = useAiAvailabilityStore.getState();
    let prevAiGateway = initial.aiGateway;
    let prevMcp = initial.mcp;
    const unsubAi = useAiAvailabilityStore.subscribe((state) => {
      if (state.aiGateway === 'offline' && prevAiGateway !== 'offline') {
        showDegradedToast('aiGatewayOffline');
      } else if (
        state.aiGateway === 'online' &&
        state.mcp === 'offline' &&
        !(prevAiGateway === 'online' && prevMcp === 'offline')
      ) {
        showDegradedToast('mcpOffline');
      }
      prevAiGateway = state.aiGateway;
      prevMcp = state.mcp;
    });
    void useAiAvailabilityStore.getState().check();
    const intervalId = setInterval(() => {
      void useAiAvailabilityStore.getState().check();
    }, AI_RECHECK_INTERVAL_MS);
    return () => {
      unsubAi();
      clearInterval(intervalId);
    };
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <AlertProvider>
            <AppStatusBar />
            <Stack screenOptions={{ headerShown: false }} />
            <Toast />
          </AlertProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
