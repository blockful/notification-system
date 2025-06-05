/**
 * Interfaces for the Anticapture GraphQL API
 * Defines the structure for communication with the anticapture GraphQL endpoint
 */

/**
 * Response structure for the daos query from GraphQL API
 */
export interface DaosResponse {
  daos: {
    items: Array<{ id: string }>;
  };
} 