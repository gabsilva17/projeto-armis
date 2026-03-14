export interface InvoiceSubmission {
  photoBase64: string;
  submittedAt: Date;
}

export interface InvoiceData {
  vendor: string | null;
  invoiceNumber: string | null;
  date: string | null;
  totalAmount: string | null;
  currency: string | null;
  taxAmount: string | null;
  lineItems: { description: string; amount: string }[];
  summary: string | null;
  rawText: string;
}

export interface SubmissionResult {
  success: boolean;
  referenceId?: string;
  invoiceData?: InvoiceData;
  error?: string;
}

export type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface FinancesState {
  photoUri: string | null;
  photoBase64: string | null;
  status: SubmissionStatus;
  referenceId: string | null;
  invoiceData: InvoiceData | null;
  error: string | null;
}
