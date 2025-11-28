/**
 * Highscore Panel Component
 * 
 * Displays real-time highscores for the current game.
 * Shows top 10 players sorted by percentage and completion time.
 * Automatically updates when any player submits a score.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Trophy } from 'lucide-react';
import { listenToHighscores, formatScoreTime } from '@/lib/score-manager';
import type { HighscoreEntry } from '@/lib/score-manager';
import type { PlayerData } from '@/lib/player-auth';

interface HighscorePanelProps {
  gameId: string;
  currentPlayer: PlayerData | null;
  isOpen: boolean;
  onToggle: () => void;
}

const HighscorePanel: React.FC<HighscorePanelProps> = ({
  gameId,
  currentPlayer,
  isOpen,
  onToggle
}) => {
  const [highscores, setHighscores] = useState<HighscoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    
    // Listen to highscores for this game
    const unsubscribe = listenToHighscores(gameId, 10, (scores) => {
      setHighscores(scores);
      setIsLoading(false);
    });

    // Cleanup listener on unmount or gameId change
    return () => unsubscribe();
  }, [gameId]);

  const getRankEmoji = (rank: number): string => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  const getRankDisplay = (rank: number): string => {
    const emoji = getRankEmoji(rank);
    return emoji ? emoji : `#${rank}`;
  };

  return (
    <div className="highscore-panel">
      {/* Header / Toggle Button */}
      <button
        onClick={onToggle}
        className="highscore-header"
        aria-label={isOpen ? 'Sulje tulokset' : 'Avaa tulokset'}
      >
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          <span className="font-semibold">Tulokset</span>
          {!isOpen && highscores.length > 0 && (
            <span className="text-sm text-gray-500">({highscores.length})</span>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
      </button>

      {/* Highscore List */}
      {isOpen && (
        <div className="highscore-list">
          {isLoading ? (
            <div className="highscore-empty">
              <p>Ladataan...</p>
            </div>
          ) : highscores.length === 0 ? (
            <div className="highscore-empty">
              <p>Ei vielä tuloksia</p>
              <p className="text-sm text-gray-500 mt-1">
                Ole ensimmäinen!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {highscores.map((score) => {
                const isCurrentPlayer = currentPlayer?.playerId === score.playerId;
                const timeStr = formatScoreTime(score);

                return (
                  <div
                    key={score.playerId}
                    className={`highscore-entry ${isCurrentPlayer ? 'is-current-player' : ''}`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="highscore-rank">
                        {getRankDisplay(score.rank)}
                      </span>
                      <span className="highscore-name">
                        {score.playerName}
                        {isCurrentPlayer && (
                          <span className="text-xs ml-1 text-blue-600">(sinä)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="highscore-percentage">
                        {score.percentage}%
                      </span>
                      {timeStr && (
                        <span className="highscore-time">
                          {timeStr}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HighscorePanel;

