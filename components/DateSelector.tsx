import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateSelectorProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  availableDates: string[];
}

const DateSelector = ({ currentDate, onDateChange, availableDates }: DateSelectorProps) => {
  const getCurrentDateIndex = () => {
    return availableDates.indexOf(currentDate);
  };

  const handlePreviousDay = () => {
    const currentIndex = getCurrentDateIndex();
    if (currentIndex > 0) {
      onDateChange(availableDates[currentIndex - 1]);
    }
  };

  const handleNextDay = () => {
    const currentIndex = getCurrentDateIndex();
    if (currentIndex < availableDates.length - 1) {
      onDateChange(availableDates[currentIndex + 1]);
    }
  };

  if (!availableDates.length) {
    return <div className="date-selector">Loading...</div>;
  }

  return (
    <div className="date-selector">
      <button
        onClick={handlePreviousDay}
        className="date-nav-button"
        disabled={getCurrentDateIndex() <= 0}
        aria-label="Previous day"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="date-display">
        {new Date(currentDate).toLocaleDateString('fi-FI', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })}
      </span>
      <button
        onClick={handleNextDay}
        className="date-nav-button"
        disabled={getCurrentDateIndex() >= availableDates.length - 1}
        aria-label="Next day"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default DateSelector;