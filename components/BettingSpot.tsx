
import React from 'react';

interface BettingSpotProps {
  label: string;
  betAmount: number;
  onClick: () => void;
  onRightClick: (e: React.MouseEvent) => void;
  isActive: boolean;
  isPoint?: boolean;
  className?: string;
  subLabel?: string;
  isWorking?: boolean;
}

const BettingSpot: React.FC<BettingSpotProps> = ({
  label,
  betAmount,
  onClick,
  onRightClick,
  isActive,
  isPoint = false,
  className = '',
  subLabel = '',
  isWorking = true,
}) => {
  const baseClasses =
    'relative w-full h-24 border-2 rounded-lg flex flex-col items-center justify-center p-2 transition-all duration-200 cursor-pointer';
  const activeClasses = isActive
    ? 'bg-craps-green-dark border-craps-gold hover:bg-opacity-80'
    : 'bg-craps-green-dark/50 border-gray-500 text-gray-400 pointer-events-none';
  const pointClasses = isPoint ? 'ring-4 ring-offset-2 ring-offset-craps-green ring-white shadow-lg' : '';
  const workingClasses = !isWorking && betAmount > 0 ? 'opacity-60' : '';

  return (
    <div
      className={`${baseClasses} ${activeClasses} ${pointClasses} ${className} ${workingClasses}`}
      onClick={onClick}
      onContextMenu={onRightClick}
    >
      <div className="text-xl font-bold text-white tracking-wider">{label}</div>
      {subLabel && <div className="text-xs text-gray-300">{subLabel}</div>}
       {!isWorking && betAmount > 0 && (
          <div className="absolute top-1 right-1 bg-red-800 text-white text-xs font-bold px-2 py-0.5 rounded-full z-10">OFF</div>
      )}
      {betAmount > 0 && (
        <div className="absolute -bottom-4 bg-chip-black text-white rounded-full h-10 w-10 flex items-center justify-center text-sm font-bold border-2 border-white shadow-md">
          ${betAmount}
        </div>
      )}
    </div>
  );
};

export default BettingSpot;
