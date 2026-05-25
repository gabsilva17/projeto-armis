import vacationSeed from './fixtures/vacation.json' with { type: 'json' };
import type { VacationInfoDto } from '../types/api.js';

const vacation: VacationInfoDto = vacationSeed as VacationInfoDto;

export function getMyVacation(): VacationInfoDto[] {
  // O contrato real devolve um array (VacationInfoDto[]). Tipicamente com uma
  // entrada — mantemos a forma fiel.
  return [vacation];
}
