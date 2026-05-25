// TODO(expenses-contract): real API contract not yet defined in swagger.json.
// Esta shape espelha o ManualExpenseEntry atual do mobile e existe apenas para
// destravar o desenvolvimento até que o backend exponha endpoints reais de despesas.
// Quando o contrato chegar, substituir este ficheiro inteiro pelos DTOs corretos.

export type ExpenseStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface ExpenseDto {
  id: string;
  date: string; // ISO date-time (alinhar com o resto da API quando o contrato real existir)
  productiveProject: string;
  partnerProject: string;
  expenseType: string;
  quantity: number;
  unitValue: number;
  currency: string;
  observations: string;
  expenseRepresentation: boolean;
  status: ExpenseStatus;
}
