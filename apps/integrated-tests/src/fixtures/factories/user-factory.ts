import { db } from '../../setup';
import { v4 as uuidv4 } from 'uuid';
import { testConstants } from '../../config';

/**
 * @notice Represents user data structure in the database
 * @dev Contains basic user identification information
 */
export interface UserData {
  /** Unique user identifier */
  id: string;
  /** User ID from the messaging channel (e.g., Telegram chat ID) */
  channel_user_id: string;
  /** Communication channel type (telegram, discord, etc.) */
  channel: string;
}

/**
 * @notice Represents user preference data for DAO notifications
 * @dev Links users to specific DAOs with notification preferences
 */
export interface UserPreferenceData {
  /** Unique preference record identifier */
  id: string;
  /** Foreign key to users table */
  user_id: string;
  /** DAO identifier this preference applies to */
  dao_id: string;
  /** Whether notifications are enabled for this DAO */
  is_active: boolean;
}

/**
 * @notice Represents blockchain addresses associated with users
 * @dev Links users to their wallet addresses for governance tracking
 */
export interface UserAddressData {
  /** Unique address record identifier */
  id: string;
  /** Foreign key to users table */
  user_id: string;
  /** Blockchain address (Ethereum, etc.) */
  address: string;
  /** Whether this address is currently active */
  is_active: boolean;
}

/**
 * @notice Factory class for creating test user data and related records
 * @dev Provides methods to create users, preferences, and addresses for testing
 */
export class UserFactory {
  /**
   * @notice Creates a new user record in the database
   * @param channelUserId The user's ID in the messaging channel
   * @param name Display name for the user (used for identification)
   * @return Promise resolving to the created user data
   */
  static async createUser(channelUserId: string, name: string): Promise<UserData> {
    const user = {
      id: uuidv4(),
      channel: testConstants.defaults.channel,
      channel_user_id: channelUserId,
      created_at: new Date().toISOString()
    };
    await db(testConstants.tables.users).insert(user);
    return user;
  }

  /**
   * @notice Creates a user preference record for DAO notifications
   * @param userId The user's unique identifier
   * @param daoId The DAO identifier for the preference
   * @param isActive Whether notifications should be enabled
   * @param timestamp Optional custom timestamp for creation
   * @return Promise resolving to the created preference data
   */
  static async createUserPreference(
    userId: string, 
    daoId: string, 
    isActive: boolean = true,
    timestamp?: string
  ): Promise<UserPreferenceData> {
    const preference = {
      id: uuidv4(),
      user_id: userId,
      dao_id: daoId,
      is_active: isActive,
      created_at: timestamp || new Date().toISOString(),
      updated_at: timestamp || new Date().toISOString()
    };
    await db(testConstants.tables.userPreferences).insert(preference);
    return preference;
  }

  /**
   * @notice Creates a user with associated preference in one operation
   * @param channelUserId The user's ID in the messaging channel
   * @param name Display name for the user
   * @param daoId The DAO to create preference for
   * @param preferenceActive Whether the preference should be active
   * @param timestamp Optional custom timestamp for creation
   * @return Promise resolving to both user and preference data
   */
  static async createUserWithFullSetup(
    channelUserId: string, 
    name: string, 
    daoId: string,
    preferenceActive: boolean = true,
    timestamp?: string
  ): Promise<{ user: UserData; preference: UserPreferenceData }> {
    const user = await this.createUser(channelUserId, name);
    const preference = await this.createUserPreference(user.id, daoId, preferenceActive, timestamp);
    
    return { user, preference };
  }

  /**
   * @notice Updates an existing user preference record
   * @param userId The user's unique identifier
   * @param daoId The DAO identifier for the preference
   * @param isActive New active status for the preference
   * @param timestamp Timestamp for the update operation
   * @return Promise that resolves when update is complete
   */
  static async updateUserPreference(
    userId: string,
    daoId: string,
    isActive: boolean,
    timestamp: string
  ): Promise<void> {
    await db(testConstants.tables.userPreferences)
      .where({ user_id: userId, dao_id: daoId })
      .update({
        is_active: isActive,
        updated_at: timestamp
      });
  }

  /**
   * @notice Creates a blockchain address record for a user
   * @param userId The user's unique identifier
   * @param address The blockchain address to associate
   * @param timestamp Optional custom timestamp for creation
   * @return Promise resolving to the created address data
   */
  static async createUserAddress(
    userId: string,
    address: string,
    timestamp?: string
  ): Promise<UserAddressData> {
    const userAddress = {
      id: uuidv4(),
      user_id: userId,
      address: address,
      is_active: true,
      created_at: timestamp || new Date().toISOString(),
      updated_at: timestamp || new Date().toISOString()
    };
    await db('user_addresses').insert(userAddress);
    return userAddress;
  }

  /**
   * @notice Ensures user address mapping exists in the real database
   * @dev Only executes when SEND_REAL_TELEGRAM is set, for integration testing
   * @param userId The user's unique identifier
   * @param address The wallet address to map
   * @param timestamp Optional timestamp for record creation
   * @return Promise resolving when operation completes
   */
  static async ensureUserAddressInRealDB(
    userId: string,
    address: string,
    timestamp?: string
  ): Promise<void> {
    console.log('ensureUserAddressInRealDB called with:', { userId, address, SEND_REAL_TELEGRAM: process.env.SEND_REAL_TELEGRAM });
    
    // Only execute when using real Telegram
    if (!process.env.SEND_REAL_TELEGRAM) {
      console.log('Skipping ensureUserAddressInRealDB - SEND_REAL_TELEGRAM not set');
      return;
    }
    
    // First check if user exists
    const user = await db('users').where({ id: userId }).first();
    console.log('User in DB:', user ? `Found user with id=${userId}` : `USER NOT FOUND with id=${userId}`);
    
    // Check if mapping already exists
    const existing = await db('user_addresses')
      .where({ user_id: userId, address: address })
      .first();
    
    if (!existing) {
      // Create the mapping if it doesn't exist
      await db('user_addresses').insert({
        id: uuidv4(),
        user_id: userId,
        address: address,
        is_active: true,
        created_at: timestamp || new Date().toISOString(),
        updated_at: timestamp || new Date().toISOString()
      });
      console.log(`Created user_address mapping in real DB: user=${userId}, address=${address}`);
    } else {
      console.log(`User_address mapping already exists: user=${userId}, address=${address}`);
    }
  }

  /**
   * @notice Creates a user with DAO subscription and followed addresses
   * @param channelUserId The user's channel identifier
   * @param name The user's display name
   * @param daoId The DAO to subscribe to
   * @param followedAddresses Array of addresses this user follows
   * @param preferenceActive Whether preferences are active
   * @param timestamp Optional custom timestamp
   * @return Promise resolving to user, preference, and address data
   */
  static async createUserWithFollowedAddresses(
    channelUserId: string,
    name: string,
    daoId: string,
    followedAddresses: string[],
    preferenceActive: boolean = true,
    timestamp?: string
  ): Promise<{ 
    user: UserData; 
    preference: UserPreferenceData;
    addresses: UserAddressData[];
  }> {
    const { user, preference } = await this.createUserWithFullSetup(
      channelUserId,
      name,
      daoId,
      preferenceActive,
      timestamp
    );

    const addresses = await Promise.all(
      followedAddresses.map(address => 
        this.createUserAddress(user.id, address, timestamp)
      )
    );

    return { user, preference, addresses };
  }
}