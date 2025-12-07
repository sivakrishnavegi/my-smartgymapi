// # Shared Redis connection (publisher + subscriber)

import Redis from "ioredis";


const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
};

export const redisPublisher = new Redis(redisConfig);
export const redisSubscriber = new Redis(redisConfig);

// Single redis client for storing online users, etc.
export const redis = new Redis(redisConfig);

redisPublisher.on("connect", () => console.log("✔ Redis Publisher Connected"));
redisSubscriber.on("connect", () => console.log("✔ Redis Subscriber Connected"));

redisPublisher.on("error", (err) => console.error("❌ Redis Publisher Error:", err));
redisSubscriber.on("error", (err) => console.error("❌ Redis Subscriber Error:", err));
