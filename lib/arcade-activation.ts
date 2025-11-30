/**
 * Arcade Theme Activation Hook
 * 
 * Activates/deactivates the arcade theme easter egg when the title is tapped 
 * 7 times within 3 seconds. Works on both desktop (click) and mobile (tap).
 */

import { useState, useCallback, useRef, useEffect } from 'react';

const REQUIRED_TAPS = 7;
const TIMEOUT_MS = 3000;

interface UseArcadeActivationReturn {
  isArcadeTheme: boolean;
  handleTitleTap: () => void;
  flashActive: boolean;
}

export function useArcadeActivation(): UseArcadeActivationReturn {
  const [isArcadeTheme, setIsArcadeTheme] = useState(false);
  const [flashActive, setFlashActive] = useState(false);
  const tapCountRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('arcadeThemeActive');
    if (stored === 'true') {
      setIsArcadeTheme(true);
    }
  }, []);

  const triggerFlash = useCallback(() => {
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 100);
  }, []);

  const handleTitleTap = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Trigger flash effect
    triggerFlash();

    // Increment tap count
    tapCountRef.current += 1;

    // Check if we've reached the required taps
    if (tapCountRef.current >= REQUIRED_TAPS) {
      // Toggle the theme
      const newState = !isArcadeTheme;
      setIsArcadeTheme(newState);
      tapCountRef.current = 0;
      
      // Store in sessionStorage
      if (newState) {
        sessionStorage.setItem('arcadeThemeActive', 'true');
      } else {
        sessionStorage.removeItem('arcadeThemeActive');
      }
    } else {
      // Reset after timeout
      timeoutRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, TIMEOUT_MS);
    }
  }, [isArcadeTheme, triggerFlash]);

  return {
    isArcadeTheme,
    handleTitleTap,
    flashActive,
  };
}
