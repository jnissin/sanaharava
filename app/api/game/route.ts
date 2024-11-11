import { NextResponse } from 'next/server';

// Game data stays on the server
const GAME_DATA = {
  grid: [
    ['L', 'U', 'M', 'I', 'D'],
    ['A', 'Y', 'U', 'K', 'I'],
    ['H', 'S', 'L', 'E', 'K'],
    ['J', 'U', 'A', 'C', 'E'],
    ['A', 'F', 'H', 'T', 'N'],
    ['B', 'B', 'C', 'U', 'X']
  ],
  validWords: ['YUSUF', 'DIKEC', 'LAHJA', 'LUMI', 'JOULU']
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