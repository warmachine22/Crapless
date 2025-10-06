/**
 * Generates a cryptographically secure random number between 1 and 6.
 * @returns {number} A random integer representing a die roll.
 */
export function getRandomDieRoll(): number {
  const randomBuffer = new Uint32Array(1);
  window.crypto.getRandomValues(randomBuffer);
  // Scale the random number to the desired range [1, 6]
  return (randomBuffer[0] % 6) + 1;
}
