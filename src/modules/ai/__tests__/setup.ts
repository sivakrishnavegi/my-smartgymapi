// Manual mock for Redis
class MockRedis {
    async get() { return null; }
    async set() { return 'OK'; }
    async setex() { return 'OK'; }
    async incr() { return 1; }
    async expire() { return 1; }
    on() { return this; }
}

jest.mock('ioredis', () => MockRedis);

jest.mock('bullmq', () => ({
    Queue: jest.fn().mockImplementation(() => ({
        add: jest.fn().mockResolvedValue({ id: 'mock-job' }),
        getJob: jest.fn().mockResolvedValue(null),
        close: jest.fn().mockResolvedValue(undefined),
    })),
    Worker: jest.fn().mockImplementation(() => ({
        close: jest.fn().mockResolvedValue(undefined),
    })),
}));

jest.mock('mongoose', () => {
    const mongoose = jest.requireActual('mongoose');
    const mockMongoose = new mongoose.Mongoose();
    mockMongoose.connect = jest.fn().mockResolvedValue(mockMongoose);
    mockMongoose.disconnect = jest.fn().mockResolvedValue(undefined);
    mockMongoose.connection = {
        on: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined),
    };
    return mockMongoose;
});

// Global cleanup to prevent hanging
afterAll(async () => {
    jest.clearAllMocks();
});
