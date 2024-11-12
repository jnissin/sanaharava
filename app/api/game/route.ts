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
  // Words that are part of the real solution where all the letters are used
  solutionWords: ["YUSUF", "DIKEC", "TSERS", "JOGURTTI", "GEORGIA"],
  // Add additional valid words that aren't part of the solution but considered valid
  additionalValidWords: [
    "YRTTI", "UFO", "GG", "SUO", "SUU", "KUU", "KOE", "OJA", "TIE", "SEI",
    "RUUSU", "TUORE", "SUURI", "KOURU", "JOKU"
  ],
  // Dictionary of valid words
  dictionaryWords: (() => {
    if (!DICTIONARY_PATH) {
      return [];
    }
    try {
      const dictionaryPath = path.join(process.cwd(), DICTIONARY_PATH);
      return readFileSync(dictionaryPath, 'utf-8')
        .split('\n')
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length >= 2);
    } catch (error) {
      console.warn('Failed to load dictionary:', error);
      return [];
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
  const isValid = GAME_DATA.solutionWords.includes(word) || 
                 GAME_DATA.additionalValidWords.includes(word) ||
                 GAME_DATA.dictionaryWords.includes(word);
  const isSolutionWord = GAME_DATA.solutionWords.includes(word);
  return NextResponse.json({ isValid, isSolutionWord });
}

// Endpoint to check game completion
export async function PUT(request: Request) {
  const { foundWords } = await request.json();
  
  // Check that all solution words are found
  const solutionWordsFound = GAME_DATA.solutionWords.every(word => 
    foundWords.includes(word)
  );

  // Check that only solution words are present (no extra words)
  const onlySolutionWords = foundWords.length === GAME_DATA.solutionWords.length;
  
  // Add strict mode validation
  const strictMode = process.env.STRICT_WIN_CONDITION ?? 'false';
  let isComplete = solutionWordsFound && onlySolutionWords;

  if (strictMode === 'true' && isComplete) {
    const gridSize = GAME_DATA.grid.length * GAME_DATA.grid[0].length;
    const totalLettersInWords = GAME_DATA.solutionWords.reduce((sum, word) => sum + word.length, 0);
    isComplete = totalLettersInWords === gridSize;
  }
  
  return NextResponse.json({ 
    isComplete: isComplete,
    strictMode: strictMode,
    congratulationImage: isComplete ? '/8d7f3e2c6a9b4.jpg' : null
  });
}