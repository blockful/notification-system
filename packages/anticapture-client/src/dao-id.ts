const daoAliasToApi: Record<string, string> = {
  AAVE: 'aave',
  COMP: 'comp',
  COMPOUND: 'comp',
  ENS: 'ens',
  GTC: 'gtc',
  NOUNS: 'nouns',
  OBOL: 'obol',
  SCR: 'scr',
  SCROLL: 'scr',
  UNI: 'uni',
  UNISWAP: 'uni',
};

const apiToLegacyDao: Record<string, string> = {
  aave: 'AAVE',
  comp: 'COMPOUND',
  ens: 'ENS',
  gtc: 'GTC',
  nouns: 'NOUNS',
  obol: 'OBOL',
  scr: 'SCR',
  uni: 'UNISWAP',
};

export function toApiDaoId(daoId: string): string {
  return daoAliasToApi[daoId.toUpperCase()] ?? daoId.toLowerCase();
}

export function toLegacyDaoId(daoId: string): string {
  return apiToLegacyDao[daoId.toLowerCase()] ?? daoId.toUpperCase();
}
