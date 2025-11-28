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
 * Generate a cryptographically secure hash using PBKDF2
 * This is proper password hashing using the Web Crypto API
 * 
 * @param token - The token to hash
 * @param salt - Optional salt (generated if not provided)
 * @returns Object with hash and salt in hex format
 */
async function secureHash(token: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  
  // Generate or use provided salt
  const saltBytes = salt 
    ? hexToBytes(salt)
    : crypto.getRandomValues(new Uint8Array(16));
  
  // Import the token as a key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(token),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Derive bits using PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000, // High iteration count for security
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // Output length in bits
  );
  
  // Convert to hex
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const saltArray = Array.from(saltBytes);
  const saltHex = saltArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { hash: hashHex, salt: saltHex };
}

/**
 * Helper to convert hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Verify a token against a stored hash
 */
async function verifyToken(token: string, storedHash: string, storedSalt: string): Promise<boolean> {
  const { hash } = await secureHash(token, storedSalt);
  return hash === storedHash;
}

/**
 * Check if a player name is available
 */
export async function isNameAvailable(name: string): Promise<boolean> {
  const normalizedName = name.trim().toLowerCase();
  
  if (!normalizedName || normalizedName.length < 2) {
    return false;
  }

  if (!database) {
    throw new Error('Firebase not initialized');
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
  
  // Generate secure hash with salt
  const { hash: tokenHash, salt } = await secureHash(token);

  if (!database) {
    throw new Error('Firebase not initialized');
  }

  // Save to Firebase (only hash and salt, never the token!)
  const playerRef = ref(database, `players/${playerId}`);
  try {
    await set(playerRef, {
      name: trimmedName,
      nameLower: trimmedName.toLowerCase(),
      tokenHash,
      salt,
      createdAt: Date.now()
    });
  } catch (firebaseError: any) {
    console.error('Player registration failed:', {
      code: firebaseError.code,
      message: firebaseError.message
    });
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
  if (!database) {
    throw new Error('Firebase not initialized');
  }

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

  // Check each player's token hash
  for (const [playerId, player] of Object.entries(players)) {
    const p = player as any;
    // Verify token against stored hash and salt
    const isValid = await verifyToken(token, p.tokenHash, p.salt);
    if (isValid) {
      matchedPlayerId = playerId;
      matchedPlayer = player;
      break;
    }
  }

  if (!matchedPlayerId || !matchedPlayer) {
    return null;
  }

  // Save to localStorage (plaintext token stored on user's device only)
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

