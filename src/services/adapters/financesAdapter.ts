import type { InvoiceData } from '../../types/finances.types';
import type { ContentBlock } from '../api/anthropic';

export interface InvoiceLineItemApi {
  description?: string;
  amount?: string;
}

export interface InvoiceExtractionApiResponse {
  vendor?: string | null;
  invoiceNumber?: string | null;
  date?: string | null;
  totalAmount?: string | null;
  currency?: string | null;
  taxAmount?: string | null;
  lineItems?: InvoiceLineItemApi[];
  summary?: string | null;
}

export function createInvoicePromptContent(photoBase64: string, prompt: string): ContentBlock[] {
  return [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: photoBase64,
      },
    },
    {
      type: 'text',
      text: prompt,
    },
  ];
}

export function adaptInvoiceExtractionResponse(rawText: string): InvoiceData {
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const parsed = JSON.parse(jsonMatch[0]) as InvoiceExtractionApiResponse;

    return {
      vendor: parsed.vendor ?? null,
      invoiceNumber: parsed.invoiceNumber ?? null,
      date: parsed.date ?? null,
      totalAmount: parsed.totalAmount ?? null,
      currency: parsed.currency ?? null,
      taxAmount: parsed.taxAmount ?? null,
      lineItems: Array.isArray(parsed.lineItems)
        ? parsed.lineItems.map((item) => ({
            description: item.description ?? '',
            amount: item.amount ?? '',
          }))
        : [],
      summary: parsed.summary ?? null,
      rawText,
    };
  } catch {
    return {
      vendor: null,
      invoiceNumber: null,
      date: null,
      totalAmount: null,
      currency: null,
      taxAmount: null,
      lineItems: [],
      summary: null,
      rawText,
    };
  }
}
