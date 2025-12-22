"use strict";
// # Shared Redis connection (publisher + subscriber)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = exports.redisSubscriber = exports.redisPublisher = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const redisConfig = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
};
exports.redisPublisher = new ioredis_1.default(redisConfig);
exports.redisSubscriber = new ioredis_1.default(redisConfig);
// Single redis client for storing online users, etc.
exports.redis = new ioredis_1.default(redisConfig);
exports.redisPublisher.on("connect", () => console.log("✔ Redis Publisher Connected"));
exports.redisSubscriber.on("connect", () => console.log("✔ Redis Subscriber Connected"));
exports.redisPublisher.on("error", (err) => console.error("❌ Redis Publisher Error:", err));
exports.redisSubscriber.on("error", (err) => console.error("❌ Redis Subscriber Error:", err));
