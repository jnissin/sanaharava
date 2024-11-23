// lib/utils/dictionary.ts
import path from 'path';
import NodeCache from 'node-cache';
import { promises as fs } from 'fs';

const cache = new NodeCache({
  stdTTL: 24 * 60 * 60, // 24 hours in seconds
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false // Prevent cloning of complex objects like Sets
});

const dictionaryPaths: Record<string, string> = {
  "fi-kotus-2024": "data/fi-dictionary-kotus-2024.txt"
};

export async function loadDictionary(dictionaryName: string | null): Promise<Set<string> | null> {
    if (dictionaryName === null || !(dictionaryName in dictionaryPaths)) {
      return null;
    }
  
    const cached = cache.get<Set<string>>(dictionaryName);
    if (cached) return cached;
  
    try {
      const dictionaryFullPath = path.join(process.cwd(), dictionaryPaths[dictionaryName]);
      const fileContent = await fs.readFile(dictionaryFullPath, 'utf-8');
      const dictionary = new Set(
        fileContent
          .split('\n')
          .map(word => word.trim().toUpperCase())
          .filter(word => word.length >= 2)
      );
      cache.set(dictionaryName, dictionary);
      console.log(`Loaded dictionary ${dictionaryName} from ${dictionaryFullPath} with ${dictionary.size} words`);
      return dictionary;
    } catch (error: any) {
      console.warn(`Failed to load dictionary ${dictionaryName}, available paths: ${dictionaryPaths}:`, error);
      return new Set<string>();
    }
  }