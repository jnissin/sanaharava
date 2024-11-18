import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { GameData } from '@/app/types/game';
import {
  ThemeResponse,
  ThemeListResponse,
  WordListResponse,
} from "@/lib/generation/schemas";

const openai = new OpenAI();

interface WordCombination {
  words: string[];
  totalLength: number;
  difficultyScore: number;
}

async function generateThemes(
  language: "finnish" | "english" = "finnish"
): Promise<z.infer<typeof ThemeResponse>[] | null> {
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: `Generate 3-5 random themes for a word game. Each theme should be specific enough to generate 10-15 related words, but broad enough to have variety. Themes can be timely (related to current events or seasons) or generic. The target language should be ${language}.`,
        },
        {
          role: "user",
          content: "Generate new themes.",
        },
      ],
      response_format: zodResponseFormat(ThemeListResponse, "themeList"),
    });
    const firstChoice = completion.choices[0];
    if (!firstChoice) return null;
    if (!firstChoice?.message?.parsed) return null;
    return firstChoice.message.parsed.themes;
  } catch (error) {
    console.error("Theme generation failed:", error);
    return null;
  }
}

async function generateThemeWords(
  theme: z.infer<typeof ThemeResponse>
): Promise<string[] | null> {
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: `Generate a list of 10-15 words related to the theme. Words should be in ${theme.language}. Include words of various lengths but no shorter than 3 letters. All the words should be in the target language and the words should not include proper names.`,
        },
        {
          role: "user",
          content: `Generate words related to: ${theme.theme}\nDescription: ${theme.description}`,
        },
      ],
      response_format: zodResponseFormat(WordListResponse, "wordList"),
    });

    const firstChoice = completion.choices[0];
    if (!firstChoice) return null;
    if (!firstChoice?.message?.parsed) return null;
    return firstChoice.message.parsed.words;
  } catch (error) {
    console.error("Theme word generation failed:", error);
    return null;
  }
}

function calculateWordCombinationDifficultyScore(words: string[]): number {
  let score = 0;

  // 1. Score based on word lengths (longer words = higher score)
  const lengthScore =
    words.reduce((acc, word) => {
      // Exponential scoring for length
      return acc + Math.pow(word.length, 1.5);
    }, 0) / words.length;

  // 2. Score based on shared letters
  const letterFrequency: { [key: string]: number } = {};
  words.forEach((word) => {
    Array.from(new Set(word.toLowerCase())).forEach((letter) => {
      letterFrequency[letter] = (letterFrequency[letter] || 0) + 1;
    });
  });

  const sharedLetterScore = Object.values(letterFrequency)
    .filter((freq) => freq > 1)
    .reduce((acc, freq) => acc + freq * 1.5, 0);

  // Combine scores (can adjust weights as needed)
  score = lengthScore * 0.6 + sharedLetterScore * 0.4;
  return score;
}

function findWordCombinations(
  words: string[],
  targetLength: number,
  currentCombination: string[] = [],
  currentLength: number = 0
): WordCombination[] {
  // Base cases
  if (currentLength === targetLength) {
    return [
      {
        words: [...currentCombination],
        totalLength: currentLength,
        difficultyScore:
          calculateWordCombinationDifficultyScore(currentCombination),
      },
    ];
  }
  if (currentLength > targetLength || words.length === 0) {
    return [];
  }

  const results: WordCombination[] = [];

  // Try including the current word
  const [word, ...remainingWords] = words;
  if (currentLength + word.length <= targetLength) {
    results.push(
      ...findWordCombinations(
        remainingWords,
        targetLength,
        [...currentCombination, word],
        currentLength + word.length
      )
    );
  }

  // Try skipping the current word
  results.push(
    ...findWordCombinations(
      remainingWords,
      targetLength,
      currentCombination,
      currentLength
    )
  );

  return results;
}

function generateWordCombination(
  themeWords: string[],
  gridSize: number
): string[] {
  // Filter out words that are too long for the grid
  const validWords = themeWords.filter((word) => word.length <= gridSize);

  // Find all possible combinations
  const combinations = findWordCombinations(validWords, gridSize);

  if (combinations.length === 0) {
    throw new Error("No valid word combinations found for the grid size");
  }

  // Sort combinations by difficulty score
  combinations.sort((a, b) => b.difficultyScore - a.difficultyScore);

  // Select a combination randomly from the top 3 most difficult ones
  // This adds some variety while maintaining challenge
  const topCombinations = combinations.slice(
    0,
    Math.min(3, combinations.length)
  );
  const selectedCombination =
    topCombinations[Math.floor(Math.random() * topCombinations.length)];

  return selectedCombination.words;
}

function generateWordGrid(
  words: string[],
  rows: number,
  cols: number
): string[][] {
  const totalGridSize = rows * cols;
  const totalWordsLength = words.reduce((sum, word) => sum + word.length, 0);

  // Validate that words exactly fill the grid
  if (totalWordsLength !== totalGridSize) {
    throw new Error(
      `Invalid word combination: total length ${totalWordsLength} ` +
        `does not match grid size ${totalGridSize}`
    );
  }

  // Initialize grid
  const grid: string[][] = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(""));

  let currentRow = 0;
  let currentCol = 0;
  let goingRight = true; // Direction flag

  // Place each word sequentially
  for (const word of words) {
    for (const letter of word) {
      grid[currentRow][currentCol] = letter.toUpperCase();

      // Move to next position based on direction
      if (goingRight) {
        currentCol++;
        if (currentCol >= cols) {
          currentCol = cols - 1; // Reset to end of next row
          currentRow++;
          goingRight = false; // Switch direction
        }
      } else {
        currentCol--;
        if (currentCol < 0) {
          currentCol = 0; // Reset to start of next row
          currentRow++;
          goingRight = true; // Switch direction
        }
      }
    }
  }

  return grid;
}

export async function generateGameData(
  gameId: string,
  language: "finnish" | "english" = "finnish"
): Promise<GameData> {
  // Generate multiple themes and select one randomly
  const themes = await generateThemes(language);
  if (!themes || themes.length === 0) {
    throw new Error("Failed to generate themes");
  }

  const theme = themes[Math.floor(Math.random() * themes.length)];
  console.log(`Selected theme:`, {
    theme: theme.theme,
    description: theme.description,
    language: theme.language,
  });

  // Generate words based on theme
  const themeWords = await generateThemeWords(theme);
  console.log(`Generated theme words: ${themeWords}`);

  if (!themeWords) {
    throw new Error("Failed to generate theme words");
  }

  // Calculate total grid size (rows * cols)
  const gridSize = 6 * 5; // Assuming 6x5 grid

  // Select words that fit the grid
  const selectedWords = generateWordCombination(themeWords, gridSize);

  console.log(`Selected words for game:`, selectedWords);
  console.log(
    `Total length:`,
    selectedWords.reduce((acc, word) => acc + word.length, 0)
  );

  const solutionWords = selectedWords.map((word) => word.toUpperCase());
  const grid = generateWordGrid(solutionWords, 6, 5);

  return {
    id: gameId,
    grid: grid,
    minValidWordLength: 3,
    solutionWords: solutionWords,
    additionalValidWords: [],
    validWordsDictionaryName: "fi-kotus-2024",
    timestamp: Date.now(),
  };
}
