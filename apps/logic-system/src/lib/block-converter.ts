/**
 * Utility functions for converting blockchain blocks to timestamps
 * Uses real proposal data instead of estimating current block
 */

/**
 * Calculates when a proposal ends based on its start time and block duration
 * 
 * @param startTimestamp - When the proposal was created (from API)
 * @param startBlock - Block number when proposal started
 * @param endBlock - Block number when proposal ends
 * @param blockTime - Time in seconds between blocks (e.g., 12 for Ethereum)
 * @returns Timestamp when the proposal ends
 */
export function calculateProposalEndTimestamp(
  startTimestamp: number,
  startBlock: string,
  endBlock: string,
  blockTime: number
): number {
  const startBlockNum = parseInt(startBlock);
  const endBlockNum = parseInt(endBlock);
  
  // Calculate duration in seconds
  const durationInSeconds = (endBlockNum - startBlockNum) * blockTime;
  
  // Convert to milliseconds and add to start timestamp
  return startTimestamp + (durationInSeconds);
}

/**
 * Checks if a proposal has finished based on real proposal data
 * @param startTimestamp - When the proposal was created (from API)
 * @param startBlock - Block number when proposal started
 * @param endBlock - Block number when proposal ends
 * @param blockTime - Time in seconds between blocks
 * @returns true if the proposal has finished
 */
export function isProposalFinished(
  startTimestamp: number,
  startBlock: string,
  endBlock: string,
  blockTime: number
): boolean {
  const endTimestamp = calculateProposalEndTimestamp(startTimestamp, startBlock, endBlock, blockTime);
  return Date.now()/1000 >= endTimestamp;
}
