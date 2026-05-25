type Level = 'info' | 'warn' | 'error';

function emit(level: Level, msg: string, meta?: unknown): void {
  const ts = new Date().toISOString();
  const line = `[${ts}] [mock-backend] [${level}] ${msg}`;
  if (meta !== undefined) {
    console[level === 'info' ? 'log' : level](line, meta);
  } else {
    console[level === 'info' ? 'log' : level](line);
  }
}

export const logger = {
  info: (msg: string, meta?: unknown) => emit('info', msg, meta),
  warn: (msg: string, meta?: unknown) => emit('warn', msg, meta),
  error: (msg: string, meta?: unknown) => emit('error', msg, meta),
};
