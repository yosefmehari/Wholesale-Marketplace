import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env file from backend root or parent if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z
    .string()
    .default('dev-super-secret-jwt-access-key-for-wholesalehub-ethiopia-minimum-32-chars'),
  JWT_REFRESH_SECRET: z
    .string()
    .default('dev-super-secret-jwt-refresh-key-for-wholesalehub-ethiopia-minimum-32-chars'),
  DEFAULT_CURRENCY: z.string().default('ETB'),
  DEFAULT_TIMEZONE: z.string().default('Africa/Addis_Ababa'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid backend environment configuration:');
    console.error(result.error.format());
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();
