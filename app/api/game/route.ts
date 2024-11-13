import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';


const DICTIONARY_PATH = "data/fi-dictionary-kotus-2024.txt"
const GAME_DATA = {
  grid: [
    ['I', 'T', 'T', 'G', 'F'],
    ['Y', 'R', 'S', 'U', 'E'],
    ['C', 'U', 'U', 'O', 'R'],
    ['S', 'E', 'K', 'G', 'G'],
    ['R', 'I', 'T', 'O', 'I'],
    ['E', 'S', 'D', 'A', 'J']
  ],
  minValidWordLength: 3,
  // Words that are part of the real solution where all the letters are used
  solutionWords: new Set(["YUSUF", "DIKEC", "TSERS", "JOGURTTI", "GEORGIA"]),
  // Additional valid words that aren't part of the solution but considered valid
  // this can be used to extend the optional dictionary
  additionalValidWordsSet: new Set<string>([]),
  // Dictionary of valid words
  dictionaryWords: (() => {
    if (!DICTIONARY_PATH) {
      return new Set<string>();
    }
    try {
      const dictionaryPath = path.join(process.cwd(), DICTIONARY_PATH);
      const wordsSet = new Set(
        readFileSync(dictionaryPath, 'utf-8')
          .split('\n')
          .map(word => word.trim().toUpperCase())
          .filter(word => word.length >= 2)
      );
      console.log(`Loaded dictionary from ${DICTIONARY_PATH} with ${wordsSet.size} words`);
      return wordsSet;
    } catch (error) {
      console.warn('Failed to load dictionary:', error);
      return new Set<string>();
    }
  })()
};

// GET endpoint to fetch the grid
export async function GET() {
  return NextResponse.json({ grid: GAME_DATA.grid });
}

// POST endpoint to verify words
export async function POST(request: Request) {
  const { word } = await request.json();
  const isValid = word.length >= GAME_DATA.minValidWordLength && (
    GAME_DATA.solutionWords.has(word) || 
    GAME_DATA.additionalValidWordsSet.has(word) ||
    GAME_DATA.dictionaryWords.has(word)
  );
  return NextResponse.json({ isValid });
}

// Endpoint to check game completion
export async function PUT(request: Request) {
  const { foundWords } = await request.json();
  
  // Check that all solution words are found
  const solutionWordsFound = Array.from(GAME_DATA.solutionWords).every(word => 
    foundWords.includes(word)
  );

  // Check that only solution words are present
  const onlySolutionWords = foundWords.length === GAME_DATA.solutionWords.size;
  
  // Add strict mode validation
  const strictMode = process.env.STRICT_WIN_CONDITION ?? 'false';
  let isComplete = solutionWordsFound && onlySolutionWords;

  if (strictMode === 'true' && isComplete) {
    const gridSize = GAME_DATA.grid.length * GAME_DATA.grid[0].length;
    const totalLettersInWords = Array.from(GAME_DATA.solutionWords).reduce((sum, word) => sum + word.length, 0);
    isComplete = totalLettersInWords === gridSize;
  }
  
  return NextResponse.json({ 
    isComplete: isComplete,
    strictMode: strictMode,
    congratulationImage: isComplete ? '/8d7f3e2c6a9b4.jpg' : null
  });
}