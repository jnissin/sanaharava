export interface GameData {
    id: string;
    grid: string[][];
    minValidWordLength: number;
    solutionWords: string[];
    additionalValidWords: string[];
    validWordsDictionaryPath: string;
    timestamp: number;
  }