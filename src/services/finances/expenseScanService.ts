import {
  CURRENCY_OPTIONS,
  EXPENSE_TYPE_OPTIONS,
} from '@/src/constants/formOptions.constants';
import { callClaude, type AnthropicMessage } from '../api/anthropic';
import { createImagePromptContent, createDocumentPromptContent } from '../adapters/chatAdapter';
import type { ManualExpenseForm } from '@/src/types/finances.types';

interface ExtractedExpenseData {
  date?: string;
  expenseType?: string;
  quantity?: string;
  unitValue?: string;
  currency?: string;
  observations?: string;
}

const EXPENSE_SCAN_PROMPT = `Extract expense data from this receipt/invoice (image or PDF document).
The document is most likely in Portuguese (Portugal). Expect labels such as "Total", "IVA", "Data", "NIF", "Fatura", "Recibo", "Contribuinte", etc.

Allowed expenseType values: ${EXPENSE_TYPE_OPTIONS.join(', ')}
Allowed currency values: ${CURRENCY_OPTIONS.join(', ')}

Return ONLY a JSON object (no markdown, no explanation, no suggestions):

{
  "date": "mm/dd/yyyy",
  "expenseType": "exactly one of the allowed values above",
  "quantity": "number (default 1)",
  "unitValue": "total amount, number with up to 2 decimal places",
  "currency": "exactly one of the allowed values above",
  "observations": "brief description in Portuguese"
}

Rules:
- date: Portuguese dates use dd/mm/yyyy or dd-mm-yyyy — swap day and month to produce mm/dd/yyyy. Look for "Data", "Data/Hora", "Emissão". Omit if not found.
- expenseType: choose the best match from the allowed values based on the vendor type, items purchased, or context of the receipt. If nothing fits, use "Others".
- quantity: use "1" unless the receipt clearly shows a different item count.
- unitValue: use the final total ("Total", "Total a Pagar"), not subtotals or IVA lines. Use dot as decimal separator (convert comma to dot). Strip currency symbols.
- currency: detect from symbols or text. Default to "EUR".
- observations: vendor/store name, NIF if visible, and brief summary of items. Write in Portuguese.
- Omit any field that cannot be determined.
- Return ONLY the raw JSON. No extra text.`;

function extractJsonObject(text: string): string {
  const codeFenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = codeFenceMatch ? codeFenceMatch[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('No JSON object found in scan response.');
  }
  return candidate.slice(start, end + 1);
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

const SCAN_SYSTEM_CONTEXT = 'This is an automated expense scan request. Return ONLY the JSON object with extracted fields. Do not add suggestions, next steps, greetings, or any text outside the JSON.';

export async function scanReceiptImage(base64: string): Promise<Partial<ManualExpenseForm>> {
  const imageContent = createImagePromptContent(base64, EXPENSE_SCAN_PROMPT, EXPENSE_SCAN_PROMPT);

  const messages: AnthropicMessage[] = [
    { role: 'user', content: imageContent },
  ];

  const responseText = await callClaude(messages, SCAN_SYSTEM_CONTEXT);
  const jsonStr = extractJsonObject(responseText);
  const parsed = JSON.parse(jsonStr) as ExtractedExpenseData;

  return sanitizeExtractedData(parsed);
}

export async function scanReceiptDocument(base64: string): Promise<Partial<ManualExpenseForm>> {
  const documentContent = createDocumentPromptContent(base64, EXPENSE_SCAN_PROMPT, EXPENSE_SCAN_PROMPT);

  const messages: AnthropicMessage[] = [
    { role: 'user', content: documentContent },
  ];

  const responseText = await callClaude(messages, SCAN_SYSTEM_CONTEXT);
  const jsonStr = extractJsonObject(responseText);
  const parsed = JSON.parse(jsonStr) as ExtractedExpenseData;

  return sanitizeExtractedData(parsed);
}
