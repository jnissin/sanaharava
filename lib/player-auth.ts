/**
 * Player Authentication System
 * 
 * Simple token-based authentication for players.
 * Players register with just a name and get a unique token.
 * 
 * Why this approach?
 * - No email/password complexity
 * - Perfect for casual friend games
 * - Token allows playing on multiple devices
 * - LocalStorage keeps player logged in
 */

import { database } from './firebase';
import { ref, get, set, query, orderByChild, equalTo } from 'firebase/database';

export interface PlayerData {
  playerId: string;
  playerName: string;
  token: string;
}

const STORAGE_KEY = 'sanaharava_player';

/**
 * Generate a simple hash from a string
 * This is NOT cryptographically secure, but sufficient for our casual use case
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Check if a player name is available
 */
export async function isNameAvailable(name: string): Promise<boolean> {
  const normalizedName = name.trim().toLowerCase();
  
  if (!normalizedName || normalizedName.length < 2) {
    return false;
  }

  // Query Firebase for players with this name
  const playersRef = ref(database, 'players');
  const nameQuery = query(playersRef, orderByChild('nameLower'), equalTo(normalizedName));
  const snapshot = await get(nameQuery);
  
  return !snapshot.exists();
}

/**
 * Register a new player
 * Returns the player data with token, or null if name is taken
 */
export async function registerPlayer(name: string): Promise<PlayerData | null> {
  const trimmedName = name.trim();
  
  // Validate name
  if (trimmedName.length < 2 || trimmedName.length > 20) {
    throw new Error('Nimi tulee olla 2-20 merkkiä pitkä');
  }

  // Check if name is available
  const available = await isNameAvailable(trimmedName);
  if (!available) {
    throw new Error('Nimi on jo käytössä');
  }

  // Generate unique player ID and token
  const playerId = crypto.randomUUID();
  const token = crypto.randomUUID();
  const tokenHash = simpleHash(token);

  // Save to Firebase
  const playerRef = ref(database, `players/${playerId}`);
  try {
    await set(playerRef, {
      name: trimmedName,
      nameLower: trimmedName.toLowerCase(),
      tokenHash,
      createdAt: Date.now()
    });
    console.log('✅ Successfully saved player to Firebase');
  } catch (firebaseError: any) {
    console.error('❌ Firebase write error:', firebaseError);
    console.error('Error code:', firebaseError.code);
    console.error('Error message:', firebaseError.message);
    throw firebaseError;
  }

  // Save to localStorage
  const playerData: PlayerData = {
    playerId,
    playerName: trimmedName,
    token
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(playerData));

  return playerData;
}

/**
 * Login with token only
 * Returns player data if valid, null otherwise
 */
export async function loginPlayer(token: string): Promise<PlayerData | null> {
  const tokenHash = simpleHash(token);

  // Query all players to find matching token
  const playersRef = ref(database, 'players');
  const snapshot = await get(playersRef);

  if (!snapshot.exists()) {
    return null;
  }

  // Search for player with matching tokenHash
  const players = snapshot.val();
  let matchedPlayerId: string | null = null;
  let matchedPlayer: any = null;

  for (const [playerId, player] of Object.entries(players)) {
    if ((player as any).tokenHash === tokenHash) {
      matchedPlayerId = playerId;
      matchedPlayer = player;
      break;
    }
  }

  if (!matchedPlayerId || !matchedPlayer) {
    return null;
  }

  // Save to localStorage
  const playerData: PlayerData = {
    playerId: matchedPlayerId,
    playerName: matchedPlayer.name,
    token
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(playerData));

  return playerData;
}

/**
 * Get player data from localStorage
 */
export function getLocalPlayer(): PlayerData | null {
  if (typeof window === 'undefined') {
    return null; // Server-side rendering
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as PlayerData;
  } catch {
    return null;
  }
}

/**
 * Check if player is registered locally
 */
export function isPlayerRegistered(): boolean {
  return getLocalPlayer() !== null;
}

/**
 * Logout player (clear localStorage)
 */
export function logoutPlayer(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

