export interface GameData {
    id: string;
    grid: string[][];
    minValidWordLength: number;
    solutionWords: string[];
    additionalValidWords: string[];
    validWordsDictionaryName: string | null;
    timestamp: number;
  }