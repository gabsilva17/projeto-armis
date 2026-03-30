import { AlertModal, type AlertButton, type AlertConfig } from '@/src/components/ui/AlertModal';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ShowAlertFn = (title: string, message?: string, buttons?: AlertButton[]) => void;

const AlertContext = createContext<ShowAlertFn>(() => {});

export function useAlert(): ShowAlertFn {
  return useContext(AlertContext);
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [visible, setVisible] = useState(false);
  // Chave incremental: força remount do AlertModal quando um alerta encadeia outro
  // (onDismiss + show no mesmo batch faz visible nunca mudar → useEffect não re-dispara)
  const [alertId, setAlertId] = useState(0);

  const show: ShowAlertFn = useCallback((title, message, buttons) => {
    setConfig({ title, message, buttons });
    setVisible(true);
    setAlertId((id) => id + 1);
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setConfig(null);
  }, []);

  return (
    <AlertContext.Provider value={show}>
      {children}
      <AlertModal key={alertId} visible={visible} config={config} onDismiss={handleDismiss} />
    </AlertContext.Provider>
  );
}
