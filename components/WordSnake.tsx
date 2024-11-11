'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

interface WordPath {
  path: number[][];
}

interface WordPaths {
  [key: string]: WordPath;
}

const GameTitle = () => {
  return (
    <h1 className="game-title">
      C09 Sanalouhos
    </h1>
  );
};

const WordSnake = () => {
    const [grid, setGrid] = useState<string[][]>([]);
    const [currentPath, setCurrentPath] = useState<number[][]>([]);
    const [wordPaths, setWordPaths] = useState<WordPaths>({});
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [foundWords, setFoundWords] = useState<string[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    
  useEffect(() => {
    fetch('/api/game')
      .then(res => res.json())
      .then(data => {
        setGrid(data.grid);
        setIsLoading(false);
        // Check completion if there are any found words
        if (foundWords.length > 0) {
          checkGameCompletion(foundWords);
        }
      });
  }, []);

  const isAdjacent = (cell1: number[], cell2: number[]) => {
    const [row1, col1] = cell1;
    const [row2, col2] = cell2;
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
  };

  const handleCellClick = (row: number, col: number) => {
    setError('');
    
    if (currentPath.length > 0 && 
        currentPath[currentPath.length - 1][0] === row && 
        currentPath[currentPath.length - 1][1] === col) {
      setCurrentPath(prev => prev.slice(0, -1));
      return;
    }

    const isUsedInFoundWord = Object.values(wordPaths).some(({ path }) =>
      path.some(([r, c]) => r === row && c === col)
    );

    if (isUsedInFoundWord) return;

    if (currentPath.length === 0 || 
        isAdjacent(currentPath[currentPath.length - 1], [row, col])) {
      if (!currentPath.some(([r, c]) => r === row && c === col)) {
        setCurrentPath(prev => [...prev, [row, col]]);
      }
    }
  };

  const getWord = (path: number[][]) => {
    return path.map(([row, col]) => grid[row][col]).join('');
  };

  const handleConnect = async () => {
    const word = getWord(currentPath);
    
    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word })
      });
      
      const { isValid } = await response.json();
      
      if (isValid && !foundWords.includes(word)) {
        const updatedFoundWords = [...foundWords, word];
        setFoundWords(updatedFoundWords);
        setWordPaths(prev => ({
          ...prev,
          [word]: { path: [...currentPath] }
        }));
        checkGameCompletion(updatedFoundWords);
        setCurrentPath([]);
        setError('');
      } else if (foundWords.includes(word)) {
        setError('Sana on jo löytynyt');
      } else {
        setError('Tämä sana ei kuulu joukkoon');
      }
    } catch (error) {
      setError('Nyt meni bitti vinoon');
    }
  };

  const checkGameCompletion = async (words: string[]) => {
    try {
      const response = await fetch('/api/game', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foundWords: words })
      });
      
      const { isComplete } = await response.json();
      
      if (isComplete) {
        setIsComplete(true);
      }
    } catch (error) {
      console.error('Error checking game completion:', error);
    }
  };

  const getCellStyles = (rowIndex: number, colIndex: number) => {
    const isPartOfFoundWord = Object.values(wordPaths).some(({ path }) =>
      path.some(([r, c]) => r === rowIndex && c === colIndex)
    );
    
    if (isPartOfFoundWord) {
      return 'game-cell found-word';
    }
    
    if (currentPath.some(([r, c]) => r === rowIndex && c === colIndex)) {
      return 'game-cell current-path';
    }
    
    return 'game-cell';
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  const handleRemoveWord = (wordToRemove: string) => {
    setFoundWords(prev => prev.filter(word => word !== wordToRemove));
    setWordPaths(prev => {
      const newPaths = { ...prev };
      delete newPaths[wordToRemove];
      return newPaths;
    });
    // Check completion after removing a word
    checkGameCompletion(foundWords.filter(word => word !== wordToRemove));
  };

  return (
    <div className="game-outer-container">
      <GameTitle />
      <div className="game-container">
        <div className="game-card">
          <div className="game-grid-container">
              <div className="game-grid">
                {grid.map((row, rowIndex) => (
                  row.map((letter, colIndex) => (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      className={getCellStyles(rowIndex, colIndex)}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      type="button"
                    >
                      {letter}
                    </button>
                  ))
                ))}
              </div>

            <div className="game-controls">
              <div className="flex-col gap-2">
                <div className="word-input">
                  <p className="current-word">
                    {getWord(currentPath) || 'Valitut kirjaimet ...'}
                  </p>
                  <button 
                    onClick={handleConnect}
                    disabled={currentPath.length === 0}
                    className="connect-button"
                  >
                    Yhdistä
                  </button>
                </div>

                {error && (
                  <div className="error-message">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                {isComplete && (
                  <div className="congratulations-message">
                    <p>Onneksi olkoon! Löysit kaikki sanat! 🎉</p>
                  </div>
                )}
              </div>

              <div className="found-words-section">
                <p className="section-title">Löydetyt sanat</p>
                <div className="found-words-container">
                  {foundWords.map(word => (
                    <div 
                      key={word} 
                      className="word-tag"
                      onClick={() => handleRemoveWord(word)}
                      style={{ cursor: 'pointer' }}
                    >
                      {word} ×
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="how-to-play">
                <p className="section-title">Ohjeet</p>
                <ul className="instructions-list">
                  <li>Etsi sanat napauttamalla vierekkäisiä kirjamia.</li>
                  <li>Voit valita kirjaimia pysty- ja vaakasuunnassa sekä viistoon kulmien suuntaisesti.</li>
                  <li>Muodosta sana painamalla Yhdistä.</li>
                  <li>Poista kirjain tai sana napauttamalla sitä uudelleen.</li>
                  <li>Peli on ratkennut, kun saat kaikki kirjaimet yhdistettyä sanoiksi.</li>
                  <li>Voit poistaa löydetyn sanan klikkaamalla sitä.</li>
                  <li>Jos keksit ratkaisun - onnittelut! Älä kuitenkaan spoilaa yllätystä muille ❤️.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordSnake;