/**
 * User Address interface and repository definition
 * Manages user wallet addresses with soft delete functionality
 */

/**
 * Represents a user's wallet address
 */
export interface UserAddress {
  id: string;
  user_id: string;
  address: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Repository interface for managing user addresses
 */
export interface IUserAddressRepository {
  /**
   * Find all active wallet addresses for a user
   * @param userId - The user ID
   * @returns Array of active UserAddress records
   */
  findByUser(userId: string): Promise<UserAddress[]>;

  /**
   * Find all users who own a specific wallet address
   * @param address - The wallet address
   * @returns Array of UserAddress records for active addresses
   */
  findByAddress(address: string): Promise<UserAddress[]>;

  /**
   * Find a specific user-address combination
   * @param userId - The user ID
   * @param address - The wallet address
   * @returns UserAddress record if found, undefined otherwise
   */
  findByUserAndAddress(userId: string, address: string): Promise<UserAddress | undefined>;

  /**
   * Create a new user address record
   * @param data - User address data (without id, created_at, updated_at)
   * @returns Created UserAddress record
   */
  create(data: Omit<UserAddress, 'id' | 'created_at' | 'updated_at'>): Promise<UserAddress>;

  /**
   * Deactivate a user address (soft delete)
   * @param userId - The user ID
   * @param address - The wallet address to deactivate
   * @returns Updated UserAddress record
   */
  deactivate(userId: string, address: string): Promise<UserAddress>;

  /**
   * Reactivate a user address
   * @param userId - The user ID
   * @param address - The wallet address to reactivate
   * @returns Updated UserAddress record
   */
  reactivate(userId: string, address: string): Promise<UserAddress>;
}