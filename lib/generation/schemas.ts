import { z } from "zod";

export const ThemeResponse = z.object({
  theme: z.string().describe(`The theme name in the target language`),
  description: z
    .string()
    .describe(`A brief description of the theme in the target language`),
  language: z
    .enum(["finnish", "english"])
    .describe("The language of the theme and description"),
  difficulty: z
    .enum(["easy", "medium", "hard"])
    .describe("The difficulty level of the theme"),
});

export const ThemeListResponse = z.object({
  themes: z.array(ThemeResponse).describe("A list of themes for the word game"),
});

export const WordListResponse = z.object({
  words: z.array(z.string()).describe("A list of words for the word game"),
});
