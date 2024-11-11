import { NextResponse } from 'next/server';

// Game data stays on the server
const GAME_DATA = {
  grid: [
    ['I', 'T', 'T', 'G', 'F'],
    ['Y', 'R', 'S', 'U', 'E'],
    ['S', 'U', 'U', 'O', 'R'],
    ['E', 'T', 'K', 'G', 'G'],
    ['R', 'E', 'I', 'O', 'I'],
    ['C', 'S', 'D', 'A', 'J']
  ],
  validWords: ["YUSUF", "DIKEC", "TSERS", "JOGURTTI", "GEORGIA"]
};

// GET endpoint to fetch the grid
export async function GET() {
  return NextResponse.json({ grid: GAME_DATA.grid });
}

// POST endpoint to verify words
export async function POST(request: Request) {
  const { word } = await request.json();
  const isValid = GAME_DATA.validWords.includes(word);
  return NextResponse.json({ isValid });
}

// Endpoint to check game completion
export async function PUT(request: Request) {
  const { foundWords } = await request.json();
  const allWordsFound = GAME_DATA.validWords.every(word => 
    foundWords.includes(word)
  ) && GAME_DATA.validWords.length === foundWords.length;

  // Add strict win condition check i.e. the number of letters in words
  // must match the number of letters in the grid. This also prevents
  // certain attacks where the user might send a long list of words
  // to the backend.
  //
  // Note that this expects that the puzzle is correctly constructed.
  const strictMode = process.env.STRICT_WIN_CONDITION ?? 'false';

  if (strictMode === 'true') {
    const gridSize = GAME_DATA.grid.length * GAME_DATA.grid[0].length;
    const totalLettersInWords = GAME_DATA.validWords.reduce((sum, word) => sum + word.length, 0);

    if (totalLettersInWords !== gridSize) {
      return NextResponse.json({
        isComplete: false,
        totalWords: GAME_DATA.validWords.length,
        strictMode: strictMode
      });
    }
  }

  return NextResponse.json({ 
    isComplete: allWordsFound,
    totalWords: GAME_DATA.validWords.length,
    strictMode: strictMode
  });
}