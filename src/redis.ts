import { fastify } from ".";

const defaultTtlSec = 60 * 60 * 24 * 30; // 30 days in seconds

export const setValueOnRedis = async (
  key: string,
  value: string
): Promise<void> => {
  try {
    await fastify.redis.set(key, value, "EX", defaultTtlSec);
  } catch (error) {
    console.error("Error setting value in Redis:", error);
    throw error;
  }
};

export const getValueOnRedis = async (key: string): Promise<string | null> => {
  try {
    const value = await fastify.redis.get(key);
    return value;
  } catch (error) {
    console.error("Error getting value from Redis:", error);
    throw error;
  }
};

export const getValueOnRedisAndRenew = async (key: string) => {
  try {
    const value = await fastify.redis.get(key);
    if (!value) {
      return null;
    }
    await fastify.redis.expire(key, defaultTtlSec, "XX");
    return value;
  } catch (error) {
    console.error("Error renewing Redis value:", error);
    throw error;
  }
};
