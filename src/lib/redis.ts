import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn('Missing Upstash Redis environment variables - rate limiting will not work');
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
}); 