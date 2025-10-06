
(function () {
    // --- CONSTANTS ---
    const CHIP_VALUES = [1, 5, 10, 25, 100];
    const STARTING_BANKROLL = 100;
    const PLACE_NUMBERS = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12];
    const ODDS_PAYOUTS = {
        2: { n: 6, d: 1 }, 12: { n: 6, d: 1 }, 3: { n: 3, d: 1 }, 11: { n: 3, d: 1 },
        4: { n: 2, d: 1 }, 10: { n: 2, d: 1 }, 5: { n: 3, d: 2 }, 9: { n: 3, d: 2 },
        6: { n: 6, d: 5 }, 8: { n: 6, d: 5 },
    };
    const PLACE_PAYOUTS = {
        2: { n: 11, d: 2 }, 12: { n: 11, d: 2 }, 3: { n: 11, d: 4 }, 11: { n: 11, d: 4 },
        4: { n: 9, d: 5 }, 10: { n: 9, d: 5 }, 5: { n: 7, d: 5 }, 9: { n: 7, d: 5 },
        6: { n: 7, d: 6 }, 8: { n: 7, d: 6 },
    };

    // --- STATE ---
    let bankroll = STARTING_BANKROLL;
    let gameState = 'COME_OUT';
    let point = null;
    let dice = [1, 1];
    let bets = {};
    let selectedChip = 5;
    let rolling = false;
    let rollHistory = [];
    let minBet = 5;
    let arePlaceBetsWorking = false;

    // --- DOM ELEMENTS ---
    const DOMElements = {
        bankrollDisplay: document.getElementById('bankroll-display'),
        minBetDisplay: document.getElementById('min-bet-display'),
        winChance: document.getElementById('win-chance'),
        lossChance: document.getElementById('loss-chance'),
        pointDisplay: document.getElementById('point-display'),
        lastResultText: document.getElementById('last-result-text'),
        lastResultAmount: document.getElementById('last-result-amount'),
        rollHistoryContainer: document.getElementById('roll-history-container'),
        sevenFreq: document.getElementById('seven-freq'),
        chipContainer: document.getElementById('chip-container'),
        placeBetsContainer: document.getElementById('place-bets-container'),
        passOddsContainer: document.getElementById('pass-odds-container'),
        die1: document.getElementById('die-1'),
        die2: document.getElementById('die-2'),
        rollButton: document.getElementById('roll-button'),
        clearBetsButton: document.getElementById('clear-bets-button'),
        toggleBetsButton: document.getElementById('toggle-bets-button'),
        restartButton: document.getElementById('restart-button'),
        settingsModal: document.getElementById('settings-modal'),
        modalCancelButton: document.getElementById('modal-cancel-button'),
        modalSaveButton: document.getElementById('modal-save-button'),
        bankrollInput: document.getElementById('bankroll-input'),
        minBetInput: document.getElementById('min-bet-input'),
    };

    // --- UTILS ---
    function getRandomDieRoll() {
        const randomBuffer = new Uint32Array(1);
        window.crypto.getRandomValues(randomBuffer);
        return (randomBuffer[0] % 6) + 1;
    }

    function formatCurrency(amount, fractions = 2) {
        return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: fractions });
    }

    // --- UI RENDERING ---
    function createBettingSpot(label, subLabel = '', betKey, classes = '') {
        const spot = document.createElement('div');
        spot.className = `betting-spot ${classes}`;
        spot.dataset.betKey = betKey;

        const innerDiv = document.createElement('div');
        innerDiv.className = 'relative w-full h-24 border-2 rounded-lg flex flex-col items-center justify-center p-2 transition-all duration-200 cursor-pointer';

        innerDiv.innerHTML = `
            <div class="spot-label text-xl font-bold text-white tracking-wider">${label}</div>
            ${subLabel ? `<div class="spot-sublabel text-xs text-gray-300">${subLabel}</div>` : ''}
            <div class="spot-off-tag hidden absolute top-1 right-1 bg-red-800 text-white text-xs font-bold px-2 py-0.5 rounded-full z-10">OFF</div>
            <div class="spot-bet-amount hidden absolute -bottom-4 bg-chip-black text-white rounded-full h-10 w-10 flex items-center justify-center text-sm font-bold border-2 border-white shadow-md"></div>
        `;
        spot.appendChild(innerDiv);
        return spot;
    }

    function renderDie(element, value) {
        element.innerHTML = '';
        element.className = 'w-20 h-20 bg-white rounded-lg shadow-lg flex items-center justify-center p-2';

        if (rolling) {
            element.classList.add('animate-spin');
            return;
        }

        const pip = '<div class="w-4 h-4 bg-black rounded-full"></div>';

        if (value === 1) { element.classList.add('justify-center'); element.innerHTML = pip; }
        if (value === 2) { element.classList.add('justify-between'); element.innerHTML = `${pip}${pip}`; }
        if (value === 3) { element.classList.add('justify-between'); element.innerHTML = `<div class="self-start">${pip}</div><div class="self-center">${pip}</div><div class="self-end">${pip}</div>`; }
        if (value === 4) { element.innerHTML = `<div class="flex flex-col justify-between h-full w-full"><div class="flex justify-between">${pip}${pip}</div><div class="flex justify-between">${pip}${pip}</div></div>`; }
        if (value === 5) { element.innerHTML = `<div class="flex flex-col justify-between h-full w-full"><div class="flex justify-between">${pip}${pip}</div><div class="flex justify-center">${pip}</div><div class="flex justify-between">${pip}${pip}</div></div>`; }
        if (value === 6) { element.innerHTML = `<div class="flex flex-col justify-between h-full w-full"><div class="flex justify-between">${pip}${pip}</div><div class="flex justify-between">${pip}${pip}</div><div class="flex justify-between">${pip}${pip}</div></div>`; }
    }

    function updateUI() {
        // Header
        DOMElements.bankrollDisplay.textContent = formatCurrency(bankroll);
        DOMElements.minBetDisplay.textContent = formatCurrency(minBet, 0);

        // Point
        if (point) {
            DOMElements.pointDisplay.textContent = `POINT: ${point}`;
            DOMElements.pointDisplay.classList.remove('hidden');
        } else {
            DOMElements.pointDisplay.classList.add('hidden');
        }

        // Dice
        renderDie(DOMElements.die1, dice[0]);
        renderDie(DOMElements.die2, dice[1]);

        // Betting Spots
        document.querySelectorAll('.betting-spot').forEach(spot => {
            const betKey = spot.dataset.betKey;
            const container = spot.querySelector('.relative');
            const betAmountEl = spot.querySelector('.spot-bet-amount');
            const offTag = spot.querySelector('.spot-off-tag');

            const betAmount = bets[betKey] || 0;
            let isActive = !rolling;
            let isWorking = true;

            if (betKey === 'passLine') isActive = gameState === 'COME_OUT' && !rolling;
            if (betKey === 'odds') isActive = gameState === 'POINT_ON' && !rolling;
            if (betKey.startsWith('place')) {
                isWorking = arePlaceBetsWorking;
            }

            container.classList.toggle('bg-craps-green-dark', isActive);
            container.classList.toggle('hover:bg-opacity-80', isActive);
            container.classList.toggle('border-craps-gold', isActive);
            container.classList.toggle('bg-craps-green-dark/50', !isActive);
            container.classList.toggle('border-gray-500', !isActive);
            container.classList.toggle('text-gray-400', !isActive);
            container.classList.toggle('pointer-events-none', !isActive);

            const isPointNumber = point && `place${point}` === betKey;
            container.classList.toggle('ring-4', isPointNumber);
            container.classList.toggle('ring-offset-2', isPointNumber);
            container.classList.toggle('ring-offset-craps-green', isPointNumber);
            container.classList.toggle('ring-white', isPointNumber);
            container.classList.toggle('shadow-lg', isPointNumber);

            if (betAmount > 0) {
                betAmountEl.textContent = `$${betAmount}`;
                betAmountEl.classList.remove('hidden');
            } else {
                betAmountEl.classList.add('hidden');
            }

            container.classList.toggle('opacity-60', !isWorking && betAmount > 0);
            offTag.classList.toggle('hidden', isWorking || betAmount === 0);
        });

        // Probabilities
        const { win, loss } = calculateProbabilities();
        DOMElements.winChance.textContent = `${win.toFixed(2)}%`;
        DOMElements.lossChance.textContent = `${loss.toFixed(2)}%`;

        // History
        DOMElements.rollHistoryContainer.innerHTML = '';
        rollHistory.slice().reverse().forEach(item => {
            const span = document.createElement('span');
            span.textContent = item.roll;
            if (item.type === 'win') span.className = 'text-green-400 font-bold';
            else if (item.type === 'loss') span.className = 'text-red-400 font-bold';
            else span.className = 'text-gray-400';
            DOMElements.rollHistoryContainer.appendChild(span);
        });

        const sevenFreq = rollHistory.length > 0 ? (rollHistory.filter(i => i.roll === 7).length / rollHistory.length) * 100 : 0;
        DOMElements.sevenFreq.textContent = `${sevenFreq.toFixed(1)}%`;

        // Buttons
        const totalBetAmount = Object.values(bets).reduce((s, v) => s + (v || 0), 0);
        DOMElements.rollButton.disabled = rolling;
        DOMElements.clearBetsButton.disabled = rolling || totalBetAmount === 0;
        DOMElements.toggleBetsButton.disabled = gameState !== 'POINT_ON' || rolling;
        DOMElements.toggleBetsButton.textContent = arePlaceBetsWorking ? 'Turn Bets OFF' : 'Turn Bets ON';

        // Chips
        DOMElements.chipContainer.querySelectorAll('button').forEach(btn => {
            const isSelected = parseInt(btn.dataset.value, 10) === selectedChip;
            btn.classList.toggle('ring-4', isSelected);
            btn.classList.toggle('ring-craps-gold', isSelected);
        });
    }

    function setLastResult(text, amount, type) {
        DOMElements.lastResultText.textContent = text;
        if (amount > 0) {
            DOMElements.lastResultAmount.textContent = `${type === 'win' ? '+' : '-'}${formatCurrency(amount)}`;
            DOMElements.lastResultAmount.className = `text-4xl font-mono font-bold mt-2 ${type === 'win' ? 'text-green-400' : 'text-red-400'}`;
        } else {
            DOMElements.lastResultAmount.textContent = '';
        }
    }

    // --- GAME LOGIC ---
    function calculateProbabilities() {
        const totalBetAmount = Object.values(bets).reduce((s, v) => s + (v || 0), 0);
        if (totalBetAmount === 0) return { win: 0, loss: 0 };

        const WAYS_TO_ROLL = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1 };
        let winningCombinations = 0;
        let losingCombinations = 0;

        for (let total = 2; total <= 12; total++) {
            const ways = WAYS_TO_ROLL[total];
            let netWinLoss = 0;
            const passLineBet = bets.passLine || 0;
            const oddsBet = bets.odds || 0;

            if (gameState === 'COME_OUT') {
                if (total === 7) netWinLoss += passLineBet;
            } else { // POINT_ON
                if (total === 7) {
                    let loss = passLineBet + oddsBet;
                    if (arePlaceBetsWorking) {
                        PLACE_NUMBERS.forEach(num => { loss += bets[`place${num}`] || 0; });
                    }
                    netWinLoss -= loss;
                } else if (total === point) {
                    netWinLoss += passLineBet;
                    if (oddsBet) netWinLoss += oddsBet * ODDS_PAYOUTS[point].n / ODDS_PAYOUTS[point].d;
                }
                
                // Separate check for place bets, as they can win on any non-7 roll
                if (arePlaceBetsWorking && bets[`place${total}`] && total !== point) {
                    netWinLoss += (bets[`place${total}`] || 0) * PLACE_PAYOUTS[total].n / PLACE_PAYOUTS[total].d;
                }
            }

            if (netWinLoss > 0) winningCombinations += ways;
            else if (netWinLoss < 0) losingCombinations += ways;
        }
        return { win: (winningCombinations / 36) * 100, loss: (losingCombinations / 36) * 100 };
    }

    function handleBet(betKey) {
        if (rolling) return;
        if (bankroll < selectedChip) {
            return setLastResult("Not enough bankroll.", 0, 'info');
        }

        if (betKey === 'passLine' && gameState !== 'COME_OUT') return setLastResult("Pass Line bets only on come-out.", 0, 'info');
        if (betKey === 'odds') {
            if (gameState !== 'POINT_ON') return setLastResult("Can only place Odds when a point is ON.", 0, 'info');
            const passLineBet = bets.passLine || 0;
            if (passLineBet === 0) return setLastResult("Must have a Pass Line bet to place Odds.", 0, 'info');
            if ((bets.odds || 0) + selectedChip > passLineBet * 2) return setLastResult(`Odds cannot exceed 2x Pass Line (${formatCurrency(passLineBet * 2, 0)}).`, 0, 'info');
        }

        bets[betKey] = (bets[betKey] || 0) + selectedChip;
        bankroll -= selectedChip;
        updateUI();
    }

    function removeBet(betKey) {
        if (rolling) return;
        if (betKey === 'passLine' && gameState === 'POINT_ON') return setLastResult("Cannot remove Pass Line bet while point is ON.", 0, 'info');

        const betAmount = bets[betKey];
        if (betAmount) {
            bankroll += betAmount;
            delete bets[betKey];
        }
        updateUI();
    }

    function handleClearBets() {
        if (rolling) return;
        let amountToReturn = 0;
        const betsToKeep = {};

        Object.keys(bets).forEach(key => {
            if (gameState === 'POINT_ON' && (key === 'passLine' || key === 'odds')) {
                betsToKeep[key] = bets[key];
            } else {
                amountToReturn += bets[key] || 0;
            }
        });

        if (amountToReturn > 0) {
            bankroll += amountToReturn;
            bets = betsToKeep;
            setLastResult('Cleared place bets.', 0, 'info');
        }
        updateUI();
    }

    function resetGame(newBankroll = STARTING_BANKROLL, newMinBet = 5) {
        bankroll = newBankroll;
        minBet = newMinBet;
        gameState = 'COME_OUT';
        point = null;
        bets = {};
        rollHistory = [];
        arePlaceBetsWorking = false;
        setLastResult("Table reset. Place a Pass Line bet.", 0, 'info');
        updateUI();
    }

    function handleRoll() {
        if (gameState === 'COME_OUT' && (bets.passLine || 0) < minBet) {
            return setLastResult(`Pass Line bet must be at least ${formatCurrency(minBet, 0)}.`, 0, 'info');
        }
        rolling = true;
        updateUI();

        setTimeout(() => {
            const d1 = getRandomDieRoll();
            const d2 = getRandomDieRoll();
            const total = d1 + d2;
            dice = [d1, d2];
            rolling = false;

            let winAmount = 0, lossAmount = 0;
            let message = `Rolled ${total}`, messageType = 'roll';

            if (gameState === 'COME_OUT') {
                if (total === 7) {
                    winAmount = bets.passLine || 0;
                    bankroll += winAmount * 2; // Win + original bet
                    delete bets.passLine;
                    message = 'Winner 7!';
                    messageType = 'win';
                    setLastResult(message, winAmount, messageType);
                } else {
                    point = total;
                    gameState = 'POINT_ON';
                    arePlaceBetsWorking = true;
                    message = `Point is ${total}`;
                    
                    const placeBetOnPointKey = `place${point}`;
                    const amountToMove = bets[placeBetOnPointKey];

                    if (amountToMove > 0) {
                        const movePriority = [6, 8, 5, 9, 4, 10, 3, 11, 2, 12];
                        let targetNumber = null;
                        for (const num of movePriority) {
                            if (num !== point && !bets[`place${num}`]) {
                                targetNumber = num;
                                break;
                            }
                        }
                        
                        delete bets[placeBetOnPointKey];
                        if (targetNumber) {
                            bets[`place${targetNumber}`] = amountToMove;
                            message += `. Bet moved to ${targetNumber}.`;
                        } else {
                            bankroll += amountToMove;
                            message += `. Bet on ${point} returned.`;
                        }
                    }

                    messageType = 'info';
                    setLastResult(message, 0, messageType);
                }
            } else { // POINT_ON
                let placeWin = 0;
                if (total !== 7 && total !== point && arePlaceBetsWorking && PLACE_PAYOUTS[total] && bets[`place${total}`]) {
                    placeWin = bets[`place${total}`] * PLACE_PAYOUTS[total].n / PLACE_PAYOUTS[total].d;
                    bankroll += placeWin; // Pay profit, bet stays up
                    winAmount += placeWin;
                }

                if (total === point) { // Point Hit
                    const passLineBet = bets.passLine || 0;
                    const oddsBet = bets.odds || 0;
                    const passLineWin = passLineBet;
                    const oddsWin = oddsBet ? oddsBet * ODDS_PAYOUTS[point].n / ODDS_PAYOUTS[point].d : 0;
                    
                    winAmount += passLineWin + oddsWin;
                    bankroll += (passLineWin + oddsWin) + passLineBet + oddsBet;

                    if (arePlaceBetsWorking && bets[`place${point}`]) {
                        const placeWinOnPoint = bets[`place${point}`] * PLACE_PAYOUTS[point].n / PLACE_PAYOUTS[point].d;
                        winAmount += placeWinOnPoint;
                        bankroll += placeWinOnPoint; 
                    }

                    message = 'Point Hit!';
                    messageType = 'win';
                    setLastResult(message, winAmount, messageType);

                    // Reset for new round, KEEPING place bets.
                    gameState = 'COME_OUT';
                    point = null;
                    delete bets.passLine;
                    delete bets.odds;
                    arePlaceBetsWorking = false; // Turn place bets off for the new come out roll.
                    
                } else if (total === 7) { // Seven Out
                    lossAmount = (bets.passLine || 0) + (bets.odds || 0);
                    Object.keys(bets).forEach(key => {
                        if (key.startsWith('place')) {
                            if (arePlaceBetsWorking) {
                                lossAmount += bets[key];
                            } else {
                                bankroll += bets[key]; // Return non-working bet
                            }
                        }
                    });
                    message = 'Seven Out';
                    messageType = 'loss';
                    setLastResult(message, lossAmount, messageType);
                    
                    // Clear all bets on seven out
                    bets = {};
                    resetGame(bankroll, minBet); // Resets state but keeps current bankroll
                    
                } else {
                    if (placeWin > 0) {
                        setLastResult(`Place ${total} Wins`, placeWin, 'win');
                    } else {
                        setLastResult(`Rolled ${total}`, 0, 'roll');
                    }
                }
            }

            const historyType = messageType === 'win' ? 'win' : messageType === 'loss' ? 'loss' : 'neutral';
            rollHistory.push({ roll: total, type: historyType });
            if (rollHistory.length > 25) rollHistory.shift();

            updateUI();
        }, 500);
    }

    // --- INITIALIZATION ---
    function initialize() {
        // Create Chips
        const chipColors = { 1: 'bg-gray-200 text-black border-2 border-gray-500', 5: 'bg-chip-red text-white', 10: 'bg-chip-blue text-white', 25: 'bg-chip-green text-white', 100: 'bg-chip-black text-white' };
        CHIP_VALUES.forEach(val => {
            const chip = document.createElement('button');
            chip.dataset.value = val;
            chip.type = 'button';
            chip.className = `w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl shadow-lg transition-transform hover:scale-110 ring-2 ring-white/50 ${chipColors[val]}`;
            chip.textContent = `$${val}`;
            chip.onclick = () => { selectedChip = val; updateUI(); };
            DOMElements.chipContainer.appendChild(chip);
        });

        // Create Betting Spots
        PLACE_NUMBERS.forEach(num => {
            const payout = PLACE_PAYOUTS[num];
            const spot = createBettingSpot(num.toString(), `${payout.n} to ${payout.d}`, `place${num}`);
            DOMElements.placeBetsContainer.appendChild(spot);
        });
        const passSpot = createBettingSpot("PASS LINE", '', 'passLine', 'col-span-2');
        const oddsSpot = createBettingSpot("ODDS", "Up to 2X", 'odds', 'col-span-2');
        DOMElements.passOddsContainer.innerHTML = '';
        DOMElements.passOddsContainer.appendChild(passSpot);
        DOMElements.passOddsContainer.appendChild(oddsSpot);

        // Add Event Listeners
        const handleBetEvent = (e) => {
            const spot = e.target.closest('.betting-spot');
            if (spot) handleBet(spot.dataset.betKey);
        };
        const handleRemoveBetEvent = (e) => {
            e.preventDefault();
            const spot = e.target.closest('.betting-spot');
            if (spot) removeBet(spot.dataset.betKey);
        };

        // Use a single listener on the body for context menu to prevent default.
        document.body.oncontextmenu = e => e.preventDefault();
        
        const bettingArea = document.getElementById('pass-odds-container').parentElement;
        bettingArea.addEventListener('click', handleBetEvent);
        bettingArea.addEventListener('contextmenu', handleRemoveBetEvent);


        DOMElements.rollButton.onclick = handleRoll;
        DOMElements.clearBetsButton.onclick = handleClearBets;
        DOMElements.toggleBetsButton.onclick = () => { arePlaceBetsWorking = !arePlaceBetsWorking; updateUI(); };
        DOMElements.restartButton.onclick = () => {
            DOMElements.bankrollInput.value = STARTING_BANKROLL;
            DOMElements.minBetInput.value = minBet;
            DOMElements.settingsModal.classList.remove('hidden');
        };
        DOMElements.modalCancelButton.onclick = () => DOMElements.settingsModal.classList.add('hidden');
        DOMElements.modalSaveButton.onclick = () => {
            const newBankroll = parseInt(DOMElements.bankrollInput.value, 10);
            const newMinBet = parseInt(DOMElements.minBetInput.value, 10);
            if (!isNaN(newBankroll) && !isNaN(newMinBet) && newBankroll >= 0 && newMinBet > 0) {
                resetGame(newBankroll, newMinBet);
                DOMElements.settingsModal.classList.add('hidden');
            } else {
                alert("Please enter valid, positive numbers.");
            }
        };

        resetGame(STARTING_BANKROLL, 5);
    }

    // --- START ---
    document.addEventListener('DOMContentLoaded', initialize);
})();
