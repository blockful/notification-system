/**
 * Utility functions for formatting numbers in human-readable notation
 */

/**
 * Formats token amounts from wei to human-readable format
 * @param amount The amount in wei (as string or number)
 * @param decimals The number of decimals for the token (default: 18)
 * @returns Formatted string with appropriate suffix (K, M, B, etc)
 */
export function formatTokenAmount(amount: string | number, decimals: number = 18): string {
  // Convert wei string to number, handling 18 decimal places
  const divisor = Math.pow(10, decimals);
  const actualAmount = Number(amount) / divisor;
  
  // Handle zero
  if (actualAmount === 0) return '0';
  
  // Handle very small amounts (less than 0.1)
  if (actualAmount < 0.1) return '< 0.1';
  
  // For amounts less than 1000, show with 1 decimal place
  if (actualAmount < 1000) {
    return actualAmount.toFixed(1);
  }
  
  // For larger amounts, use K, M, B notation
  const units = ['', 'K', 'M', 'B'];
  let unitIndex = Math.floor(Math.log10(actualAmount) / 3);
  
  if (unitIndex >= units.length) {
    return actualAmount.toExponential(1);
  }
  
  let scaledAmount = actualAmount / Math.pow(1000, unitIndex);
  let formatted = scaledAmount.toFixed(1);
  
  // If rounded result is >= 1000, promote to next unit
  if (parseFloat(formatted) >= 1000) {
    unitIndex++;
    if (unitIndex >= units.length) {
      return actualAmount.toExponential(1);
    }
    scaledAmount = actualAmount / Math.pow(1000, unitIndex);
    formatted = scaledAmount.toFixed(1);
  }
  
  return formatted + units[unitIndex];
}