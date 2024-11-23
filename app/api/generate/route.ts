import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { generateGameData } from "@/lib/generation/generators";

export async function GET(request: Request) {
  // Authorization check for cron job
  if (
    request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  try {
    const url = new URL(request.url);
    const language = url.searchParams.get("language") as
      | "finnish"
      | "english"
      | null;

    const gameId = new Date().toISOString().split("T")[0];
    const newGameData = await generateGameData(gameId, language || "finnish", null, null);

    // Store game with date as key for direct access
    await kv.set(`game:${gameId}`, newGameData);

    // Maintain ordered list of dates for listing/browsing
    await kv.zadd("game_dates", {
      score: new Date(gameId).getTime(),
      member: gameId,
    });

    return NextResponse.json({
      success: true,
      data: newGameData,
    });
  } catch (error) {
    console.error("Game generation failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error,
      },
      { status: 500 }
    );
  }
}
