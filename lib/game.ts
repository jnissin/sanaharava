import { GameData } from '@/app/types/game';
import { generateGameData } from '@/lib/generation/generators';
import { gameCache, getGameKey } from './cache';
import { redis } from './redis';

export async function gameExists(gameId: string): Promise<boolean> {
  return await redis.exists(`game:${gameId}`) === 1;
}

export async function getLatestGameId(): Promise<string | null> {
  const dates = await redis.zrange('game_dates', 0, -1);
  return dates.length ? dates[dates.length - 1] as string : null;
}

export async function getGame(gameId: string): Promise<GameData | null> {
    const cacheKey = getGameKey(gameId);
    
    const cached = gameCache.get<GameData>(cacheKey);
    if (cached) return cached;
  
    const game = await redis.get<GameData>(`game:${gameId}`);
    if (game) {
      gameCache.set(cacheKey, game);
      return game;
    }
  
    return null;
}

export async function createGame({
  gameId,
  language = "finnish",
  rows = 6,
  columns = 5
}: {
  gameId: string;
  language?: "finnish" | "english";
  rows?: number;
  columns?: number;
}): Promise<GameData> {
  if (await gameExists(gameId)) {
    throw new Error(`Game with ID ${gameId} already exists`);
  }

  const newGameData = await generateGameData(gameId, language, rows, columns);

  // Store the game
  await redis.set(`game:${gameId}`, newGameData);

  // Add to sorted set for date tracking
  try {
    const timestamp = new Date(gameId).getTime();
    await redis.zadd('game_dates', { score: timestamp, member: gameId });
  } catch (error) {
    console.error('Failed to add to sorted set:', error);
    throw error;
  }

  return newGameData;
}