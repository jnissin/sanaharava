import { Redis } from '@upstash/redis'


// Create and export a singleton Redis client
export const redis = Redis.fromEnv()