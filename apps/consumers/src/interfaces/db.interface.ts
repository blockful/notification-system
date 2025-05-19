export interface IDatabaseService {
    getDAOs(): Promise<string[]>;
    saveUserPreferences(userId: number, daoIds: Set<string>): Promise<void>;
}
  