import path from 'path';

import NodeCache from 'node-cache';

import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { kv } from '@vercel/kv';
import { GameData } from '@/app/types/game';

// In memory cache structure
const cache = new NodeCache({
  stdTTL: 24 * 60 * 60, // 24 hours in seconds
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false // Prevent cloning of complex objects like Sets
});

const dictionaryPaths: Record<string, string> = {
  "fi-kotus-2024": "data/fi-dictionary-kotus-2024.txt"
};

async function loadDictionary(dictionaryName: string | null): Promise<Set<string>> {
  if (dictionaryName === null) {
    return new Set<string>();
  }

  const cached = cache.get<Set<string>>(dictionaryName);
  if (cached) return cached;

  try {
    const fullPath = path.join(process.cwd(), dictionaryPaths[dictionaryName]);
    const dictionary = new Set(
      readFileSync(fullPath, 'utf-8')
        .split('\n')
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length >= 2)
    );
    
    cache.set(dictionaryName, dictionary);
    console.log(`Loaded dictionary ${dictionaryName} from ${dictionaryPaths[dictionaryName]} with ${dictionary.size} words`);
    return dictionary;
  } catch (error) {
    console.warn('Failed to load dictionary:', error);
    return new Set<string>();
  }
}

async function getGameData(gameId?: string): Promise<GameData | null> {
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
  }

  return gameData;
}

// GET endpoint to fetch the grid
export async function GET() {
  const gameData = await getGameData();
  if (!gameData) {
    return NextResponse.json(
      { error: 'No game data available' }, 
      { status: 404 }
    );
  }

  return NextResponse.json({ grid: gameData.grid });
}

// POST endpoint to verify words
export async function POST(request: Request) {
  const gameData = await getGameData();
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

  const isValid = word.length >= gameData.minValidWordLength && (
    solutionWordsSet.has(word) || 
    additionalWordsSet.has(word) ||
    dictionaryWords.has(word)
  );

  return NextResponse.json({ isValid });
}

// PUT endpoint to check game completion
export async function PUT(request: Request) {
  const gameData = await getGameData();
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
  
  // Check that all solution words are found
  const solutionWordsFound = Array.from(solutionWordsSet)
    .every(word => foundWords.includes(word));

  // Check that only solution words are present
  const onlySolutionWords = foundWords.length === solutionWordsSet.size;
  
  // Check that the number of letters in words matches the grid size
  const gridSize = gameData.grid.length * gameData.grid[0].length;
  const totalLettersInWords = Array.from(solutionWordsSet)
    .reduce((sum, word) => sum + word.length, 0);
  const allLettersUsed = totalLettersInWords === gridSize

  let isComplete = solutionWordsFound && onlySolutionWords && allLettersUsed;
  
  return NextResponse.json({ 
    isComplete,
    congratulationImage: isComplete ? '/8d7f3e2c6a9b4.jpg' : null
  });
}