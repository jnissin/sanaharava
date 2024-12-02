import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

//import { Redis } from '@upstash/redis'
//const redis = Redis.fromEnv();


export async function GET() {
    try {
      // Get all game dates from Redis, ordered by score (timestamp) in reverse order
      // Reverse the array to get the newest first, figure out why only rev: true works?
      // setting anything else than rev: true returns an empty array
      const dates = (await kv.zrange("game_dates", 0, -1, { rev: true })).reverse();
      //const dates2 = await redis.zrange("game_dates", 0, -1);
      //console.log('Fetched dates from Redis', dates2);
      //console.log('Fetched dates from Vercel KV:', dates);
      
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