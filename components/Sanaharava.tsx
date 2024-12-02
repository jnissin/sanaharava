'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import Image from 'next/image';
import DateSelector from './DateSelector';

interface WordPath {
  path: number[][];
}

interface WordPaths {
  [key: string]: WordPath;
}

const GameTitle = () => {
  return (
    <h1 className="game-title">
      Sanaharava
    </h1>
  );
};

const Sanaharava = () => {
    const [grid, setGrid] = useState<string[][]>([]);
    const [currentPath, setCurrentPath] = useState<number[][]>([]);
    const [wordPaths, setWordPaths] = useState<WordPaths>({});
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [foundWords, setFoundWords] = useState<string[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const [rowCount, setRowCount] = useState<number>(6);
    const [columnCount, setColumnCount] = useState<number>(5);
    const [gameId, setGameId] = useState<string | null>(new Date().toISOString().split("T")[0]);
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const isInitialMount = useRef(true);

    useEffect(() => {
      fetch('/api/game/dates')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.dates.length > 0) {
            setAvailableDates(data.dates);
            // If no gameId is set, use the latest date
            if (!gameId) {
              const latestDate = data.dates[0];
              setGameId(latestDate);
            }
          }
        })
        .catch(error => console.error('Failed to fetch dates:', error));
    }, []); // Run only once on component mount

    useEffect(() => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        
        // Then fetch the game data
        if (gameId) {
          fetch(`/api/game?gameId=${gameId}&rows=${rowCount}&columns=${columnCount}`)
            .then(res => res.json())
            .then(data => {
              setGrid(data.grid);
              setGameId(data.id);
              setIsLoading(false);
              if (foundWords.length > 0) {
                checkGameCompletion(foundWords);
              }
            });
        }
      }
    }, [gameId]);

  const handleDateChange = (newDate: string) => {
    setGameId(newDate);
    setFoundWords([]);
    setWordPaths({});
    setCurrentPath([]);
    setError('');
    setIsComplete(false);
    setIsLoading(true);
    isInitialMount.current = true;
};

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
      const response = await fetch(`/api/game?gameId=${gameId}`, {
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
      const response = await fetch(`/api/game?gameId=${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foundWords: words })
      });
      
      const { isComplete } = await response.json();
      
      if (isComplete) {
        setIsComplete(isComplete);
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
    const updatedFoundWords = foundWords.filter(word => word !== wordToRemove);
    setFoundWords(updatedFoundWords);
    setWordPaths(prev => {
      const newPaths = { ...prev };
      delete newPaths[wordToRemove];
      return newPaths;
    });

    // Reset isComplete to false when removing a word
    // and re-check the completion with updated words
    setIsComplete(false);
    checkGameCompletion(updatedFoundWords);
  };

  const renderWordPaths = () => {
    // Match from .game-cell CSS
    const cellWidth = 50;
    const cellHeight = 50;
    const gap = 8;
    
    const paths = Object.entries(wordPaths).map(([word, { path }]) => {
      const points = path.map(([row, col]) => ({
        x: (col * (cellWidth + gap)) + (cellWidth / 2),
        y: (row * (cellHeight + gap)) + (cellHeight / 2)
      }));

      return (
        <svg
          key={word}
          className="word-path-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          <polyline
            points={points.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth="3"
          />
        </svg>
      );
    });
  
    return paths;
  };
  
  const renderCurrentPath = () => {
    if (currentPath.length < 2) return null;
  
    // Match from .game-cell CSS
    const cellWidth = 50;
    const cellHeight = 50;
    const gap = 8;
    
    const points = currentPath.map(([row, col]) => ({
      x: (col * (cellWidth + gap)) + (cellWidth / 2),
      y: (row * (cellHeight + gap)) + (cellHeight / 2)
    }));  
    
    return (
      <svg
        className="word-path-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      >
        <polyline
          points={points.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth="3"
        />
      </svg>
    );
  };

  return (
    <div className="game-outer-container">
      <GameTitle />
      <div className="game-container">
        <DateSelector 
          currentDate={gameId || new Date().toISOString().split('T')[0]}
          onDateChange={handleDateChange}
          availableDates={availableDates}
        />
        <div className="game-card">
          <div className="game-grid-container">
            <div className="game-grid" style={{ position: 'relative' }}>
                {renderWordPaths()}
                {renderCurrentPath()}
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
                  <li>Sanojen minimipituus on 3 merkkiä.</li>
                  <li>Poista kirjain tai sana napauttamalla sitä uudelleen.</li>
                  <li>Peli on ratkennut, kun saat kaikki kirjaimet yhdistettyä sanoiksi.</li>
                  <li>Voit poistaa löydetyn sanan klikkaamalla sitä.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sanaharava;