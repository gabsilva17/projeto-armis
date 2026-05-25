// TODO(expenses-contract): real API contract not yet defined in swagger.json.
// Paths e shapes aqui são especulativos — espelham os endpoints expostos por
// mock-backend/src/routes/expenses.ts. Quando o contrato real chegar,
// atualizar paths + shapes (em types.ts) e remover este TODO.

import type { BooleanFriendlyResponseT, ExpenseDto } from './types.js';
import { backendRequest } from './httpClient.js';

// O POST do mock devolve `BooleanFriendlyResponseT & { id }`. Modelamos
// como envelope com `id` opcional — o backend real provavelmente fará
// algo equivalente (DTO no body ou id no Location).
export interface ExpenseCreatedResponse extends BooleanFriendlyResponseT {
  id?: string;
}

export const expensesClient = {
  listMine(): Promise<ExpenseDto[]> {
    return backendRequest<ExpenseDto[]>('/expense/my');
  },

  getById(id: string): Promise<ExpenseDto> {
    return backendRequest<ExpenseDto>(`/expense/my/${encodeURIComponent(id)}`);
  },

  create(dto: ExpenseDto): Promise<ExpenseCreatedResponse> {
    return backendRequest<ExpenseCreatedResponse>('/expense/my', {
      method: 'POST',
      body: dto,
    });
  },

  update(id: string, dto: ExpenseDto): Promise<BooleanFriendlyResponseT> {
    return backendRequest<BooleanFriendlyResponseT>(`/expense/my/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: dto,
    });
  },

  remove(id: string): Promise<BooleanFriendlyResponseT> {
    return backendRequest<BooleanFriendlyResponseT>(`/expense/my/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
