import holidaysSeed from './fixtures/holidays.json' with { type: 'json' };
import type { HolidayDto } from '../types/api.js';

const holidays: HolidayDto[] = holidaysSeed as HolidayDto[];

export function getHolidaysByYear(year: number): HolidayDto[] {
  return holidays.filter((h) => new Date(h.date).getUTCFullYear() === year);
}
