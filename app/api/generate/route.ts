import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { GameData } from '@/app/types/game';


function generateNewGameData(gameId: string): GameData {
  // TODO: Replace with actual game generation logic
  return {
    id: gameId,
    grid: [
      ['I', 'T', 'T', 'G', 'F'],
      ['Y', 'R', 'S', 'U', 'E'],
      ['C', 'U', 'U', 'O', 'R'],
      ['S', 'E', 'K', 'G', 'G'],
      ['R', 'I', 'T', 'O', 'I'],
      ['E', 'S', 'D', 'A', 'J']
    ],
    minValidWordLength: 3,
    solutionWords: ["YUSUF", "DIKEC", "TSERS", "JOGURTTI", "GEORGIA"],
    additionalValidWords: [],
    validWordsDictionaryName: "fi-kotus-2024",
    timestamp: Date.now()
  };
}

export async function GET(request: Request) {
  // Authorization check for cron job
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ 
      success: false, 
      error: 'Unauthorized' 
    }, { status: 401 });
  }

  try {
    const gameId = new Date().toISOString().split('T')[0];
    const newGameData = generateNewGameData(gameId);
    
    // Store game with date as key for direct access
    await kv.set(`game:${gameId}`, newGameData);
    
    // Maintain ordered list of dates for listing/browsing
    await kv.zadd('game_dates', {
      score: new Date(gameId).getTime(),
      member: gameId
    });

    return NextResponse.json({ 
      success: true, 
      data: newGameData
    });
  } catch (error) {
    console.error('Game generation failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error 
    }, { status: 500 });
  }
}