import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface ExpenseEntry {
  id: string;
  date: string;
  productiveProject: string;
  partnerProject: string;
  expenseType: string;
  quantity: number;
  unitValue: number;
  currency: string;
  observations: string;
  expenseRepresentation: boolean;
  status: string;
}

let entries: ExpenseEntry[] | null = null;
let nextId = 200;

function ensureLoaded(): ExpenseEntry[] {
  if (!entries) {
    const raw = readFileSync(join(__dirname, 'fixtures', 'expenses.json'), 'utf-8');
    entries = JSON.parse(raw) as ExpenseEntry[];
  }
  return entries;
}

export function getAll(): ExpenseEntry[] {
  return ensureLoaded();
}

export function findById(id: string): ExpenseEntry | undefined {
  return ensureLoaded().find((e) => e.id === id);
}

export function add(entry: Omit<ExpenseEntry, 'id'> & { id?: string }): ExpenseEntry {
  const all = ensureLoaded();
  const id = entry.id ?? `exp${++nextId}`;
  const { id: _discard, ...rest } = entry as ExpenseEntry;
  const newEntry: ExpenseEntry = { id, ...rest };
  all.push(newEntry);
  return newEntry;
}

export function update(id: string, fields: Partial<Omit<ExpenseEntry, 'id'>>): ExpenseEntry | null {
  const entry = findById(id);
  if (!entry) return null;
  Object.assign(entry, fields);
  return entry;
}

export function remove(id: string): boolean {
  const all = ensureLoaded();
  const idx = all.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  all.splice(idx, 1);
  return true;
}
