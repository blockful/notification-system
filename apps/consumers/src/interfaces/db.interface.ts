export interface IDatabaseService {
    getDAOs(): Promise<string[]>;
}