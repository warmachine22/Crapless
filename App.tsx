
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Dice from './components/Dice';
import BettingSpot from './components/BettingSpot';
import SettingsModal from './components/SettingsModal';
import { CHIP_VALUES, ODDS_PAYOUTS, PLACE_PAYOUTS, STARTING_BANKROLL } from './constants';
import type { GameState, PointNumber, Bets, BetKey, PlaceNumber } from './types';
import { PLACE_NUMBERS } from './types';
import { getRandomDieRoll } from './utils';

const Chip: React.FC<{ value: number; onSelect: (value: number) => void; isSelected: boolean }> = ({ value, onSelect, isSelected }) => {
    const colors: { [key: number]: string } = {
        1: 'bg-gray-200 text-black border-2 border-gray-500',
        5: 'bg-chip-red text-white',
        10: 'bg-chip-blue text-white',
        25: 'bg-chip-green text-white',
        100: 'bg-chip-black text-white'
    };
    const selectedClasses = isSelected ? 'ring-4 ring-craps-gold' : 'ring-2 ring-white/50';

    return (
        <button onClick={() => onSelect(value)} className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl shadow-lg transition-transform hover:scale-110 ${colors[value]} ${selectedClasses}`}>
            ${value}
        </button>
    );
};

interface LastResult {
  text: string;
  amount: number;
  type: 'win' | 'loss' | 'info' | 'roll';
}

export default function App() {
  const [bankroll, setBankroll] = useState<number>(STARTING_BANKROLL);
  const [gameState, setGameState] = useState<GameState>('COME_OUT');
  const [point, setPoint] = useState<PointNumber | null>(null);
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [bets, setBets] = useState<Bets>({});
  const [lastResult, setLastResult] = useState<LastResult | null>({text: "Welcome! Place a Pass Line bet.", amount: 0, type: 'info'});
  const [selectedChip, setSelectedChip] = useState<number>(5);
  const [rolling, setRolling] = useState(false);
  const [rollHistory, setRollHistory] = useState<{ roll: number; type: 'win' | 'loss' | 'neutral' }[]>([]);
  const [minBet, setMinBet] = useState<number>(5);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [arePlaceBetsWorking, setArePlaceBetsWorking] = useState(false);
  
  useEffect(() => {
    // Place bets are off on come out, on when point is established
    setArePlaceBetsWorking(gameState === 'POINT_ON');
  }, [gameState]);

  // Fix: Correctly handle `val` which may be of type `unknown` by explicitly converting it to a number.
  const totalBetAmount = useMemo(() => Object.values(bets).reduce((sum: number, val) => sum + (Number(val) || 0), 0), [bets]);

  const rollProbabilities = useMemo(() => {
    if (totalBetAmount === 0) {
        return { win: 0, loss: 0 };
    }
    const WAYS_TO_ROLL: Record<number, number> = {
        2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6,
        8: 5, 9: 4, 10: 3, 11: 2, 12: 1
    };

    let winningCombinations = 0;
    let losingCombinations = 0;

    for (let total = 2; total <= 12; total++) {
        const ways = WAYS_TO_ROLL[total];
        let netWinLoss = 0;

        const passLineBet = bets.passLine || 0;
        const oddsBet = bets.odds || 0;

        if (gameState === 'COME_OUT') {
            if (total === 7) {
                netWinLoss += passLineBet; // Pass line wins, place bets are off
            }
            // On come out, place bets don't win or lose, a point is just set.
        } else { // POINT_ON
            let loss = 0;
            if (total === 7) {
                loss += passLineBet + oddsBet;
                if (arePlaceBetsWorking) {
                    PLACE_NUMBERS.forEach(num => {
                        loss += bets[`place${num}`] || 0;
                    });
                }
                netWinLoss -= loss;
            } else if (total === point) {
                netWinLoss += passLineBet;
                if (oddsBet && point) {
                    const oddsPayout = ODDS_PAYOUTS[point];
                    netWinLoss += oddsBet * oddsPayout.n / oddsPayout.d;
                }
                if (arePlaceBetsWorking) {
                    const placeBetKey = `place${total as PlaceNumber}`;
                    if (bets[placeBetKey]) {
                        const payout = PLACE_PAYOUTS[total as PlaceNumber];
                        netWinLoss += (bets[placeBetKey] || 0) * payout.n / payout.d;
                    }
                }
            } else {
                 if (arePlaceBetsWorking) {
                    const placeBetKey = `place${total as PlaceNumber}`;
                    if (bets[placeBetKey]) {
                        const payout = PLACE_PAYOUTS[total as PlaceNumber];
                        netWinLoss += (bets[placeBetKey] || 0) * payout.n / payout.d;
                    }
                }
            }
        }

        if (netWinLoss > 0) {
            winningCombinations += ways;
        } else if (netWinLoss < 0) {
            losingCombinations += ways;
        }
    }

    return {
        win: (winningCombinations / 36) * 100,
        loss: (losingCombinations / 36) * 100
    };
}, [bets, gameState, point, totalBetAmount, arePlaceBetsWorking]);

  const sevenFrequency = useMemo(() => {
    if (rollHistory.length === 0) {
        return 0;
    }
    const sevenCount = rollHistory.filter(item => item.roll === 7).length;
    return (sevenCount / rollHistory.length) * 100;
  }, [rollHistory]);

  const handleBet = (betKey: BetKey) => {
    if (rolling) return;
    if (bankroll < selectedChip) {
      setLastResult({ text: "Not enough bankroll for this bet.", amount: 0, type: 'info' });
      return;
    }
    
    if (betKey === 'passLine' && gameState !== 'COME_OUT') {
        setLastResult({ text: "Pass Line bets only on come-out.", amount: 0, type: 'info' });
        return;
    }

    if (betKey === 'odds') {
        if (gameState !== 'POINT_ON') {
            setLastResult({ text: "Can only place Odds when a point is ON.", amount: 0, type: 'info' });
            return;
        }
        const passLineBet = bets.passLine || 0;
        if (passLineBet === 0) {
            setLastResult({ text: "Must have a Pass Line bet to place Odds.", amount: 0, type: 'info' });
            return;
        }
        const currentOddsBet = bets.odds || 0;
        if(currentOddsBet + selectedChip > passLineBet * 2) {
            setLastResult({ text: `Odds cannot exceed 2x Pass Line ($${passLineBet * 2}).`, amount: 0, type: 'info' });
            return;
        }
    }
    setBets(prev => ({
        ...prev,
        [betKey]: (prev[betKey] || 0) + selectedChip,
    }));
    setBankroll(prev => prev - selectedChip);
  };
  
  const removeBet = (e: React.MouseEvent, betKey: BetKey) => {
    e.preventDefault();
    if (rolling) return;

    if (betKey === 'passLine' && gameState === 'POINT_ON') {
        setLastResult({ text: "Cannot remove Pass Line bet while point is ON.", amount: 0, type: 'info' });
        return;
    }

    const betAmount = bets[betKey];
    if (betAmount) {
      setBankroll(prev => prev + betAmount);
      setBets(prev => {
        const newBets = { ...prev };
        delete newBets[betKey];
        return newBets;
      });
    }
  };

  const handleClearBets = () => {
    if (rolling) return;
    
    let amountToReturn = 0;
    const betsToKeep: Bets = {};

    if (gameState === 'POINT_ON') {
        if (bets.passLine) betsToKeep.passLine = bets.passLine;
        if (bets.odds) betsToKeep.odds = bets.odds;
    }

    const currentBets = { ...bets };
    Object.keys(betsToKeep).forEach(key => {
        delete (currentBets as any)[key]
    });

    // Fix: Correctly handle `val` which may be of type `unknown` by explicitly converting it to a number. This resolves multiple type errors on this line.
    amountToReturn = Object.values(currentBets).reduce((sum: number, val) => sum + (Number(val) || 0), 0);

    if (amountToReturn > 0) {
        setBankroll(prev => prev + amountToReturn);
        setBets(betsToKeep);
        setLastResult({ text: 'Cleared place bets.', amount: 0, type: 'info' });
    }
}
  const resetGame = (newBankroll: number = STARTING_BANKROLL) => {
    setBankroll(newBankroll);
    setGameState('COME_OUT');
    setPoint(null);
    setBets({});
    setLastResult({text: "Table reset. Place a Pass Line bet.", amount: 0, type: 'info'});
    setRollHistory([]);
  };

  const handleSaveSettings = (newBankroll: number, newMinBet: number) => {
    setMinBet(newMinBet);
    resetGame(newBankroll);
    setIsSettingsModalOpen(false);
  };

  const resetForNewRound = () => {
    setGameState('COME_OUT');
    setPoint(null);
    const betsToClear = { ...bets };
    delete betsToClear.passLine;
    delete betsToClear.odds;
    setBets(betsToClear);
  };

  const handleRoll = useCallback(() => {
    if(gameState === 'COME_OUT' && (bets.passLine || 0) < minBet) {
        setLastResult({ text: `Pass Line bet must be at least $${minBet}.`, amount: 0, type: 'info' });
        return;
    }
    setRolling(true);

    setTimeout(() => {
        const d1 = getRandomDieRoll();
        const d2 = getRandomDieRoll();
        const total = d1 + d2;
        setDice([d1, d2]);

        let winAmount = 0;
        let lossAmount = 0;
        let betsToReturnOnWin = 0;
        let roundEnded = false;
        let message = '';
        let messageType: LastResult['type'] = 'roll';

        if (gameState === 'COME_OUT') {
            if (total === 7) {
                winAmount = bets.passLine || 0;
                betsToReturnOnWin = bets.passLine || 0;
                message = 'Winner 7!';
                messageType = 'win';
                // round does not end, it's just a win and new come out
                 setBankroll(prev => prev + winAmount + betsToReturnOnWin);
                 setBets(prev => {
                     const newBets = {...prev};
                     delete newBets.passLine;
                     return newBets;
                 })
                 setLastResult({ text: message, amount: winAmount, type: 'win' });

            } else {
                const newPoint = total as PointNumber;
                let newBetsState = { ...bets };
                let bankrollAdjustment = 0;
                message = `Point is ${total}`;
                messageType = 'info';

                // Handle Place Bet on New Point
                const placeBetOnPointKey: BetKey = `place${newPoint}`;
                const placeBetAmountOnPoint = newBetsState[placeBetOnPointKey];

                if (placeBetAmountOnPoint && placeBetAmountOnPoint > 0) {
                    const movePriority: PlaceNumber[] = [6, 8, 5, 9, 4, 10, 3, 11, 2, 12];
                    let targetNumber: PlaceNumber | null = null;
                    
                    for (const num of movePriority) {
                        if (num !== newPoint && !newBetsState[`place${num}`]) {
                            targetNumber = num;
                            break;
                        }
                    }

                    delete newBetsState[placeBetOnPointKey];

                    if (targetNumber) {
                        newBetsState[`place${targetNumber}`] = placeBetAmountOnPoint;
                        message += `. Bet moved to ${targetNumber}.`;
                    } else {
                        bankrollAdjustment = placeBetAmountOnPoint;
                        message += `. Bet returned.`;
                    }
                }

                if (bankrollAdjustment > 0) {
                    setBankroll(prev => prev + bankrollAdjustment);
                }
                setBets(newBetsState);
                setPoint(newPoint);
                setGameState('POINT_ON');
            }
        } else { // POINT_ON
            if (total === point) {
                // Pass Line win
                winAmount += bets.passLine || 0;
                // Odds win
                if (bets.odds && point) {
                    const oddsPayout = ODDS_PAYOUTS[point];
                    winAmount += (bets.odds || 0) * oddsPayout.n / oddsPayout.d;
                }
                // Place bets also win on a point hit if it's their number and they are working
                if (arePlaceBetsWorking) {
                    const placeBetKey = `place${total as PlaceNumber}`;
                    if (bets[placeBetKey]) {
                        const bet = bets[placeBetKey] as number;
                        const placePayout = PLACE_PAYOUTS[total as PlaceNumber];
                        winAmount += bet * placePayout.n / placePayout.d;
                    }
                }
                
                betsToReturnOnWin = totalBetAmount;
                message = 'Point Hit!';
                messageType = 'win';
                roundEnded = true;
            } else if (total === 7) {
                lossAmount = (bets.passLine || 0) + (bets.odds || 0);
                let returnedBets = 0;
                if(arePlaceBetsWorking) {
                     PLACE_NUMBERS.forEach(num => {
                        lossAmount += bets[`place${num}`] || 0;
                    });
                } else {
                    PLACE_NUMBERS.forEach(num => {
                        returnedBets += bets[`place${num}`] || 0;
                    });
                }
                setBankroll(prev => prev + returnedBets);
                message = 'Seven Out';
                messageType = 'loss';
                roundEnded = true;
            } else {
                // Check for place bet win if no decision roll
                if (arePlaceBetsWorking && (PLACE_NUMBERS as readonly number[]).includes(total)) {
                    const placeBetKey = `place${total as PlaceNumber}`;
                    if (bets[placeBetKey]) {
                        const bet = bets[placeBetKey];
                        const placePayout = PLACE_PAYOUTS[total as PlaceNumber];
                        const placeWin = bet * placePayout.n / placePayout.d;
                        winAmount += placeWin;
                        setBankroll(prev => prev + placeWin); // Pay win immediately
                        message = `Place ${total} Wins`;
                        messageType = 'win';
                    }
                }
            }
        }
        
        const historyType: 'win' | 'loss' | 'neutral' = messageType === 'win' ? 'win' : messageType === 'loss' ? 'loss' : 'neutral';
        const newHistoryEntry = { roll: total, type: historyType };
        setRollHistory(prev => [...prev, newHistoryEntry].slice(-25));

        // --- Final State Updates ---
        if (roundEnded) {
            if (winAmount > 0) {
                setBankroll(prev => prev + winAmount + betsToReturnOnWin);
                setLastResult({ text: message, amount: winAmount, type: 'win' });
            } else if (lossAmount > 0) {
                setLastResult({ text: message, amount: lossAmount, type: 'loss' });
            }
            resetForNewRound();
        } else if (gameState !== 'COME_OUT') { // Avoid double-messaging on come out 7
            // Mid-round update (place win or just a roll)
            if(winAmount > 0) { // This handles the immediate payout of a place bet
                 setLastResult({ text: message, amount: winAmount, type: 'win' });
            } else {
                setLastResult({ text: message || `Rolled ${total}`, amount: 0, type: messageType });
            }
        } else if (gameState === 'COME_OUT' && total !== 7) {
             setLastResult({ text: message || `Rolled ${total}`, amount: 0, type: messageType });
        }
        
        setRolling(false);
    }, 500);
  }, [gameState, bets, bankroll, point, totalBetAmount, minBet, arePlaceBetsWorking]);

  const buttonBaseClasses = "font-bold text-lg px-6 py-3 rounded-lg shadow-lg transition-all transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:scale-100 w-full sm:w-auto";

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 font-sans" onContextMenu={(e) => e.preventDefault()}>
       <SettingsModal 
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            onSave={handleSaveSettings}
            currentBankroll={bankroll}
            currentMinBet={minBet}
        />
      <div className="w-full max-w-7xl mx-auto bg-craps-green shadow-2xl rounded-3xl border-8 border-craps-rail overflow-hidden relative">
        
        {/* Header */}
        <header className="bg-craps-green-dark p-4 flex justify-between items-center border-b-4 border-craps-rail">
          <h1 className="text-3xl font-bold text-craps-gold tracking-widest uppercase">Crapless Craps</h1>
          <div className="flex items-center space-x-4">
             <div className="text-right">
                <div className="text-lg text-gray-300">Win Chance</div>
                <div className="text-2xl font-mono font-bold text-green-400">{rollProbabilities.win.toFixed(2)}%</div>
            </div>
            <div className="text-right">
                <div className="text-lg text-gray-300">Loss Chance</div>
                <div className="text-2xl font-mono font-bold text-red-400">{rollProbabilities.loss.toFixed(2)}%</div>
            </div>
            <div className="text-right">
                <div className="text-lg text-gray-300">Min Bet</div>
                <div className="text-2xl font-mono font-bold text-white">{minBet.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}</div>
            </div>
             <div className="text-right">
                <div className="text-lg text-gray-300">Bankroll</div>
                <div className="text-2xl font-mono font-bold text-green-300">{bankroll.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</div>
             </div>
             <button 
                onClick={() => setIsSettingsModalOpen(true)}
                className="bg-craps-gold text-craps-green-dark font-bold px-6 py-3 rounded-lg hover:bg-yellow-300 transition-colors text-lg shadow-md"
            >
                Restart
            </button>
          </div>
        </header>

        {/* Game Area */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Panel: Dice & Result */}
          <div className="md:col-span-1 space-y-4 flex flex-col">
              <div className="bg-craps-green-dark p-4 rounded-lg flex-grow">
                  <div className="flex justify-between items-center mb-2">
                      <h2 className="text-xl font-semibold text-craps-gold">The Roll</h2>
                      {point && <div className="px-4 py-2 bg-red-700 rounded-full text-white font-bold text-lg animate-pulse">POINT: {point}</div>}
                  </div>
                  <Dice values={dice} rolling={rolling} />
              </div>
              <div className="bg-craps-green-dark p-4 rounded-lg flex-grow min-h-[200px] flex flex-col justify-center items-center text-center">
                <h2 className="text-xl font-semibold text-craps-gold mb-4">Last Result</h2>
                {lastResult ? (
                    <div>
                        <p className="text-2xl font-bold text-white">{lastResult.text}</p>
                        {lastResult.amount > 0 && (
                            <p className={`text-4xl font-mono font-bold mt-2 ${lastResult.type === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                                {lastResult.type === 'win' ? '+' : '-'}{lastResult.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-gray-400">Roll the dice to begin.</p>
                )}
              </div>
          </div>

          {/* Center Panel: Betting Table */}
          <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-5 gap-2">
                  {PLACE_NUMBERS.map(num => (
                      <BettingSpot
                          key={num}
                          label={num.toString()}
                          subLabel={`${PLACE_PAYOUTS[num].n} to ${PLACE_PAYOUTS[num].d}`}
                          betAmount={bets[`place${num}`] || 0}
                          onClick={() => handleBet(`place${num}`)}
                          onRightClick={(e) => removeBet(e, `place${num}`)}
                          isActive={!rolling}
                          isPoint={point === num}
                          isWorking={arePlaceBetsWorking}
                      />
                  ))}
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4">
                 <BettingSpot
                    label="PASS LINE"
                    betAmount={bets.passLine || 0}
                    onClick={() => handleBet('passLine')}
                    onRightClick={(e) => removeBet(e, 'passLine')}
                    isActive={gameState === 'COME_OUT' && !rolling}
                    className="col-span-2"
                />
                <BettingSpot
                    label="ODDS"
                    subLabel="Up to 2X"
                    betAmount={bets.odds || 0}
                    onClick={() => handleBet('odds')}
                    onRightClick={(e) => removeBet(e, 'odds')}
                    isActive={gameState === 'POINT_ON' && !rolling}
                    className="col-span-2"
                 />
              </div>
          </div>
           {/* Roll History */}
            <div className="md:col-span-3 mt-2 -mb-2">
                <div className="w-full bg-craps-green-dark/50 rounded p-2 flex justify-between items-center overflow-hidden h-10 font-mono text-sm">
                    <div className="pl-2">
                        <span className="text-gray-300">7 Freq: </span>
                        <span className="font-bold text-red-400">{sevenFrequency.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center space-x-3 pr-2">
                        {rollHistory.map((item, index) => (
                            <span key={index} className={
                                item.type === 'win' ? 'text-green-400 font-bold' :
                                item.type === 'loss' ? 'text-red-400 font-bold' :
                                'text-gray-400'
                            }>
                                {item.roll}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Footer: Controls */}
        <footer className="bg-craps-green-dark p-4 flex flex-col md:flex-row justify-between items-center border-t-4 border-craps-rail gap-4 md:gap-x-6">
            <div className="flex items-center space-x-3">
                <span className="font-bold text-lg text-gray-300 mr-2">Bet Amount:</span>
                {CHIP_VALUES.map(val => (
                   <Chip key={val} value={val} onSelect={setSelectedChip} isSelected={selectedChip === val} />
                ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                 <button
                    onClick={() => setArePlaceBetsWorking(prev => !prev)}
                    disabled={gameState !== 'POINT_ON' || rolling}
                    className={`${buttonBaseClasses} bg-gray-600 text-white hover:bg-gray-700`}
                >
                    {arePlaceBetsWorking ? 'Turn Bets OFF' : 'Turn Bets ON'}
                </button>
                <button
                    onClick={handleClearBets}
                    disabled={rolling || totalBetAmount === 0}
                    className={`${buttonBaseClasses} bg-chip-red text-white hover:bg-red-700`}
                >
                    Clear Bets
                </button>
                <button 
                    onClick={handleRoll} 
                    disabled={rolling}
                    className={`${buttonBaseClasses} bg-craps-gold text-craps-green-dark hover:bg-yellow-300`}
                >
                    {rolling ? 'Rolling...' : 'ROLL DICE'}
                </button>
            </div>
        </footer>
      </div>
    </div>
  );
}
