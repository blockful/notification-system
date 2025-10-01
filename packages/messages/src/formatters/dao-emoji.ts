/**
 * DAO emoji mappings for consistent representation across all services
 */

// Map of DAO identifiers to their emoji representations
export const daoEmojis = new Map<string, string>([
  ['UNI', '🦄'],     // Uniswap
  ['ENS', '🌐'],     // ENS
  ['OP', '🔴'],      // Optimism
  ['GIT', '🪖'],     // Gitcoin
  ['NOUNS', '🕶️'],   // Nouns
  ['OBOL', '♾️'],    // Obol
  ['LIDO', '💧'],    // Lido
  ['VIRTUAL', '🤖'],  // Virtual
  ['SCROLL', '📜']    // Scroll
]);

export const defaultDaoEmoji = '🏛️';

/**
 * Get DAO display name with emoji
 */
export function getDaoWithEmoji(dao: string): string {
  const normalizedDao = dao.toUpperCase();
  const emoji = daoEmojis.get(normalizedDao) || defaultDaoEmoji;
  return `${emoji} ${dao}`;
}