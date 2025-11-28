'use client';

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
 * 
 * Note: 'use client' directive ensures this module only runs in browser
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
 * Check if Firebase configuration is available
 */
const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.databaseURL &&
  firebaseConfig.projectId
);

/**
 * Initialize Firebase App
 * 
 * Initializes if config is available.
 * The 'use client' directive ensures this only runs in the browser.
 */
let app: FirebaseApp | undefined;
let database: Database | undefined;

if (isFirebaseConfigured) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    database = getDatabase(app);
  } catch (error) {
    console.error('Firebase initialization failed:', error);
  }
} else {
  console.warn('Firebase configuration incomplete - highscore features will be disabled');
}

export { database };

/**
 * Export the app instance
 */
export default app;

