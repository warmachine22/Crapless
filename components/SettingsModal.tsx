
import React, { useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bankroll: number, minBet: number) => void;
  currentBankroll: number;
  currentMinBet: number;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentBankroll, currentMinBet }) => {
  const [bankroll, setBankroll] = useState(currentBankroll.toString());
  const [minBet, setMinBet] = useState(currentMinBet.toString());

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    const newBankroll = parseInt(bankroll, 10);
    const newMinBet = parseInt(minBet, 10);

    if (isNaN(newBankroll) || newBankroll < 0) {
      alert("Please enter a valid, non-negative bankroll amount.");
      return;
    }
    if (isNaN(newMinBet) || newMinBet <= 0) {
      alert("Please enter a valid, positive minimum bet amount.");
      return;
    }

    onSave(newBankroll, newMinBet);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-craps-green-dark p-8 rounded-lg shadow-2xl border-2 border-craps-gold w-full max-w-md">
        <h2 className="text-3xl font-bold text-craps-gold mb-6 text-center">Game Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="bankroll" className="block text-sm font-medium text-gray-300 mb-1">
              Starting Bankroll
            </label>
            <input
              type="number"
              id="bankroll"
              value={bankroll}
              onChange={(e) => setBankroll(e.target.value)}
              className="w-full bg-gray-800 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-craps-gold focus:outline-none"
              placeholder="e.g., 1000"
            />
          </div>
          <div>
            <label htmlFor="minBet" className="block text-sm font-medium text-gray-300 mb-1">
              Minimum Pass Line Bet
            </label>
            <input
              type="number"
              id="minBet"
              value={minBet}
              onChange={(e) => setMinBet(e.target.value)}
              className="w-full bg-gray-800 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-craps-gold focus:outline-none"
              placeholder="e.g., 5"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-between space-x-4">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white font-bold py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="w-full bg-craps-gold text-craps-green-dark font-bold py-3 rounded-lg hover:bg-yellow-300 transition-colors"
          >
            Save & Restart
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
