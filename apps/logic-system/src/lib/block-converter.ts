/**
 * Utility functions for converting blockchain blocks to timestamps
 * Uses real proposal data instead of estimating current block
 */

/**
 * Calculates when a proposal ends based on its start time and block duration
 * 
 * @param creationTimestamp - When the proposal was created (from API)
 * @param startBlock - Block number when voting starts (creation block + voting delay)
 * @param endBlock - Block number when proposal ends
 * @param blockTime - Time in seconds between blocks (e.g., 12 for Ethereum)
 * @param votingDelay - Number of blocks before voting starts
 * @returns Timestamp when the proposal ends
 */
export function calculateProposalEndTimestamp(
  creationTimestamp: number,
  startBlock: string,
  endBlock: string,
  blockTime: number,
  votingDelay: string = '0'
): number {
  const startBlockNum = parseInt(startBlock);
  const endBlockNum = parseInt(endBlock);
  const votingDelayNum = parseInt(votingDelay);
  
  // The creation block is startBlock - votingDelay
  const creationBlock = startBlockNum - votingDelayNum;
  
  // Calculate how many blocks from creation to end
  const blocksFromCreationToEnd = endBlockNum - creationBlock;
  
  // Calculate duration in seconds
  const durationInSeconds = blocksFromCreationToEnd * blockTime;
  
  // Add duration to creation timestamp
  const endTimestamp = creationTimestamp + durationInSeconds;
  
  return endTimestamp;
}

/**
 * Checks if a proposal has finished based on real proposal data
 * @param creationTimestamp - When the proposal was created (from API)
 * @param startBlock - Block number when voting starts (creation block + voting delay)
 * @param endBlock - Block number when proposal ends
 * @param blockTime - Time in seconds between blocks
 * @param votingDelay - Number of blocks before voting starts
 * @returns true if the proposal has finished
 */
export function isProposalFinished(
  creationTimestamp: number,
  startBlock: string,
  endBlock: string,
  blockTime: number,
  votingDelay: string = '0'
): boolean {
  const endTimestamp = calculateProposalEndTimestamp(creationTimestamp, startBlock, endBlock, blockTime, votingDelay);
  const currentTimestamp = Date.now()/1000;
  return currentTimestamp >= endTimestamp;
}
