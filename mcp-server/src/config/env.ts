import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  LLM_PROVIDER: z.enum(['anthropic', 'openai']).default('anthropic'),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  PORT: z.coerce.number().default(3001),
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

// Validate that the selected provider has its API key
if (env.LLM_PROVIDER === 'anthropic' && !env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic');
  process.exit(1);
}

if (env.LLM_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is required when LLM_PROVIDER=openai');
  process.exit(1);
}
