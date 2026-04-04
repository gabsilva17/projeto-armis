import {
  CURRENCY_OPTIONS,
  EXPENSE_TYPE_OPTIONS,
} from '@/src/constants/formOptions.constants';
import { mcpScan } from '../api/mcp';
import type { ManualExpenseForm } from '@/src/types/finances.types';

interface ExtractedExpenseData {
  date?: string;
  expenseType?: string;
  quantity?: string;
  unitValue?: string;
  currency?: string;
  observations?: string;
}

function sanitizeExtractedData(raw: ExtractedExpenseData): Partial<ManualExpenseForm> {
  const result: Partial<ManualExpenseForm> = {};

  if (raw.date && /^\d{2}\/\d{2}\/\d{4}$/.test(raw.date)) {
    result.date = raw.date;
  }

  if (raw.expenseType) {
    const match = (EXPENSE_TYPE_OPTIONS as readonly string[]).find(
      (opt) => opt.toLowerCase() === raw.expenseType!.toLowerCase(),
    );
    result.expenseType = match ?? 'Others';
  }

  if (raw.quantity != null) {
    const qty = parseInt(String(raw.quantity), 10);
    if (Number.isFinite(qty) && qty >= 1 && qty <= 1000) {
      result.quantity = String(qty);
    }
  }

  if (raw.unitValue != null) {
    const normalized = String(raw.unitValue).replace(',', '.').replace(/[^0-9.]/g, '');
    const value = parseFloat(normalized);
    if (Number.isFinite(value) && value > 0 && value <= 100000) {
      result.unitValue = value.toFixed(2);
    }
  }

  if (raw.currency && (CURRENCY_OPTIONS as readonly string[]).includes(raw.currency)) {
    result.currency = raw.currency;
  }

  if (raw.observations && typeof raw.observations === 'string') {
    result.observations = raw.observations.slice(0, 300);
  }

  return result;
}

async function scanReceipt(base64: string, mediaType: string): Promise<Partial<ManualExpenseForm>> {
  const result = await mcpScan({ base64, mediaType });
  return sanitizeExtractedData(result.expenseData as ExtractedExpenseData);
}

export const scanReceiptImage = (base64: string) => scanReceipt(base64, 'image/jpeg');
export const scanReceiptDocument = (base64: string) => scanReceipt(base64, 'application/pdf');
