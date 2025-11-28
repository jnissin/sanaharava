# AGENTS.md

This file provides AI coding agents with comprehensive context and instructions for working effectively on the Sanaharava project.

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Project Overview](#project-overview)
3. [Technology Stack](#technology-stack)
4. [Development Environment Setup](#development-environment-setup)
5. [Project Structure](#project-structure)
6. [Architecture Overview](#architecture-overview)
7. [Build and Deployment](#build-and-deployment)
8. [Code Style and Conventions](#code-style-and-conventions)
9. [Important Implementation Details](#important-implementation-details)
10. [Safety and Permissions](#safety-and-permissions)
11. [Common Tasks](#common-tasks)
12. [Troubleshooting](#troubleshooting)
13. [Context for AI Assistants](#context-for-ai-assistants)

## Quick Reference

**Common Commands:**
```bash
npm run dev          # Start development server
npm run lint         # Lint all files
npm run build        # Production build
npx eslint --fix <file>        # Lint single file
npx tsc --noEmit <file>        # Type check single file
```

**Key Files:**
- `components/Sanaharava.tsx` - Main game UI component
- `lib/generation/generators.ts` - AI game generation logic
- `app/api/game/route.ts` - Game API endpoints
- `lib/game.ts` - Game CRUD operations
- `lib/player-auth.ts` - Player registration and authentication
- `lib/score-manager.ts` - Highscore calculation and submission
- `lib/firebase.ts` - Firebase Realtime Database client

## Project Overview

**Sanaharava** (English: Wordsweeper) is a Finnish word-finding puzzle game inspired by Sanalouhos of Helsingin Sanomat. Players form words by connecting adjacent letters (horizontally, vertically, or diagonally) in a grid. The game is complete when all letters have been used exactly once to form valid words.

**Key Features:**
- Daily word puzzles with unique themes
- AI-generated game grids using OpenAI GPT-4
- Finnish dictionary validation (Kotus 2024)
- Date-based game navigation
- Redis caching for game data
- Umami analytics integration
- Real-time highscore leaderboard (Firebase Realtime Database)
- Simple token-based player authentication
- Multi-device support via player tokens

## Technology Stack

- **Framework:** Next.js 14.2+ (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3.3+
- **UI Components:** React 18, lucide-react icons
- **Backend/API:** Next.js API Routes
- **AI:** OpenAI GPT-4 (gpt-4o-2024-08-06) with structured outputs (Zod schemas)
- **Database:** Upstash Redis (serverless) for game data
- **Real-time Database:** Firebase Realtime Database for highscores
- **Caching:** node-cache (in-memory)
- **Analytics:** Umami (cloud.umami.is)
- **Deployment:** Vercel
- **Development:** VS Code Dev Containers (Docker-based)
- **Package Manager:** npm
- **Validation:** Zod for schema validation

## Development Environment Setup

### Prerequisites
- Docker installed and running
- VS Code with Dev Containers extension

### Getting Started

1. **Open in Dev Container:**
   - Clone the repository
   - Open in VS Code
   - Click "Reopen in Container" when prompted
   - The container will automatically install dependencies

2. **Install Dependencies:**
```bash
npm install
```

3. **Start Development Server:**
```bash
npm run dev
```
   - Server runs on http://localhost:3000
   - Port 3000 is auto-forwarded in devcontainer

4. **Available Scripts:**
   - `npm run dev` - Start development server
   - `npm run build` - Create production build
   - `npm start` - Start production server
   - `npm run lint` - Run ESLint on all files
   - `npx eslint --fix <file>` - Lint and auto-fix a single file
   - `npx tsc --noEmit` - Type check entire project
   - `npx tsc --noEmit <file>` - Type check a single file

### Environment Variables

The following environment variables are required (stored in `.env.local`, not committed):
- `OPENAI_API_KEY` - OpenAI API key for game generation
- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis authentication token
- `CRON_SECRET` - Secret token for protecting the `/api/generate` cron endpoint (production only)
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL` - Firebase Realtime Database URL
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` - Firebase measurement ID (optional)

**Note:** Firebase variables are prefixed with `NEXT_PUBLIC_` as they are used in client-side code.

## Project Structure

```
/workspace/
├── app/                          # Next.js app router
│   ├── api/                      # API routes
│   │   ├── game/                 # Game endpoints
│   │   │   ├── route.ts         # GET (fetch), POST (validate word), PUT (check completion)
│   │   │   └── dates/           # GET available game dates
│   │   │       └── route.ts
│   │   └── generate/            # Game generation cron endpoint
│   │       └── route.ts
│   ├── types/                   # TypeScript type definitions
│   │   └── game.ts              # GameData interface
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Home page (renders Sanaharava component)
│   ├── globals.css              # Global styles and Tailwind directives
│   ├── robots.ts                # robots.txt generation
│   └── sitemap.ts               # sitemap.xml generation
├── components/                   # React components
│   ├── Sanaharava.tsx           # Main game component (client-side)
│   ├── DateSelector.tsx         # Date navigation component
│   ├── PlayerAuth.tsx           # Player registration/login modal
│   ├── PlayerInfo.tsx           # Inline player info with token copy
│   └── HighscorePanel.tsx       # Real-time highscore leaderboard
├── lib/                         # Utility libraries
│   ├── game.ts                  # Game CRUD operations (Redis)
│   ├── cache.ts                 # In-memory caching (node-cache)
│   ├── redis.ts                 # Upstash Redis client
│   ├── firebase.ts              # Firebase Realtime Database client
│   ├── player-auth.ts           # Player registration and authentication
│   ├── score-manager.ts         # Highscore calculation and submission
│   ├── dictionary.ts            # Finnish dictionary loader
│   ├── analytics-service.ts     # Analytics abstraction layer
│   ├── umami-analytics.ts       # Umami implementation
│   └── generation/              # Game generation logic
│       ├── generators.ts        # OpenAI-based theme and word generation
│       ├── game-generator.ts    # Grid layout algorithm
│       └── schemas.ts           # Zod schemas for OpenAI responses
├── data/                        # Static data files
│   └── fi-dictionary-kotus-2024.txt  # Finnish word dictionary (line-separated)
├── public/                      # Static assets
├── .devcontainer/               # VS Code devcontainer config
│   ├── devcontainer.json
│   └── docker-compose.yml
├── next.config.js               # Next.js configuration
├── vercel.json                  # Vercel deployment config (cron jobs, CORS)
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies and scripts
└── README.md                    # User-facing documentation
```

## Architecture Overview

### Game Flow

1. **Game Loading:**
   - Client requests game by date ID (YYYY-MM-DD format)
   - Server checks Redis for existing game
   - If not found, generates new game using OpenAI
   - Game data cached in Redis and node-cache

2. **Word Validation:**
   - Client sends selected word to POST `/api/game`
   - Server validates against:
     - Solution words (AI-generated theme words)
     - Additional valid words (future feature)
     - Finnish dictionary (Kotus 2024)
   - Minimum word length: 3 characters

3. **Completion Check:**
   - Client sends all found words to PUT `/api/game`
   - Server verifies all letters used exactly once
   - Analytics event tracked on completion

### Game Generation (AI-Powered)

The game generation happens in `/lib/generation/generators.ts`:

1. **Theme Generation:**
   - OpenAI generates 3-5 random themes with descriptions
   - Themes can be timely (seasonal/current events) or generic
   - Structured output via Zod schemas

2. **Word Generation:**
   - OpenAI generates 10-15 words for selected theme
   - Filters: No proper names, no compound words (yhdyssana), 3+ letters
   - Words validated against Finnish dictionary

3. **Word Combination Selection:**
   - Finds all combinations that exactly fill grid (30 letters for 6x5)
   - Calculates difficulty score (word length + shared letters)
   - Selects from top 3 hardest combinations randomly

4. **Grid Layout:**
   - GameGenerator class places words on grid
   - Words must connect via adjacent cells (8-directional)
   - Uses backtracking algorithm to find valid placement
   - May retry multiple times if placement fails

### Data Storage

- **Redis (Upstash):**
  - `game:{gameId}` - GameData object
  - `game_dates` - Sorted set (Z-set) of game IDs by timestamp
  
- **Firebase Realtime Database:**
  - `/games/{gameId}/scores/{playerId}` - Player scores for each game
  - `/players/{playerId}` - Player authentication data
  
- **In-Memory Cache (node-cache):**
  - `gameCache` - Caches GameData (24hr TTL), key: `game:${gameId}`
  - `dictionaryCache` - Caches loaded dictionaries (7 day TTL), key: `dictionary:${dictionaryName}`

- **LocalStorage (Browser):**
  - `sanaharava_player` - Player data for auto-login (playerId, playerName, token)

## Build and Deployment

### Production Build

```bash
npm run build
```

### Deployment to Vercel

**Important:** This project uses **GitHub Actions** for deployment to avoid Vercel Pro tier requirements. The Vercel free tier limits git integration to a single developer, so we use manual deployments via GitHub Actions to support multi-developer workflows.

#### GitHub Actions Workflows

Located in `.github/workflows/`:

**`develop.yaml` - Preview Deployment:**
- Triggers on push to `develop` branch
- Builds using Vercel CLI
- Deploys to preview environment
- Sets custom alias (dev.sanaharava.fi)
- Environment: Uses **Preview** environment variables from Vercel

**`production.yaml` - Production Deployment:**
- Triggers on push to `main` branch
- Builds using Vercel CLI with `--prod` flag
- Deploys to production environment
- Sets custom alias (sanaharava.fi)
- Preserves development alias during deployment
- Environment: Uses **Production** environment variables from Vercel

**Required GitHub Secrets:**
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- `VERCEL_SCOPE` - Vercel team/user scope

**Required GitHub Variables:**
- `DEVELOPMENT_URL` - Dev site URL (e.g., dev.sanaharava.fi)
- `PRODUCTION_URL` - Prod site URL (e.g., sanaharava.fi)

#### Deployment Process

1. **Push to branch:** `git push origin develop` or `git push origin main`
2. **GitHub Actions runs:** Workflow installs Vercel CLI, pulls env vars, builds, and deploys
3. **Vercel builds:** Next.js build runs with environment-specific variables
4. **Alias set:** Custom domain alias configured automatically

**Note:** GitHub Actions has access to Vercel environment variables via `vercel pull --environment=<preview|production>`.

#### Vercel Configuration

- **Cron Jobs:**
  - Daily game generation: `0 0 * * *` (midnight UTC)
  - Endpoint: `/api/generate`

- **File Tracing:**
  - `data/` directory included in `/api/**/*` function bundles
  - Configured in `next.config.js` → `experimental.outputFileTracingIncludes`

- **Environment Variables:**
  - Set in Vercel Dashboard → Settings → Environment Variables
  - Split by environment: **Production** vs **Preview**
  - Firebase variables use `NEXT_PUBLIC_` prefix (client-side)

## Code Style and Conventions

### TypeScript

- **Strict mode enabled** (`tsconfig.json`)
- Path alias: `@/*` maps to workspace root
- Use explicit return types for functions
- Prefer interfaces for object shapes

### React/Next.js

- **Client Components:** Use `'use client'` directive (see `Sanaharava.tsx`, `DateSelector.tsx`)
- **Server Components:** Default for `app/` directory files
- **API Routes:** Export named functions (GET, POST, PUT, DELETE) from `route.ts`
- Use `NextRequest` and `NextResponse` for API handlers

### Styling

- **Tailwind CSS:** Prefer utility classes
- **Custom classes:** Defined in `globals.css` for game-specific styles
  - `.game-cell`, `.current-path`, `.found-word` etc.
- **Responsive:** Grid layout uses fixed cell sizes (50px x 50px) with 8px gap

### File Naming

- **Components:** PascalCase (e.g., `Sanaharava.tsx`)
- **Utilities/Libs:** kebab-case (e.g., `game-generator.ts`)
- **API Routes:** `route.ts` in directory structure
- **Types:** `game.ts` for GameData type definitions

### Error Handling

- API routes return JSON errors with appropriate HTTP status codes
- Console errors logged for debugging
- Client shows user-friendly Finnish error messages

## Testing Instructions

Currently, the project does not have automated tests. When adding tests:

- Use a testing framework like Jest or Vitest
- Test API routes for proper error handling
- Test game generation logic (word combinations, grid layout)
- Test dictionary loading and word validation
- Mock OpenAI API calls to avoid costs

**Recommended structure:**
```
__tests__/
  ├── api/
  ├── lib/
  └── components/
```

## Important Implementation Details

### 1. Game Generation Constraints

- **Grid Size:** 6-8 rows, 5 columns (UI limitation)
- **Total Letters:** rows × columns (e.g., 30 for 6×5)
- **Word Combinations:** Must sum to exact grid size
- **Adjacency:** Words placed such that each letter connects to next (8 directions)

### 2. Dictionary Handling

- **File:** `data/fi-dictionary-kotus-2024.txt`
- **Format:** One word per line, uppercase
- **Loading:** Cached as Set in memory for O(1) lookup
- **Usage:** Validates user inputs and filters AI-generated words

### 3. OpenAI Integration

- **Model:** `gpt-4o-2024-08-06`
- **Structured Outputs:** Uses `zodResponseFormat` with Zod schemas
- **Schemas:** (defined in `lib/generation/schemas.ts`)
  - `ThemeResponse` - Single theme object (theme, description, language, difficulty)
  - `ThemeListResponse` - Array of themes
  - `WordListResponse` - Array of words
- **Error Handling:** Returns null on failure, logs to console

### 4. State Management (Client)

- React useState for game state
- Key state variables in `Sanaharava.tsx`:
  - `grid` - 2D array of letters
  - `currentPath` - Array of [row, col] coordinates
  - `wordPaths` - Object mapping found words to their paths
  - `foundWords` - Array of validated words
  - `isComplete` - Boolean for game completion

### 5. Word Validation Rules

1. Minimum 3 letters (`minValidWordLength`)
2. Must be in:
   - Solution words (AI-generated), OR
   - Additional valid words (future feature), OR
   - Finnish dictionary (Kotus 2024)
3. Not already found

### 6. Analytics Events

Tracked via `analytics-service.ts`:
- `word_found` - Properties: gameId, word, wordLength, wordType
- `invalid_word_attempt` - Properties: gameId, word, wordLength, reason
- `game_completed` - Properties: gameId, foundWords (joined string)

### 7. Path Rendering (SVG Polylines)

- Current path: White, 80% opacity, 3px stroke
- Found word paths: White, 50% opacity, 3px stroke
- Coordinates calculated from cell size (50px) + gap (8px)
- SVG overlays positioned absolutely with `pointer-events: none`

### 8. Highscore System (Firebase Realtime Database)

#### Architecture
- **Client-side Firebase SDK**: Direct browser connection to Firebase (bypasses Vercel API limits)
- **Real-time updates**: WebSocket connection provides instant score synchronization
- **Token-based auth**: Simple UUID tokens stored in localStorage
- **PBKDF2 hashing**: Tokens hashed with 100,000 iterations + unique salt for security

#### Firebase Initialization (`lib/firebase.ts`)

**Critical: Client-Side Only**

Firebase **must** be initialized only in the browser, not during SSR or build time:

```typescript
'use client';  // ← REQUIRED at top of firebase.ts
```

**Why:**
- Next.js modules are evaluated during both SSR and client hydration
- Firebase Database SDK requires browser APIs (WebSocket, localStorage)
- Build process pre-renders pages, which would fail with Firebase calls
- Environment variables must be available at runtime

**Implementation Pattern:**
```typescript
// ✅ Correct: Module-level initialization with 'use client'
'use client';
let database: Database | undefined;
if (isFirebaseConfigured) {
  database = getDatabase(initializeApp(config));
}

// ❌ Wrong: Lazy initialization without 'use client'
// This causes SSR to cache undefined database instance
```

**Checking Availability:**
- Components check `if (database)` before using Firebase
- Connection test on mount: `get(ref(database, 'players'))`
- Graceful degradation: Hide highscore features if unavailable

#### Firebase Security Rules

**Required in Firebase Console → Realtime Database → Rules:**

```json
{
  "rules": {
    "games": {
      "$gameId": {
        "scores": {
          ".read": true,
          "$playerId": {
            ".write": true,
            ".validate": "newData.hasChildren(['playerId', 'playerName', 'percentage', 'startTime', 'lastUpdated', 'foundWords']) && newData.child('percentage').isNumber() && newData.child('percentage').val() >= 0 && newData.child('percentage').val() <= 100"
          }
        }
      }
    },
    "players": {
      ".indexOn": ["nameLower"],
      ".read": true,
      "$playerId": {
        ".write": "!data.exists()",
        ".validate": "newData.hasChildren(['name', 'nameLower', 'tokenHash', 'salt', 'createdAt'])"
      }
    }
  }
}
```

**What these rules do:**
- Anyone can read scores and players (for leaderboard)
- Anyone can write their own score
- Players can only register once (`.write: "!data.exists()"`)
- Validates required fields and data types
- Index on `nameLower` for fast name uniqueness checks

**Important:** Without proper rules, connection test fails with "Permission denied"

#### Player Authentication (`lib/player-auth.ts`)
- **Registration**: Player name + auto-generated token (UUID)
- **Name uniqueness**: Query Firebase by `nameLower` field (case-insensitive)
- **Token storage**: localStorage for persistence, hashed in Firebase using PBKDF2
- **Token hashing**: 100,000 iterations, SHA-256, unique 16-byte salt per user
- **No email/password**: Designed for casual friend competitions
- **Login**: Token-only login (iterates through players to verify hash)

#### Score Tracking (`lib/score-manager.ts`)
- **Percentage calculation**: `(total letters in found words / grid size) × 100`
- **Start time**: Recorded on first score submission (first word found)
- **Completion time**: Locked when player reaches 100%
- **Score locking**: Once 100% reached, no further Firebase updates (local play continues)
- **Elapsed time**: `completionTime - startTime` used for ranking

#### Firebase Data Structure
```
/games/{gameId}/scores/{playerId}
  - playerId: string
  - playerName: string
  - percentage: number (0-100)
  - startTime: number (timestamp of first word found)
  - completionTime: number | null (locked at 100%)
  - lastUpdated: number
  - foundWords: string[]

/players/{playerId}
  - name: string
  - nameLower: string (for case-insensitive queries)
  - tokenHash: string (PBKDF2 hash with 100k iterations)
  - salt: string (hex-encoded 16-byte random salt)
  - createdAt: number
```

#### Highscore Sorting Logic
1. **Primary**: Percentage (descending) - higher is better
2. **Secondary**: Elapsed time (ascending) - faster completion wins
3. **Tertiary**: Last updated (ascending) - who reached percentage first

#### Key Design Decisions
- **Client-side only**: Firebase SDK runs only in browser (see `'use client'` directive)
- **Score locking**: Prevents time manipulation by re-completing
- **Local exploration**: Players can experiment after 100% without penalty
- **Start time tracking**: Enables accurate elapsed time calculation
- **Real-time sync**: All players see updates instantly without polling
- **Graceful degradation**: Game works without Firebase, just no highscores

## Safety and Permissions

### ✅ Allowed Without Prompting

- **Read files** anywhere in the codebase
- **List directories** to explore structure
- **Run linting:** `npm run lint`
- **Start dev server:** `npm run dev`
- **Analyze code** for understanding and suggestions
- **Edit existing files** to implement features or fix bugs

### ⚠️ Ask First

- **Install new packages** - Requires package.json modification
- **Modify environment variables** or `.env.local`
- **Change build configuration** (next.config.js, tailwind.config.ts, tsconfig.json)
- **Delete files** (except temporary test files)
- **Push to git** or modify git configuration
- **Run production build** (`npm run build`) - Can be resource-intensive
- **Modify Vercel configuration** (vercel.json)
- **Change API routes** that affect production data (Redis operations)
- **Modify the Finnish dictionary file**

### 🚫 Never Do

- Commit API keys or secrets to version control
- Force push to main/master branches
- Delete data files (`data/fi-dictionary-kotus-2024.txt`)
- Remove error handling without replacement
- Break TypeScript strict mode compliance

## Common Tasks

### Adding a New API Route

Create `app/api/[route-name]/route.ts` with named exports (GET, POST, PUT, DELETE). Always use `NextRequest`/`NextResponse` and return proper HTTP status codes.

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Implementation
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json({ error: 'Message' }, { status: 500 });
  }
}
```

### Adding a New Component

Create `components/[ComponentName].tsx`. Add `'use client'` directive if using hooks/state. Style with Tailwind utilities; add custom styles to `globals.css` if needed.

### Modifying Game Generation

- **AI theme/words:** `lib/generation/generators.ts`
- **Grid layout:** `lib/generation/game-generator.ts`  
- **OpenAI schemas:** `lib/generation/schemas.ts`

Always test changes with `npm run dev` and monitor console logs.

### Working with Redis

Import client from `lib/redis.ts`. Use standard Redis operations (`get`, `set`, `zadd`). Remember to also update in-memory cache in `lib/cache.ts` when modifying game data.

**Key patterns:**
- Game data: `game:{gameId}`
- Date index: `game_dates` (sorted set)

### Styling Updates

Use Tailwind utilities in JSX. For game-specific styles (`.game-cell`, `.game-grid`, etc.), modify `app/globals.css`. Grid uses fixed 50px cells with 8px gaps.

### Debugging Game Generation

1. Enable debug output by uncommenting `generator.debugPrintGame()` at line 299 in `lib/generation/generators.ts`
2. Console logs to check:
   - `Selected theme:` - Shows chosen theme and description
   - `Generated theme words:` - AI-generated words before filtering
   - `Selected words for game:` - Final word combination
   - `Total length:` - Sum of all word lengths (must equal grid size)
3. Error messages:
   - `"Theme generation failed:"` - OpenAI API or schema validation issue
   - `"Theme word generation failed:"` - Word generation API failure
   - `"No valid word combinations found"` - Cannot fit words into grid size

## Troubleshooting

### Game Generation Fails

**Possible causes:**
- OpenAI API key missing or invalid
- No valid word combinations for grid size
- Dictionary file not loaded
- OpenAI rate limits exceeded

**Debug steps:**
1. Check console logs for specific errors
2. Verify `OPENAI_API_KEY` in environment
3. Check `data/fi-dictionary-kotus-2024.txt` exists and is readable
4. Reduce grid size or regenerate with different theme

### Redis Connection Issues

**Symptoms:** Games not loading, "Failed to retrieve game" errors

**Debug steps:**
1. Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in environment
2. Check Upstash dashboard for connection status
3. Test with simple Redis command in `/lib/redis.ts`

### Dictionary Not Loading

**Symptoms:** All user words marked invalid

**Debug steps:**
1. Verify `data/fi-dictionary-kotus-2024.txt` exists
2. Check file format (one word per line, uppercase)
3. Ensure file is included in Vercel deployment (check `next.config.js`)
4. Check console for dictionary loading errors in `lib/dictionary.ts`

### Client-Side State Issues

**Symptoms:** Grid not updating, words not registering

**Debug steps:**
1. Check browser console for JavaScript errors
2. Verify API responses in Network tab
3. Check React component state in React DevTools
4. Ensure `'use client'` directive present in `Sanaharava.tsx`

### Build/Deployment Failures

**Common issues:**
- TypeScript errors (run `npm run build` locally)
- Missing environment variables on Vercel
- File tracing issues (check `next.config.js`)
- Lint errors (run `npm run lint`)

**Solutions:**
1. Fix TypeScript errors before pushing
2. Add environment variables in Vercel dashboard
3. Verify `experimental.outputFileTracingIncludes` includes necessary files
4. Run full build locally before deploying

### Firebase/Highscore Issues

#### "Firebase unavailable, highscore features disabled"

**Possible causes and solutions:**

**1. Build-time initialization error:**
```
Error: Can't determine Firebase Database URL during build
```
**Solution:** Add `'use client'` directive at top of `lib/firebase.ts`
- Firebase must only initialize in browser, not during SSR/build
- Without `'use client'`, Next.js evaluates module during build
- Module gets cached with `undefined` database instance

**2. Permission denied error:**
```
Error: Permission denied at /players or /games/{gameId}/scores
```
**Solution:** Update Firebase Realtime Database Rules in Firebase Console
- Go to Firebase Console → Realtime Database → Rules
- Ensure `.read: true` for `/players` and `/games/.../scores`
- Add `.indexOn: ["nameLower"]` for `/players`
- Click **Publish**

**3. Missing environment variables:**
```
Firebase configuration incomplete
```
**Solution:** Verify all `NEXT_PUBLIC_FIREBASE_*` variables are set
- Check `.env.local` for development
- Check Vercel Dashboard → Settings → Environment Variables for deployments
- Ensure variables are set for correct environment (Preview vs Production)
- After adding variables to Vercel, **trigger new deployment**

**4. Dev server not restarted:**
**Solution:** After modifying `lib/firebase.ts`, restart `npm run dev`
- Dev server must reload to pick up module changes
- Especially after adding `'use client'` directive

#### Duplicate Player Entries / Score Resets

**Symptoms:** Page reload creates new player entries or resets scores to 0%

**Causes:**
1. New `playerId` generated on every refresh instead of using stored one
2. Score submitted with 0% on mount before state loads

**Solutions:**
1. Ensure `PlayerAuth` uses returned `playerId` from registration, not generated UUID
2. Only submit scores if `foundWords.length > 0`
3. Load player from localStorage on mount before any Firebase operations

#### Game State Lost on Reload

**Symptoms:** `foundWords`, `wordPaths`, `isComplete` reset after page refresh

**Solution:** Implement game state persistence in localStorage
- Save state in `useEffect` whenever game state changes
- Load state from localStorage on mount for current `gameId`
- Use `useRef` flag to prevent race condition between load and save effects

## Context for AI Assistants

**Assistance Guidelines:**
- Provide clear explanations for Next.js/React/TypeScript concepts
- Prefer established patterns over clever solutions
- Include helpful comments for complex logic
- Explain why certain approaches are recommended

## Additional Notes

### Finnish Language Considerations

- The game is designed for Finnish language (locale: fi_FI)
- UI text is in Finnish
- Dictionary is Finnish (Kotus 2024)
- AI prompts emphasize avoiding compound words (yhdyssana) which are common in Finnish

### Performance Considerations

- Game data cached in Redis (persistent) and node-cache (in-memory)
- Dictionary loaded once per instance and cached as Set
- SVG path rendering may be slow with many found words (currently not an issue)
- OpenAI API calls are slow (5-15 seconds) - only done during generation, not gameplay

### Future Enhancements (Not Yet Implemented)

- Automated tests
- English language support (partially implemented)
- Mobile-responsive design improvements
- Hint system
- Difficulty levels
- Social sharing features
- Alternative dictionary sources
- Player profiles with historical scores across multiple games

### Development Tools

- **ESLint:** Configured for Next.js (extend next config)
- **Prettier:** Extensions suggested in devcontainer.json
- **TypeScript:** Strict mode enabled
- **Docker:** Node-based devcontainer with npm global package (vercel CLI)

### Useful Documentation Links

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [Upstash Redis](https://docs.upstash.com/redis)
- [Vercel Deployment](https://vercel.com/docs)
- [Zod](https://zod.dev/)

---

**Last Updated:** 2025-11-28

For questions about this project, refer to README.md for user-facing information or analyze the codebase directly. This AGENTS.md file should be updated when major architectural changes occur.

