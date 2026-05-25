import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface TimesheetEntry {
  id: string;
  date: string;
  project: string;
  task: string;
  hours: number;
  status: string;
}

let entries: TimesheetEntry[] | null = null;
let nextId = 100;

function ensureLoaded(): TimesheetEntry[] {
  if (!entries) {
    const raw = readFileSync(join(__dirname, 'fixtures', 'timesheets.json'), 'utf-8');
    entries = JSON.parse(raw) as TimesheetEntry[];
  }
  return entries;
}

export function getAll(): TimesheetEntry[] {
  return ensureLoaded();
}

export function findById(id: string): TimesheetEntry | undefined {
  return ensureLoaded().find((e) => e.id === id);
}

export function add(entry: Omit<TimesheetEntry, 'id'> & { id?: string }): TimesheetEntry {
  const all = ensureLoaded();
  const id = entry.id ?? `e${++nextId}`;
  const { id: _discard, ...rest } = entry as TimesheetEntry;
  const newEntry: TimesheetEntry = { id, ...rest };
  all.push(newEntry);
  return newEntry;
}

export function update(id: string, fields: Partial<Omit<TimesheetEntry, 'id'>>): TimesheetEntry | null {
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
