import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  MCP_PORT: z.coerce.number().default(3003),
  // Backend client targets the mock-backend by default. Swap to the real .NET
  // Digital Hub by setting BACKEND_URL — no code change.
  BACKEND_URL: z.string().url().default('http://localhost:3002'),
  BACKEND_API_KEY: z.string().default('dev-mock-key'),
  BACKEND_USERNAME: z.string().default('gabriel'),
  BACKEND_TIMEOUT_MS: z.coerce.number().default(30_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
