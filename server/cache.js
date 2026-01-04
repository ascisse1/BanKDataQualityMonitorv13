import { createClient } from 'redis';

// In-memory cache as fallback when Redis is not available
const memoryCache = new Map();

let redisClient = null;
let redisAvailable = false;

// Initialize Redis client
export const initRedisClient = async () => {
  try {
    // Create Redis client with configuration from environment variables
    redisClient = createClient({
      url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        connectTimeout: 10000,
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.log('❌ Too many Redis connection attempts, giving up');
            return new Error('Too many Redis connection attempts');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    // Handle Redis client errors
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err.message);
      redisAvailable = false;
    });

    // Connect to Redis
    await redisClient.connect();
    
    console.log('✅ Redis client connected successfully');
    redisAvailable = true;
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error.message);
    console.log('⚠️ Using in-memory cache as fallback');
    redisAvailable = false;
    return false;
  }
};

// Get data from cache
export const getCache = async (key) => {
  try {
    if (redisAvailable && redisClient && redisClient.isOpen) {
      const data = await redisClient.get(key);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } else {
      // Fallback to in-memory cache
      const cacheEntry = memoryCache.get(key);
      if (cacheEntry && cacheEntry.expiry > Date.now()) {
        return cacheEntry.data;
      }
      memoryCache.delete(key); // Clean up expired entry
      return null;
    }
  } catch (error) {
    console.error(`Error getting cache for key ${key}:`, error.message);
    
    // Try memory cache as fallback
    const cacheEntry = memoryCache.get(key);
    if (cacheEntry && cacheEntry.expiry > Date.now()) {
      return cacheEntry.data;
    }
    return null;
  }
};

// Set data in cache
export const setCache = async (key, data, ttl = 300) => {
  try {
    if (redisAvailable && redisClient && redisClient.isOpen) {
      await redisClient.set(key, JSON.stringify(data), {
        EX: parseInt(ttl, 10)
      });
      return true;
    } else {
      // Fallback to in-memory cache
      const expiry = Date.now() + (parseInt(ttl, 10) * 1000);
      memoryCache.set(key, { data, expiry });
      
      // Clean up memory cache if it gets too large
      if (memoryCache.size > 1000) {
        const oldestKey = [...memoryCache.keys()][0];
        memoryCache.delete(oldestKey);
      }
      return true;
    }
  } catch (error) {
    console.error(`Error setting cache for key ${key}:`, error.message);
    
    // Fallback to in-memory cache
    const expiry = Date.now() + (parseInt(ttl, 10) * 1000);
    memoryCache.set(key, { data, expiry });
    return true;
  }
};

// Delete data from cache
export const deleteCache = async (key) => {
  try {
    // Delete from both Redis and memory cache
    let redisResult = true;
    if (redisAvailable && redisClient && redisClient.isOpen) {
      redisResult = await redisClient.del(key);
    }
    
    const memoryResult = memoryCache.delete(key);
    return redisResult || memoryResult;
  } catch (error) {
    console.error(`Error deleting cache for key ${key}:`, error.message);
    // Try to delete from memory cache anyway
    memoryCache.delete(key);
    return false;
  }
};

// Clear all cache
export const clearCache = async () => {
  try {
    let redisResult = true;
    if (redisAvailable && redisClient && redisClient.isOpen) {
      redisResult = await redisClient.flushAll();
    }
    
    // Clear memory cache
    memoryCache.clear();
    console.log('Cache cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error.message);
    // Try to clear memory cache anyway
    memoryCache.clear();
    return false;
  }
};

// Close Redis connection
export const closeRedisConnection = async () => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
      console.log('Redis connection closed');
    }
    redisAvailable = false;
  } catch (error) {
    console.error('Error closing Redis connection:', error.message);
  }
};

// Cache middleware for Express
export const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Create a cache key based on the URL and query parameters
    const cacheKey = `api:${req.originalUrl || req.url}`;
    
    try {
      // Try to get data from cache
      const cachedData = await getCache(cacheKey);
      
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // If not in cache, store the original json method
      const originalJson = res.json;
      
      // Override res.json method to cache the response
      res.json = function(data) {
        // Store the data in cache
        setCache(cacheKey, data, duration).catch(err => {
          console.error(`Failed to cache data for ${cacheKey}:`, err.message);
        });
        
        // Call the original json method
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error(`Cache middleware error for ${cacheKey}:`, error.message);
      next();
    }
  };
};

// Get cache stats
export const getCacheStats = () => {
  return {
    redisAvailable,
    memorySize: memoryCache.size,
    timestamp: new Date().toISOString()
  };
};

export default {
  initRedisClient,
  getCache,
  setCache,
  deleteCache,
  clearCache,
  closeRedisConnection,
  cacheMiddleware,
  getCacheStats
};