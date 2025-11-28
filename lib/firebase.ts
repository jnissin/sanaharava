/**
 * Firebase Client Configuration
 * 
 * This file initializes the Firebase SDK for client-side use.
 * It uses environment variables to configure the Firebase app,
 * allowing different configs for dev vs prod environments.
 * 
 * Why client-side Firebase?
 * - Realtime Database syncs directly with the browser
 * - No need for API routes (bypasses Vercel function limits)
 * - Built-in real-time updates via WebSocket connection
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * Initialize Firebase App
 * 
 * Checks if an app already exists to prevent re-initialization
 * during hot-reloading in development.
 */
let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

/**
 * Get Realtime Database instance
 * 
 * This is what we'll use to read/write highscores.
 * All operations happen in real-time - when data changes,
 * all connected clients receive updates automatically.
 */
export const database = getDatabase(app);

/**
 * Export the app instance in case we need it later
 * (e.g., for other Firebase services like Storage or Auth)
 */
export default app;

