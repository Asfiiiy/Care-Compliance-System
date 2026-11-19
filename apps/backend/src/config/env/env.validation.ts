import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number(),

  NODE_ENV: z.enum([
    'development',
    'production',
    'test',
  ]),

  API_PREFIX: z.string(),

  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32),

  JWT_REFRESH_SECRET: z.string().min(32),

  JWT_ACCESS_EXPIRES: z.string(),

  JWT_REFRESH_EXPIRES: z.string(),

  MAIL_HOST: z.string(),

  MAIL_PORT: z.coerce.number(),

  MAIL_USER: z.string(),

  MAIL_PASSWORD: z.string(),

  MAIL_FROM: z.string(),
});