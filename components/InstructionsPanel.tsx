/**
 * Instructions Panel Component
 * 
 * Displays game instructions in a collapsible panel.
 * Helps keep the UI clean while providing access to help when needed.
 */

'use client';

import React from 'react';
import { ChevronRight, ChevronDown, HelpCircle } from 'lucide-react';

interface InstructionsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

const InstructionsPanel: React.FC<InstructionsPanelProps> = ({
  isOpen,
  onToggle
}) => {
  return (
    <div className="highscore-panel">
      <button
        onClick={onToggle}
        className="highscore-header"
        aria-label={isOpen ? 'Piilota ohjeet' : 'Näytä ohjeet'}
      >
        <div className="flex items-center gap-2">
          <HelpCircle size={18} />
          <span className="font-semibold">Ohjeet</span>
        </div>
        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>
      
      {isOpen && (
        <div className="p-4">
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
      )}
    </div>
  );
};

export default InstructionsPanel;

