/**
 * Base wallet service containing all shared business logic for wallet management.
 * Platform-specific implementations should extend or compose this service.
 */

import { SubscriptionAPIService } from '../subscription-api.service';
import { EnsResolverService } from '../ens-resolver.service';

export interface WalletInfo {
  address: string;
  displayName?: string;
}

export class BaseWalletService {
  constructor(
    protected subscriptionApi: SubscriptionAPIService,
    protected ensResolver: EnsResolverService
  ) {}

  /**
   * Validates and normalizes a wallet address or ENS name
   * @param input User input (address or ENS)
   * @returns Resolved Ethereum address or null if invalid
   */
  async validateAndResolveAddress(input: string): Promise<string | null> {
    const normalized = input.trim();

    // Check if it's a valid Ethereum address
    if (this.isValidEthereumAddress(normalized)) {
      return normalized;
    }

    // If it contains a dot, try ENS resolution
    if (normalized.includes('.')) {
      const resolved = await this.ensResolver.resolveToAddress(normalized);
      return resolved || null;
    }

    // Invalid input
    return null;
  }

  /**
   * Checks if a string is a valid Ethereum address
   */
  isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/i.test(address);
  }

  /**
   * Gets all wallets for a user with display names
   */
  async getUserWalletsWithDisplayNames(
    userId: string,
    platform: string
  ): Promise<WalletInfo[]> {
    const wallets = await this.subscriptionApi.getUserWallets(userId, platform);

    // Resolve display names for all wallets
    const walletsWithNames = await Promise.all(
      wallets.map(async (wallet) => ({
        address: wallet.address,
        displayName: await this.ensResolver.resolveDisplayName(wallet.address)
      }))
    );

    return walletsWithNames;
  }

  /**
   * Checks if a wallet already exists for a user
   */
  async walletExistsForUser(
    userId: string,
    address: string,
    platform: string
  ): Promise<boolean> {
    const existingWallets = await this.subscriptionApi.getUserWallets(userId, platform);
    return existingWallets.some(
      wallet => wallet.address.toLowerCase() === address.toLowerCase()
    );
  }

  /**
   * Adds a wallet for a user with validation
   */
  async addUserWallet(
    userId: string,
    input: string,
    platform: string
  ): Promise<{ success: boolean; message: string; address?: string }> {
    // Validate and resolve the address
    const address = await this.validateAndResolveAddress(input);

    if (!address) {
      return {
        success: false,
        message: 'Invalid address or ENS name. Please enter a valid Ethereum address or ENS name.'
      };
    }

    // Check if wallet already exists
    const exists = await this.walletExistsForUser(userId, address, platform);
    if (exists) {
      return {
        success: false,
        message: 'This wallet has already been added.'
      };
    }

    try {
      // Add the wallet
      await this.subscriptionApi.addUserWallet(userId, address, platform);
      return {
        success: true,
        message: 'Wallet added successfully!',
        address
      };
    } catch (error) {
      console.error('Error adding wallet:', error);
      return {
        success: false,
        message: 'An error occurred while adding the wallet. Please try again later.'
      };
    }
  }

  /**
   * Removes multiple wallets for a user
   */
  async removeUserWallets(
    userId: string,
    addresses: string[],
    platform: string
  ): Promise<{ success: boolean; message: string; removedCount?: number }> {
    if (addresses.length === 0) {
      return {
        success: false,
        message: 'No wallets selected for removal.'
      };
    }

    try {
      const promises = addresses.map(address =>
        this.subscriptionApi.removeUserWallet(userId, address, platform)
      );

      await Promise.all(promises);

      return {
        success: true,
        message: `Successfully removed ${addresses.length} wallet(s).`,
        removedCount: addresses.length
      };
    } catch (error) {
      console.error('Error removing wallets:', error);
      return {
        success: false,
        message: 'An error occurred while removing wallets. Please try again later.'
      };
    }
  }
}