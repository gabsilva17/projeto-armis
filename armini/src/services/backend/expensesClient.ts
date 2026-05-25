// TODO(expenses-contract): real API contract not yet defined in swagger.json.
// Paths e shapes aqui são especulativos — espelham os endpoints especulativos
// expostos por mock-backend/src/routes/expenses.ts. Quando o contrato real
// chegar, atualizar paths + shapes (em backend.types.ts) e remover este TODO.

import type { BooleanFriendlyResponseT, ExpenseDto } from '../../types/backend.types';
import { backendRequest } from './httpClient';

// O POST do mock devolve `BooleanFriendlyResponseT & { id }`. Modelamos como
// envelope com `id` opcional — o backend real provavelmente devolverá o DTO
// completo no Location header ou no corpo.
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
