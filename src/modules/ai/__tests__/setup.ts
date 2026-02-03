import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

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
    const mockMongoose = {
        connect: jest.fn().mockResolvedValue(null),
        disconnect: jest.fn().mockResolvedValue(undefined),
        connection: {
            on: jest.fn(),
            close: jest.fn().mockResolvedValue(undefined),
            readyState: 1
        },
        Schema: class { },
        model: jest.fn(),
        Types: {
            ObjectId: class {
                constructor(id?: string) { return id || "mock-object-id"; }
                toString() { return "mock-object-id"; }
            }
        },
        Mongoose: class {
            connect = jest.fn().mockResolvedValue(this);
            disconnect = jest.fn().mockResolvedValue(undefined);
            connection = {
                on: jest.fn(),
                close: jest.fn().mockResolvedValue(undefined)
            };
        }
    };
    return {
        __esModule: true,
        ...mockMongoose,
        default: mockMongoose,
    };
});

// Global cleanup to prevent hanging
afterAll(async () => {
    jest.clearAllMocks();
});
