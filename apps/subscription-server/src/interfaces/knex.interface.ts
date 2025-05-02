/**
 * Mock interface for Knex in testing environments
 * Provides jest mock functions for database operations
 */
export interface KnexMock {
    where: jest.Mock<any>;
    first: jest.Mock<any>;
    insert: jest.Mock<any>;
    update: jest.Mock<any>;
    returning: jest.Mock<any>;
    join: jest.Mock<any>;
    select: jest.Mock<any>;
}
  