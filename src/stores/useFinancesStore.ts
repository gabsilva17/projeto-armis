import { create } from 'zustand';
import { submitInvoice as submitInvoiceService } from '../services/finances/financesService';
import type { FinancesState, InvoiceData } from '../types/finances.types';

interface FinancesStore {
  photoUri: string | null;
  photoBase64: string | null;
  status: FinancesState['status'];
  referenceId: string | null;
  invoiceData: InvoiceData | null;
  error: string | null;
  setPhoto: (uri: string, base64: string | null) => void;
  clearPhoto: () => void;
  submitInvoice: () => Promise<void>;
  reset: () => void;
}

export const useFinancesStore = create<FinancesStore>((set, get) => ({
  photoUri: null,
  photoBase64: null,
  status: 'idle',
  referenceId: null,
  invoiceData: null,
  error: null,

  setPhoto: (uri, base64) =>
    set({ photoUri: uri, photoBase64: base64, status: 'idle', referenceId: null, invoiceData: null, error: null }),
  clearPhoto: () => set({ photoUri: null, photoBase64: null }),
  reset: () =>
    set({ photoUri: null, photoBase64: null, status: 'idle', referenceId: null, invoiceData: null, error: null }),

  submitInvoice: async () => {
    const { photoBase64 } = get();
    if (!photoBase64) {
      set({ status: 'error', error: 'No image data available. Please retake the photo.' });
      return;
    }

    set({ status: 'submitting', error: null });

    try {
      const result = await submitInvoiceService({
        photoBase64,
        submittedAt: new Date(),
      });

      if (result.success && result.invoiceData) {
        set({
          status: 'success',
          referenceId: result.referenceId ?? null,
          invoiceData: result.invoiceData,
          photoUri: null,
          photoBase64: null,
        });
      } else {
        set({ status: 'error', error: result.error ?? 'Failed to process invoice.' });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      set({ status: 'error', error: message });
    }
  },
}));
