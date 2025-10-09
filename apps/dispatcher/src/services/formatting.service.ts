/**
 * Service for formatting data for display in notifications
 */
export class FormattingService {
  /**
   * Formats an address for display (0x1234...5678)
   * @param address - Full address to format
   * @returns Shortened address format
   */
  static formatAddress(address: string): string {
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Extracts a title from a description string
   * @param description - The description to extract title from
   * @param fallback - Optional fallback text if no title can be extracted
   * @returns Extracted title or fallback
   */
  static extractTitle(description: string, fallback: string = ''): string {
    if (!description) return fallback;
    
    // Try to extract first line (removing markdown headers)
    const firstLine = description.split('\n')[0].replace(/^#+\s*/, '').trim();
    if (firstLine && firstLine.length <= 100) {
      return firstLine;
    }
    
    // If first line is too long, try first sentence
    const firstSentence = description.split('.')[0].replace(/^#+\s*/, '').trim();
    if (firstSentence && firstSentence.length <= 100) {
      return firstSentence + '.';
    }
    
    // If still too long, truncate
    const truncated = description.substring(0, 80).replace(/^#+\s*/, '').trim();
    return truncated ? truncated + '...' : fallback;
  }

  /**
   * Formats a list of proposals for display in notifications
   * @param proposals - Proposals to format
   * @returns Formatted proposal list with bullet points
   */
  static formatProposalList(proposals: any[]): string {
    return proposals
      .map(p => {
        const title = p.title || FormattingService.extractTitle(p.description);
        return `• ${title}`;
      })
      .join('\n');
  }


  /**
   * Calculates human-readable time remaining
   */
  static calculateTimeRemaining(endTimestamp: number): string {
    const now = Math.floor(Date.now() / 1000);
    const secondsRemaining = endTimestamp - now;
    
    if (secondsRemaining <= 0) {
      return 'Proposal has ended';
    }
    
    const days = Math.floor(secondsRemaining / (24 * 60 * 60));
    const hours = Math.floor((secondsRemaining % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((secondsRemaining % (60 * 60)) / 60);
    
    // Round 59-61 minutes to 1 hour for better UX
    if (hours === 0 && minutes >= 59) {
      return '~1 hour';
    }
    
    if (days > 0) {
      return `~${days} day${days !== 1 ? 's' : ''}${hours > 0 ? ` and ${hours} hour${hours !== 1 ? 's' : ''}` : ''}`;
    } else if (hours > 0) {
      return `~${hours} hour${hours !== 1 ? 's' : ''}${minutes > 0 ? ` and ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}`;
    } else {
      return `~${Math.max(1, minutes)} minute${minutes !== 1 ? 's' : ''}`;
    }
  }

}