import { kv } from '@vercel/kv';
import { GameData } from '@/app/types/game';
import { generateGameData } from '@/lib/generation/generators';
import { gameCache, getGameKey } from './cache';

export async function gameExists(gameId: string): Promise<boolean> {
    const cacheKey = getGameKey(gameId);
    if (gameCache.has(cacheKey)) return true;
    const exists = await kv.exists(cacheKey);
    return exists === 1;
}
  
export async function getGame(gameId: string): Promise<GameData | null> {
    const cacheKey = getGameKey(gameId);
    
    const cached = gameCache.get<GameData>(cacheKey);
    if (cached) return cached;
  
    const game = await kv.get<GameData>(cacheKey);
    if (game) {
      gameCache.set(cacheKey, game);
      return game;
    }
  
    return null;
}

// Get the latest game ID from our sorted set
export async function getLatestGameId(): Promise<string | null> {
    // TODO: Figure out why we need to have rev: true for kv.zrange to work
    // everything else returns an empty array. Works with standard redis correctly.
  const latestGames = (await kv.zrange('game_dates', -1, -1, { rev: true})).reverse();
  return latestGames.length ? latestGames[0] as string : null;
}

// Create a new game
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
  // Check if game already exists
  if (await gameExists(gameId)) {
    throw new Error(`Game with ID ${gameId} already exists`);
  }

  const newGameData = await generateGameData(gameId, language, rows, columns);

  // Store the game
  await kv.set(`game:${gameId}`, newGameData);

  // Add to sorted set for date tracking
  try {
    const timestamp = new Date(gameId).getTime();
    await kv.zadd("game_dates", {
      score: timestamp,
      member: gameId,
    });
  } catch (error) {
    console.error('Failed to add to sorted set:', error);
    throw error;
  }

  return newGameData;
}