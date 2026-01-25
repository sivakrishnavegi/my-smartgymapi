import { Queue } from "bullmq";
import redis from "./redis";
// We reuse the ioredis connection logic/config, but BullMQ creates its own connections usually.
// Best practice: Pass connection config to BullMQ.

const connection = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    // Add password/tls if needed from env
};

// Queue for Knowledge Ingestion (Heavy PDF parsing, Embedding generation)
export const ingestionQueue = new Queue("ai-knowledge-ingestion", {
    connection,
    defaultJobOptions: {
        attempts: 3, // Retry failed jobs 3 times
        backoff: {
            type: "exponential",
            delay: 1000,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500,     // Keep last 500 failed jobs for debugging
    }
});

// Setup queue events or worker in a separate file (worker.ts)
// For the API server, we mostly just need the Queue instance to 'add' jobs.
