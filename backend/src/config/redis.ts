import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const CACHE_KEYS = {
  MENU: 'menu:all',
  CATEGORIES: 'categories:all',
} as const;

export const CACHE_TTL = {
  MENU: 300,       // 5 minutes
  OTP: 300,        // 5 minutes
  SESSION: 86400,  // 24 hours
} as const;

export default redis;
