import { NextResponse } from "next/server";
import { createGame } from '@/lib/game';

export async function GET(request: Request) {
  if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" }, 
      { status: 401 }
    );
  }

  try {
    const url = new URL(request.url);
    const language = url.searchParams.get("language") as "finnish" | "english" | null;
    const providedGameId = url.searchParams.get("gameId") || new Date().toISOString().split("T")[0];

    const newGameData = await createGame({ 
      gameId: providedGameId, 
      language: language || "finnish" 
    });

    return NextResponse.json({
      success: true,
      data: newGameData,
    });
  } catch (error) {
    console.error("Game generation failed:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}