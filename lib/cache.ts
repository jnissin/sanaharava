import NodeCache from 'node-cache';

interface CacheOptions {
  stdTTL?: number;
  checkperiod?: number;
  useClones?: boolean;
}

// Base cache factory
const createCache = (options: CacheOptions) => new NodeCache({
  useClones: false, // Default for all caches
  ...options
});

// Specific cache instances
export const gameCache = createCache({
  stdTTL: 24 * 60 * 60, // 24 hours - games change daily
  checkperiod: 600, // Check every 10 minutes
});

export const dictionaryCache = createCache({
  stdTTL: 7 * 24 * 60 * 60, // 7 days - dictionaries change rarely
  checkperiod: 3600, // Check every hour
});

// Type-safe key generators
export const getGameKey = (gameId: string) => `game:${gameId}`;
export const getDictionaryKey = (dictionaryName: string) => `dictionary:${dictionaryName}`;