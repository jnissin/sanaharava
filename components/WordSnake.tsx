'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
//import '../styles/WordSnake.css';

interface WordPath {
  path: number[][];
}

interface WordPaths {
  [key: string]: WordPath;
}

const GameTitle = () => {
  return (
    <h1 className="text-3xl font-bold text-center text-white mb-8">
      C09 Sanalouhos
    </h1>
  );
};

const WordSnake = () => {
    const [grid, setGrid] = useState<string[][]>([]);
    const [currentPath, setCurrentPath] = useState<number[][]>([]);
    const [foundWords, setFoundWords] = useState<string[]>([]);
    const [wordPaths, setWordPaths] = useState<WordPaths>({});
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/game')
      .then(res => res.json())
      .then(data => {
        setGrid(data.grid);
        setIsLoading(false);
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
        setFoundWords(prev => [...prev, word]);
        setWordPaths(prev => ({
          ...prev,
          [word]: { path: [...currentPath] }
        }));
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

  const getCellStyles = (rowIndex: number, colIndex: number) => {
    const isPartOfFoundWord = Object.values(wordPaths).some(({ path }) =>
      path.some(([r, c]) => r === rowIndex && c === colIndex)
    );
    
    if (isPartOfFoundWord) {
      return {
        backgroundColor: 'rgb(34 197 94)',
        color: 'white'
      };
    }
    
    if (currentPath.some(([r, c]) => r === rowIndex && c === colIndex)) {
      return {
        backgroundColor: 'rgb(59 130 246)',
        color: 'white'
      };
    }
    
    return {
      backgroundColor: 'rgb(31 41 55)',
      color: 'rgb(209 213 219)'
    };
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

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
                      className="game-cell"
                      style={getCellStyles(rowIndex, colIndex)}
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
              </div>
              
              <div className="found-words-section">
                <p className="section-title">Löydetyt sanat</p>
                <div className="found-words-container">
                  {foundWords.map(word => (
                    <div key={word} className="word-tag">
                      {word}
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