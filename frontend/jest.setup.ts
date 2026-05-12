import '@testing-library/jest-dom';

// Provide a minimal vi polyfill for tests that reference it
(global as any).vi = { fn: () => jest.fn() };