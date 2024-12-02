import { NextRequest, NextResponse } from 'next/server';
import { getGame, getLatestGameId } from '@/lib/game';
import { loadDictionary } from '@/lib/dictionary';
import { analytics } from '@/lib/analytics-service';
import { createGame } from '@/lib/game';

export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get('gameId');
  
  try {
    const targetGameId = gameId || await getLatestGameId();
    if (!targetGameId) {
      return NextResponse.json(
        { error: 'No games available' }, 
        { status: 404 }
      );
    }

    let gameData = await getGame(targetGameId);
    if (!gameData) {
      console.log(`Game not found for ID ${targetGameId}, attempting to create it`);
      gameData = await createGame({
        gameId: targetGameId,
        language: "finnish" // Default to Finnish for now
      });
    }

    return NextResponse.json({ 
      grid: gameData.grid, 
      id: gameData.id 
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to retrieve game: ${error}` }, 
      { status: 500 }
    );
  }
}

// POST endpoint to verify words
export async function POST(request: NextRequest) {
  const gameId: string | null = request.nextUrl.searchParams.get('gameId');
  
  if (!gameId) {
    return NextResponse.json(
      { error: 'Game ID is required' }, 
      { status: 400 }
    );
  }

  const gameData = await getGame(gameId);
  if (!gameData) {
    return NextResponse.json(
      { error: `No game data available for game ID: ${gameId}` }, 
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
  
  if (!gameId) {
    return NextResponse.json(
      { error: 'Game ID is required' }, 
      { status: 400 }
    );
  }

  const gameData = await getGame(gameId);

  if (!gameData) {
    return NextResponse.json(
      { error: `No game data available for game ID: ${gameId}` }, 
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