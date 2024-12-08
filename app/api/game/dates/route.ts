import { NextResponse } from "next/server";
import { redis } from '@/lib/redis';


export async function GET() {
    try {
      const dates = await redis.zrange('game_dates', 0, -1);
      
      return NextResponse.json({
        success: true,
        dates: dates
      });
    } catch (error) {
      console.error("Failed to fetch game dates:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch game dates"
        },
        { status: 500 }
      );
    }
}