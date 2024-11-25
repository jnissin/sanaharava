import NodeCache from 'node-cache';

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { GameData } from '@/app/types/game';
import { analytics } from '@/lib/analytics-service';
import { generateGameData } from '@/lib/generation/generators';
import { loadDictionary } from '@/lib/dictionary';


// In memory cache structure
const cache = new NodeCache({
  stdTTL: 24 * 60 * 60, // 24 hours in seconds
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false // Prevent cloning of complex objects like Sets
});


async function getGameData(gameId: string | null, rows: number | null, columns: number | null): Promise<GameData | null> {
  if (!gameId) {
    const latestGames = await kv.zrange('game_dates', -1, -1);
    if (!latestGames.length) {
      console.warn('No games found in the database');
      return null;
    }
    gameId = latestGames[0] as string;
  }

  const cacheKey = `game:${gameId}`;
  const cached = cache.get<GameData>(cacheKey);
  if (cached) return cached;

  const gameData = await kv.get<GameData>(cacheKey);
  if (gameData) {
    cache.set(cacheKey, gameData);
    return gameData;
  }

  //generate new game
  const language = undefined; //TODO implement language passing from client
  
  gameId = new Date().toISOString().split("T")[0];
  const newGameData = await generateGameData(gameId, language || "finnish", rows, columns);

  // Store game with date as key for direct access
  await kv.set(`game:${gameId}`, newGameData);
  return newGameData;
}

// GET endpoint to fetch the grid
//export async function GET(gameId?:string, rows?:number, columns?:number) {
export async function GET(request: NextRequest) {
  const gameId: string | null = request.nextUrl.searchParams.get('gameId');
  const rows: number | null = Number(request.nextUrl.searchParams.get('rows'));
  const columns: number | null = Number(request.nextUrl.searchParams.get('columns'));
  //const gameData = await getGameData(undefined, undefined, undefined);
  const gameData = await getGameData(gameId, rows, columns);
  if (!gameData) {
    return NextResponse.json(
      { error: 'No game data available' }, 
      { status: 404 }
    );
  }

  return NextResponse.json({ grid: gameData.grid, id: gameData.id });
}



// POST endpoint to verify words
export async function POST(request: NextRequest) {
  const gameId: string | null = request.nextUrl.searchParams.get('gameId');
  const gameData = await getGameData(gameId, null, null);
  if (!gameData) {
    return NextResponse.json(
      { error: 'No game data available' }, 
      { status: 404 }
    );
  }

  const { word } = await request.json();
  if (!word) {
    return NextResponse.json(
      { error: 'Word is required' }, 
      { status: 400 }
    );
  }

  const solutionWordsSet = new Set(gameData.solutionWords);
  const additionalWordsSet = new Set(gameData.additionalValidWords);
  const dictionaryWords = await loadDictionary(gameData.validWordsDictionaryName);

  const isSolutionWord = solutionWordsSet.has(word);
  const isAdditionalWord = additionalWordsSet.has(word);
  const isDictionaryWord = dictionaryWords ? dictionaryWords.has(word) : true;
  
  const isValid = word.length >= gameData.minValidWordLength && (
    isSolutionWord || isAdditionalWord || isDictionaryWord
  );

  if (isValid) {
    analytics.track('word_found', {
      gameId: gameData.id,
      word,
      wordLength: word.length,
      wordType: isSolutionWord ? 'solution' : 
                isAdditionalWord ? 'additional' : 
                'dictionary'
    }, '/api/game');
  } else {
    analytics.track('invalid_word_attempt', {
      gameId: gameData.id,
      word,
      wordLength: word.length,
      reason: word.length < gameData.minValidWordLength ? 'too_short' : 'not_a_valid_word'
    }, '/api/game');
  }

  return NextResponse.json({ isValid });
}

export async function PUT(request: NextRequest) {
  const gameId: string | null = request.nextUrl.searchParams.get('gameId');
  const gameData = await getGameData(gameId, null, null);
  if (!gameData) {
    return NextResponse.json(
      { error: 'No game data available' }, 
      { status: 404 }
    );
  }

  const { foundWords } = await request.json();
  if (!Array.isArray(foundWords)) {
    return NextResponse.json(
      { error: 'foundWords must be an array' }, 
      { status: 400 }
    );
  }

  const solutionWordsSet = new Set(gameData.solutionWords);
  const dictionaryWordsSet = await loadDictionary(gameData.validWordsDictionaryName);

  // Check that all words are valid
  const allWordsValid = foundWords.every(word => 
    solutionWordsSet.has(word) || (dictionaryWordsSet && dictionaryWordsSet.has(word))
  );

  // Check that the number of letters in words matches the grid size
  const gridSize = gameData.grid.length * gameData.grid[0].length;
  const totalLettersInWords = foundWords.reduce((sum, word) => sum + word.length, 0);
  const allLettersUsed = totalLettersInWords === gridSize;

  let isComplete = allWordsValid && allLettersUsed;
  
  if (isComplete) {
    analytics.track('game_completed', {
      gameId: gameData.id,
      foundWords: foundWords.sort().join('-')
    }, '/api/game');
  }

  return NextResponse.json({ 
    isComplete,
  });
}