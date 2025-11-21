/**
 * Player Authentication Modal
 * 
 * Simple UI for registering or logging in with a player name.
 * Shows token for copying after successful registration.
 */

'use client';

import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { registerPlayer, loginPlayer } from '@/lib/player-auth';
import type { PlayerData } from '@/lib/player-auth';

interface PlayerAuthProps {
  onSuccess: (player: PlayerData) => void;
  onClose: () => void;
}

const PlayerAuth: React.FC<PlayerAuthProps> = ({ onSuccess, onClose }) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      setError('Syötä nimesi');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const playerData = await registerPlayer(name);
      if (playerData) {
        setNewToken(playerData.token);
        // Don't call onSuccess yet - wait for user to copy token
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rekisteröinti epäonnistui');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!name.trim() || !token.trim()) {
      setError('Syötä sekä nimi että tunnus');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const playerData = await loginPlayer(name, token);
      if (playerData) {
        onSuccess(playerData);
      } else {
        setError('Virheellinen nimi tai tunnus');
      }
    } catch (err) {
      setError('Kirjautuminen epäonnistui');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToken = async () => {
    if (newToken) {
      try {
        await navigator.clipboard.writeText(newToken);
        setTokenCopied(true);
        setTimeout(() => setTokenCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy token:', err);
      }
    }
  };

  const handleContinue = () => {
    if (newToken) {
      const playerData = {
        playerId: crypto.randomUUID(),
        playerName: name,
        token: newToken
      };
      onSuccess(playerData);
    }
  };

  // Show token after successful registration
  if (newToken) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Rekisteröinti onnistui!</h2>
          </div>

          <div className="space-y-4">
            <p className="text-gray-700">
              Tallenna tämä tunnus turvalliseen paikkaan. Tarvitset sitä kirjautuaksesi toisella laitteella.
            </p>

            <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300">
              <div className="flex items-center justify-between">
                <code className="text-sm font-mono break-all">{newToken}</code>
                <button
                  onClick={handleCopyToken}
                  className="ml-2 p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Kopioi tunnus"
                >
                  {tokenCopied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Jatka peliin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'register' ? 'Rekisteröidy' : 'Kirjaudu'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="Sulje"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'register'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Rekisteröidy
            </button>
            <button
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Kirjaudu
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pelaajan nimi
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Anna nimesi"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={20}
              disabled={isLoading}
            />
          </div>

          {mode === 'login' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tunnus
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Liitä tunnuksesi tähän"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                disabled={isLoading}
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={mode === 'register' ? handleRegister : handleLogin}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Odota...' : mode === 'register' ? 'Rekisteröidy' : 'Kirjaudu'}
          </button>

          {mode === 'register' && (
            <p className="text-xs text-gray-600 text-center">
              Saat tunnuksen rekisteröitymisen jälkeen. Tallenna se turvallisesti!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerAuth;

