// Mock Prisma client for unit testing without a real database
export const prisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  post: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  account: {
    findMany: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  session: {
    findMany: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
    findUnique: jest.fn(),
  },
  verificationToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
};

// Allow overriding mock return values per test
export const resetMocks = () => {
  Object.values(prisma).forEach((model) => {
    if (model && typeof model === 'object') {
      Object.values(model).forEach((fn) => {
        if (typeof fn?.mockReset === 'function') fn.mockReset();
      });
    }
  });
};

export default prisma;
