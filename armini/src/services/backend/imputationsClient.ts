import type { BooleanFriendlyResponseT, ImputationDto } from '../../types/backend.types';
import { backendRequest } from './httpClient';

// Wire calls a /api/v1/imputation/my — ver swagger.json. O domínio interno chama
// estas entidades "timesheet entries"; a tradução vive em adapters/imputationsAdapter.

export const imputationsClient = {
  getMonth(year: number, month: number): Promise<ImputationDto[]> {
    return backendRequest<ImputationDto[]>(`/imputation/my/${year}/${month}`);
  },

  getById(id: number): Promise<ImputationDto> {
    return backendRequest<ImputationDto>(`/imputation/my/${id}`);
  },

  create(dto: ImputationDto): Promise<BooleanFriendlyResponseT> {
    return backendRequest<BooleanFriendlyResponseT>('/imputation/my', {
      method: 'POST',
      body: dto,
    });
  },

  update(id: number, dto: ImputationDto): Promise<BooleanFriendlyResponseT> {
    return backendRequest<BooleanFriendlyResponseT>(`/imputation/my/${id}`, {
      method: 'PUT',
      body: dto,
    });
  },

  remove(id: number): Promise<BooleanFriendlyResponseT> {
    return backendRequest<BooleanFriendlyResponseT>(`/imputation/my/${id}`, {
      method: 'DELETE',
    });
  },
};
