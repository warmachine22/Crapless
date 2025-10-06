# Crapless Craps Simulator

A rapid-play simulator for the casino game "Crapless Craps" (also known as "Never Ever Craps"). This application is built with vanilla HTML, CSS (via TailwindCSS CDN), and JavaScript, making it lightweight and easy to deploy on any static hosting service like GitHub Pages.

The goal of this simulator is to provide a tool for players to practice betting strategies, understand the game flow, and observe odds and probabilities without risking real money.

## Features

-   **Full Crapless Craps Ruleset**: Simulates the unique rules where 2, 3, 11, and 12 are point numbers.
-   **Realistic Betting**: Place Pass Line, Odds, and Place bets across the board.
-   **Interactive Table**: Click to place bets, right-click to remove them.
-   **Dynamic Odds Calculation**: See your win/loss probabilities update in real-time based on your current bets and the game state.
-   **Game Settings**: Customize your starting bankroll and the table's minimum bet.
-   **Working Bets Control**: Toggle your Place bets ON or OFF during a point roll, just like in a real casino.
-   **Detailed Feedback**: Get clear messages about roll results, wins, losses, and point establishment.
-   **Roll History & Stats**: Track the last 25 rolls and see the frequency of 7s.
-   **Fast-Paced Gameplay**: Instant dice rolls allow for rapid simulation of many hands.
-   **Responsive Design**: Playable on both desktop and mobile devices.

## How to Play

Crapless Craps is a variation of the standard game of Craps. The main difference is that on the "Come Out" roll (the first roll), you cannot lose. The numbers 2, 3, 11, and 12, which are winners or losers in traditional craps, become point numbers instead. The only way to win on the come out roll is to roll a 7.

1.  **Start the Game**: The game begins with a "Come Out" roll.
2.  **Place a Pass Line Bet**: Before the Come Out roll, you must place a bet on the PASS LINE. Use the chips at the bottom to select your bet amount.
3.  **Roll the Dice**: Click the "ROLL DICE" button.
4.  **Come Out Roll Outcome**:
    -   If a **7** is rolled, your Pass Line bet wins, and a new Come Out roll begins.
    -   If any other number (**2, 3, 4, 5, 6, 8, 9, 10, 11, 12**) is rolled, that number becomes the "Point". The puck will show "POINT: [number]".
5.  **Point Roll Phase**:
    -   The goal is now to roll the "Point" number again *before* a 7 is rolled.
    -   **You Win**: If the Point is rolled, your Pass Line bet wins. The round ends, and a new Come Out roll begins.
    -   **You Lose ("Seven Out")**: If a 7 is rolled, your Pass Line bet loses. The round ends, and a new Come Out roll begins.
    -   Any other number rolled is irrelevant for the Pass Line bet, and you continue rolling.

### Additional Bets (Point Phase Only)

-   **Odds Bet**: After a point is established, you can place an "Odds" bet behind your Pass Line bet. This is the best bet in the casino, as it pays true odds. This simulator allows up to 2x your Pass Line bet.
-   **Place Bets**: You can bet on any of the point numbers (2, 3, 4, 5, 6, 8, 9, 10, 11, 12) to be rolled before a 7. These bets pay if their number is rolled.
-   **Turn Bets ON/OFF**: During the point phase, you can choose whether your Place bets are "working". If they are OFF, they will not win if their number is rolled, but they also will not lose if a 7 is rolled. By default, they are ON when a point is established and OFF on a new Come Out roll.

## Running the Project

This is a client-side application with no backend or build process required.

1.  Clone or download this repository.
2.  Open the `index.html` file in any modern web browser.

That's it! The simulator will be running locally in your browser.

## Tech Stack

-   **HTML5**
-   **CSS3** with **TailwindCSS** (via CDN)
-   **Vanilla JavaScript** (ES6+)
