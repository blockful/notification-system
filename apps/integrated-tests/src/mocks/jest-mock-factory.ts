/**
 * @notice Factory to create mock functions using Jest when available
 * @dev This avoids importing @jest/globals in files that might be used outside Jest context
 * @return Mock function compatible with Jest or fallback implementation
 */
export function createMockFunction(): any {
  // When running in Jest, jest.fn() is available globally
  if (typeof jest !== 'undefined' && jest.fn) {
    return jest.fn();
  }
  
  // Fallback for non-Jest environments (like global setup/teardown)
  const mockFn: any = function(...args: any[]) {
    mockFn.calls.push(args);
    if (mockFn.implementation) {
      return mockFn.implementation(...args);
    }
    return undefined;
  };
  
  mockFn.calls = [];
  mockFn.mockClear = function() {
    this.calls = [];
    return this;
  };
  mockFn.mockReset = function() {
    this.calls = [];
    this.implementation = undefined;
    return this;
  };
  mockFn.mockImplementation = function(impl: any) {
    this.implementation = impl;
    return this;
  };
  
  return mockFn;
}