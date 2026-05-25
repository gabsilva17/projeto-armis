import { create } from 'zustand';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: number;
  title?: string;
  message: string;
  variant: ToastVariant;
}

interface ShowToastParams {
  title?: string;
  message: string;
  variant?: ToastVariant;
}

interface ToastStore {
  queue: ToastItem[];
  show: (params: ShowToastParams) => number;
  dismiss: (id: number) => void;
}

let _nextId = 0;

export const useToastStore = create<ToastStore>((set) => ({
  queue: [],
  show: ({ title, message, variant = 'info' }) => {
    const id = ++_nextId;
    set((s) => ({ queue: [...s.queue, { id, title, message, variant }] }));
    return id;
  },
  dismiss: (id) =>
    set((s) => ({ queue: s.queue.filter((t) => t.id !== id) })),
}));
