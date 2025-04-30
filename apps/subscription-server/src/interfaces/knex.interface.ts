export interface KnexMock {
    where: jest.Mock<any>;
    first: jest.Mock<any>;
    insert: jest.Mock<any>;
    update: jest.Mock<any>;
    returning: jest.Mock<any>;
}
  