/**
 * Score Management System
 * 
 * Handles score calculation, submission to Firebase, and real-time highscore updates.
 * 
 * Score Calculation:
 * - Percentage = (total letters in found words / total grid size) × 100
 * - Completion time is locked when 100% is first reached
 * - Backtracking preserves the original completion time (allows exploration)
 */

import { database } from './firebase';
import { ref, set, onValue, query, orderByChild, limitToLast, off } from 'firebase/database';
import type { PlayerData } from './player-auth';

export interface Score {
  playerId: string;
  playerName: string;
  percentage: number;
  startTime: number; // Timestamp when player started (first word found)
  completionTime: number | null; // Timestamp when 100% reached, or null
  lastUpdated: number;
  foundWords: string[];
}

export interface HighscoreEntry extends Score {
  rank: number;
}

/**
 * Calculate completion percentage from found words and grid size
 */
export function calculatePercentage(foundWords: string[], gridSize: number): number {
  const totalLetters = foundWords.reduce((sum, word) => sum + word.length, 0);
  return Math.round((totalLetters / gridSize) * 100);
}

/**
 * Submit player's score to Firebase
 * 
 * Once a player completes the game (100%), their score is locked and no further
 * updates are submitted. The player can continue exploring the game locally.
 * 
 * @param gameId - The game ID (date in YYYY-MM-DD format)
 * @param player - Player data from authentication
 * @param foundWords - Array of words the player has found
 * @param gridSize - Total number of letters in the grid
 */
export async function submitScore(
  gameId: string,
  player: PlayerData,
  foundWords: string[],
  gridSize: number
): Promise<void> {
  const scoreRef = ref(database, `games/${gameId}/scores/${player.playerId}`);
  
  // Read current score to check completion status
  const currentScore = await new Promise<Score | null>((resolve) => {
    onValue(scoreRef, (snapshot) => {
      resolve(snapshot.exists() ? snapshot.val() : null);
    }, { onlyOnce: true });
  });

  // If player has already completed (has a completion time), don't update anymore
  // They can still play locally, but their score is locked
  if (currentScore?.completionTime) {
    return;
  }

  const percentage = calculatePercentage(foundWords, gridSize);
  
  // Check if this is a completion (100%)
  const isComplete = percentage === 100;

  // Determine start time:
  // - If first submission: record current time as start
  // - Otherwise: preserve existing start time
  const startTime = currentScore?.startTime ?? Date.now();

  // Determine completion time:
  // - If reaching 100%: record the achievement time
  // - Otherwise: no completion time yet
  const completionTime = isComplete ? Date.now() : null;

  const score: Score = {
    playerId: player.playerId,
    playerName: player.playerName,
    percentage,
    startTime,
    completionTime,
    lastUpdated: Date.now(),
    foundWords
  };

  await set(scoreRef, score);
}

/**
 * Listen to highscores for a specific game
 * Returns top N scores sorted by percentage (desc) and completion time (asc)
 * 
 * @param gameId - The game ID to listen to
 * @param limit - Maximum number of scores to return (default 10)
 * @param callback - Function called with sorted highscore entries
 * @returns Unsubscribe function to stop listening
 */
export function listenToHighscores(
  gameId: string,
  limit: number = 10,
  callback: (highscores: HighscoreEntry[]) => void
): () => void {
  const scoresRef = ref(database, `games/${gameId}/scores`);

  const handleValue = (snapshot: any) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const scores: Score[] = [];
    snapshot.forEach((child: any) => {
      scores.push(child.val());
    });

    // Sort by:
    // 1. Percentage (descending - higher is better)
    // 2. Elapsed time (ascending - faster completion is better)
    // 3. Last updated (ascending - who reached that percentage first)
    const sorted = scores.sort((a, b) => {
      // First, compare percentage (higher is better)
      if (a.percentage !== b.percentage) {
        return b.percentage - a.percentage;
      }

      // If both at 100%, compare elapsed time (faster is better)
      if (a.percentage === 100 && b.percentage === 100) {
        // If both have completion time, compare elapsed time
        if (a.completionTime && b.completionTime) {
          const elapsedA = a.completionTime - a.startTime;
          const elapsedB = b.completionTime - b.startTime;
          return elapsedA - elapsedB; // Shorter time wins
        }
        // If only one has completion time, that one wins (shouldn't happen at 100%)
        if (a.completionTime) return -1;
        if (b.completionTime) return 1;
      }

      // For non-100% scores, earlier update time wins (reached that percentage first)
      return a.lastUpdated - b.lastUpdated;
    });

    // Take top N and add ranks
    const highscores: HighscoreEntry[] = sorted.slice(0, limit).map((score, index) => ({
      ...score,
      rank: index + 1
    }));

    callback(highscores);
  };

  onValue(scoresRef, handleValue);

  // Return unsubscribe function
  return () => off(scoresRef, 'value', handleValue);
}

/**
 * Get a single player's score for a game
 */
export async function getPlayerScore(gameId: string, playerId: string): Promise<Score | null> {
  const scoreRef = ref(database, `games/${gameId}/scores/${playerId}`);
  
  return new Promise((resolve) => {
    onValue(scoreRef, (snapshot) => {
      resolve(snapshot.exists() ? snapshot.val() : null);
    }, { onlyOnce: true });
  });
}

/**
 * Get elapsed time in milliseconds from a score
 * Returns null if game not completed
 */
export function getElapsedTime(score: Score): number | null {
  if (!score.completionTime) {
    return null;
  }
  return score.completionTime - score.startTime;
}

/**
 * Format elapsed time for display
 * Returns string like "5:32" (minutes:seconds)
 * 
 * @param elapsedMs - Elapsed time in milliseconds
 */
export function formatElapsedTime(elapsedMs: number): string {
  const seconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format a score's completion time for display
 * Returns string like "5:32" or null if not completed
 */
export function formatScoreTime(score: Score): string | null {
  const elapsed = getElapsedTime(score);
  return elapsed ? formatElapsedTime(elapsed) : null;
}

