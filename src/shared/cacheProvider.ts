/**
 * Cache Abstraction Layer
 * Provides a pluggable interface for different cache implementations
 */

export interface CacheProvider {
  get(key: string): Promise<any> | any;
  set(key: string, value: any, ttlMs?: number): Promise<void> | void;
  delete(key: string): Promise<void> | void;
  clear(): Promise<void> | void;
  close?(): Promise<void> | void;
}

export interface CacheConfig {
  provider: 'memory' | 'redis' | 'memcached';
  ttlMs?: number;
  maxSize?: number;
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  memcached?: {
    servers: string[];
  };
}

/**
 * In-Memory Cache Implementation
 */
export class MemoryCache implements CacheProvider {
  private cache = new Map<string, { value: any; expires: number }>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }

  set(key: string, value: any, ttlMs: number = 3600000): void {
    // Evict oldest entry if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      value,
      expires: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Redis Cache Implementation (placeholder for now)
 * In production, this would use ioredis or redis client
 */
export class RedisCache implements CacheProvider {
  private config: NonNullable<CacheConfig['redis']>;

  constructor(config: NonNullable<CacheConfig['redis']>) {
    this.config = config;
    // TODO: Initialize Redis client
    console.warn('RedisCache is not fully implemented yet');
  }

  async get(key: string): Promise<any> {
    // TODO: Implement Redis get
    console.log(`Redis GET ${key} from ${this.config.host}:${this.config.port}`);
    return undefined;
  }

  async set(key: string, value: any, ttlMs?: number): Promise<void> {
    // TODO: Implement Redis set with TTL
    console.log(`Redis SET ${key} value=${JSON.stringify(value)} TTL=${ttlMs} to ${this.config.host}:${this.config.port}`);
  }

  async delete(key: string): Promise<void> {
    // TODO: Implement Redis delete
    console.log(`Redis DEL ${key} from ${this.config.host}:${this.config.port}`);
  }

  async clear(): Promise<void> {
    // TODO: Implement Redis clear
    console.log(`Redis FLUSHDB to ${this.config.host}:${this.config.port}`);
  }

  async close(): Promise<void> {
    // TODO: Close Redis connection
    console.log('Closing Redis connection');
  }
}

/**
 * Cache Factory
 */
export class CacheFactory {
  static create(config: CacheConfig): CacheProvider {
    switch (config.provider) {
      case 'memory':
        return new MemoryCache(config.maxSize);
      
      case 'redis':
        if (!config.redis) {
          throw new Error('Redis configuration required when provider is redis');
        }
        return new RedisCache(config.redis);
      
      case 'memcached':
        throw new Error('Memcached provider not implemented yet');
      
      default:
        throw new Error(`Unknown cache provider: ${config.provider}`);
    }
  }
}

/**
 * Cache Manager - Singleton for the application
 */
export class CacheManager {
  private static instance: CacheManager;
  private provider: CacheProvider;
  private defaultTtl: number;

  private constructor(config: CacheConfig) {
    this.provider = CacheFactory.create(config);
    this.defaultTtl = config.ttlMs || 3600000; // 1 hour default
  }

  static getInstance(config?: CacheConfig): CacheManager {
    if (!CacheManager.instance) {
      if (!config) {
        // Default to memory cache
        config = { provider: 'memory', maxSize: 1000, ttlMs: 3600000 };
      }
      CacheManager.instance = new CacheManager(config);
    }
    return CacheManager.instance;
  }

  async get(key: string): Promise<any> {
    return this.provider.get(key);
  }

  async set(key: string, value: any, ttlMs?: number): Promise<void> {
    return this.provider.set(key, value, ttlMs || this.defaultTtl);
  }

  async delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }

  async clear(): Promise<void> {
    return this.provider.clear();
  }

  async close(): Promise<void> {
    if (this.provider.close) {
      return this.provider.close();
    }
  }

  // Utility method to create cache keys with consistent hashing
  static createKey(...parts: (string | number)[]): string {
    return parts.join(':');
  }
}

// Helper to get cache configuration from environment
export function getCacheConfigFromEnv(): CacheConfig {
  const provider = (process.env.CACHE_PROVIDER || 'memory') as CacheConfig['provider'];
  const ttlMs = process.env.CACHE_TTL_MS ? parseInt(process.env.CACHE_TTL_MS) : 3600000;
  const maxSize = process.env.CACHE_MAX_SIZE ? parseInt(process.env.CACHE_MAX_SIZE) : 1000;

  const config: CacheConfig = {
    provider,
    ttlMs,
    maxSize,
  };

  if (provider === 'redis') {
    config.redis = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
    };
  }

  if (provider === 'memcached') {
    config.memcached = {
      servers: (process.env.MEMCACHED_SERVERS || 'localhost:11211').split(','),
    };
  }

  return config;
}