import type { InvoiceData, InvoiceSubmission, SubmissionResult } from '../../types/finances.types';
import { callClaude } from '../api/anthropic';
import {
  adaptInvoiceExtractionResponse,
  createInvoicePromptContent,
} from '../adapters/financesAdapter';

const INVOICE_PROMPT = `Analyze this image thoroughly. It could be an invoice, receipt, ticket, document, menu, label, screenshot, or any other type of photo.

Extract ALL relevant information you can see and return ONLY a valid JSON object with these fields:

{
  "vendor": "company, brand, store, or source name visible — or null",
  "invoiceNumber": "any reference, order, or document number — or null",
  "date": "any date visible — or null",
  "totalAmount": "total, price, or main monetary value — or null",
  "currency": "currency code (EUR, USD, etc.) — or null",
  "taxAmount": "tax/VAT amount if visible — or null",
  "lineItems": [{"description": "item or detail description", "amount": "associated value or amount"}],
  "summary": "A brief 1-2 sentence description of what the image shows and any important context not captured in the fields above"
}

Rules:
- Adapt to whatever the image contains — don't assume it's an invoice.
- For lineItems, extract any list of items, entries, or details visible. Empty array if none.
- If a field doesn't apply or isn't visible, use null.
- The "summary" field should always be filled — describe what you see.
- Return ONLY the JSON, no other text.`;

export async function submitInvoice(
  submission: InvoiceSubmission,
): Promise<SubmissionResult> {
  const content = createInvoicePromptContent(submission.photoBase64, INVOICE_PROMPT);

  const responseText = await callClaude([{ role: 'user', content }]);
  const invoiceData: InvoiceData = adaptInvoiceExtractionResponse(responseText);

  return {
    success: true,
    referenceId: `INV-${submission.submittedAt.getTime()}`,
    invoiceData,
  };
}
