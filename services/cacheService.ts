import redis from '../config/redis';

class CacheService {
    private isEnabled: boolean;

    constructor() {
        this.isEnabled = process.env.AI_CACHE_ENABLED === 'true';
    }

    /**
     * Generate a multi-tenant safe cache key
     */
    public generateKey(prefix: string, tenantId: string, schoolId: string, suffix?: string): string {
        return `ai:${prefix}:${tenantId}:${schoolId}${suffix ? `:${suffix}` : ''}`;
    }

    /**
     * Get a value from cache
     */
    public async get<T>(key: string): Promise<T | null> {
        if (!this.isEnabled) return null;
        try {
            const data = await redis.get(key);
            if (!data) return null;
            return JSON.parse(data) as T;
        } catch (error) {
            console.error(`[CacheService] Get Error for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Set a value in cache with TTL (seconds)
     */
    public async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
        if (!this.isEnabled) return;
        try {
            const data = JSON.stringify(value);
            await redis.set(key, data, 'EX', ttlSeconds);
        } catch (error) {
            console.error(`[CacheService] Set Error for key ${key}:`, error);
        }
    }

    /**
     * Delete a specific key
     */
    public async del(key: string): Promise<void> {
        if (!this.isEnabled) return;
        try {
            await redis.del(key);
        } catch (error) {
            console.error(`[CacheService] Del Error for key ${key}:`, error);
        }
    }

    /**
     * Clear all keys matching a pattern (e.g., all dashboard keys for a school)
     */
    public async clearPattern(pattern: string): Promise<void> {
        if (!this.isEnabled) return;
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
                console.log(`[CacheService] Cleared ${keys.length} keys for pattern: ${pattern}`);
            }
        } catch (error) {
            console.error(`[CacheService] ClearPattern Error for pattern ${pattern}:`, error);
        }
    }
}

export const cacheService = new CacheService();
