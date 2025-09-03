/**
 * Service for common validation operations
 */
export class ValidationService {
  /**
   * Validates if an array has at least the minimum required items
   * @param items - Array to validate
   * @param minimumRequired - Minimum number of items required
   * @param context - Context for logging (e.g., "proposals for DAO XYZ")
   * @returns True if there are enough items
   */
  static hasMinimumItems<T>(
    items: T[],
    minimumRequired: number,
    context?: string
  ): boolean {
    if (items.length < minimumRequired) {
      if (context) {
        console.log(`Not enough ${context}. Found: ${items.length}, Required: ${minimumRequired}`);
      }
      return false;
    }
    return true;
  }

  /**
   * Validates if an array has any items
   * @param items - Array to validate
   * @param context - Context for logging (e.g., "followed addresses for DAO XYZ")
   * @returns True if array is not empty
   */
  static hasItems<T>(items: T[], context?: string): boolean {
    if (items.length === 0) {
      if (context) {
        console.log(`No ${context}`);
      }
      return false;
    }
    return true;
  }
}