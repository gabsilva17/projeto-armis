const timestamp = () => new Date().toISOString();

export const logger = {
  info: (msg: string) => console.log(`[${timestamp()}] INFO  ${msg}`),
  warn: (msg: string) => console.warn(`[${timestamp()}] WARN  ${msg}`),
  error: (msg: string, err?: unknown) => {
    console.error(`[${timestamp()}] ERROR ${msg}`);
    if (err instanceof Error) console.error(err.stack);
  },
};
