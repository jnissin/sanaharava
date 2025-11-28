/**
 * Player Info Display
 * 
 * Simple inline component showing player name with token copy functionality.
 * No modals - just icons and tooltips for a clean UI.
 */

'use client';

import React, { useState } from 'react';
import { Copy, Check, LogOut } from 'lucide-react';
import { getLocalPlayer, logoutPlayer } from '@/lib/player-auth';

interface PlayerInfoProps {
  onLogout?: () => void;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ onLogout }) => {
  const [tokenCopied, setTokenCopied] = useState(false);
  const player = getLocalPlayer();

  if (!player) {
    return null;
  }

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(player.token);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy token:', err);
    }
  };

  const handleLogout = () => {
    if (confirm(`Haluatko kirjautua ulos? Tarvitset tunnuksen kirjautuaksesi uudelleen.`)) {
      logoutPlayer();
      if (onLogout) {
        onLogout();
      }
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm">
      <span className="font-medium text-gray-700">{player.playerName}</span>
      
      <button
        onClick={handleCopyToken}
        className="p-1 hover:bg-gray-200 rounded transition-colors"
        title="Kopioi tunnus"
        aria-label="Kopioi tunnus"
      >
        {tokenCopied ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Copy className="w-4 h-4 text-gray-600" />
        )}
      </button>

      <button
        onClick={handleLogout}
        className="p-1 hover:bg-gray-200 rounded transition-colors"
        title="Kirjaudu ulos"
        aria-label="Kirjaudu ulos"
      >
        <LogOut className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );
};

export default PlayerInfo;

