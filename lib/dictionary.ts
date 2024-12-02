import path from 'path';
import { promises as fs } from 'fs';
import { dictionaryCache, getDictionaryKey } from './cache';

const dictionaryPaths: Record<string, string> = {
  "fi-kotus-2024": "data/fi-dictionary-kotus-2024.txt"
};

export async function loadDictionary(dictionaryName: string | null): Promise<Set<string> | null> {
    if (dictionaryName === null || !(dictionaryName in dictionaryPaths)) {
      return null;
    }
  
    const cacheKey = getDictionaryKey(dictionaryName);
    const cached = dictionaryCache.get<Set<string>>(cacheKey);
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
      
      dictionaryCache.set(cacheKey, dictionary);
      console.log(`Loaded dictionary ${dictionaryName} from ${dictionaryFullPath} with ${dictionary.size} words`);
      return dictionary;
    } catch (error: any) {
      console.warn(`Failed to load dictionary ${dictionaryName}, available paths: ${dictionaryPaths}:`, error);
      return new Set<string>();
    }
}