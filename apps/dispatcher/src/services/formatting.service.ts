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
   * Formats a list of proposals for display in notifications
   * @param proposals - Proposals to format
   * @returns Formatted proposal list with bullet points
   */
  static formatProposalList(proposals: any[]): string {
    return proposals
      .map(p => {
        const title = p.title || p.description.split('\n')[0].replace(/^#+\s*/, '').trim();
        return `• ${title}`;
      })
      .join('\n');
  }

  /**
   * Creates a formatted non-voting alert message
   * @param address - Non-voting address
   * @param daoId - DAO identifier
   * @param proposalsCount - Number of proposals checked
   * @param proposalTitles - Formatted list of proposal titles
   * @returns Formatted alert message
   */
  static createNonVotingAlertMessage(
    address: string,
    daoId: string,
    proposalsCount: number,
    proposalTitles: string
  ): string {
    const formattedAddress = FormattingService.formatAddress(address);
    
    return `⚠️ Non-Voting Alert for DAO ${daoId.toUpperCase()}

The address ${formattedAddress} that you follow hasn't voted in the last ${proposalsCount} proposals:

${proposalTitles}

Consider reaching out to encourage participation!`;
  }
}