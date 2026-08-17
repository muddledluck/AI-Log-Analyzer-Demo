import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";
import type { AnalyzeResponse } from "./types.js";

const TTL_SECONDS = 60 * 60;
const memory = new Map<string, { value: AnalyzeResponse; expiresAt: number }>();

function redisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function hashLog(logText: string): string {
  return createHash("sha256").update(logText.trim()).digest("hex");
}

function cacheKey(hash: string): string {
  const mode = process.env.OPENAI_API_KEY ? "llm" : "mock";
  return `analysis:${mode}:${hash}`;
}

export async function getCached(
  hash: string
): Promise<AnalyzeResponse | null> {
  const key = cacheKey(hash);
  const redis = redisClient();

  if (redis) {
    const hit = await redis.get<AnalyzeResponse>(key);
    return hit ?? null;
  }

  const local = memory.get(key);
  if (!local) return null;
  if (Date.now() > local.expiresAt) {
    memory.delete(key);
    return null;
  }
  return local.value;
}

export async function setCached(
  hash: string,
  value: AnalyzeResponse
): Promise<void> {
  const key = cacheKey(hash);
  const redis = redisClient();

  if (redis) {
    await redis.set(key, value, { ex: TTL_SECONDS });
    return;
  }

  memory.set(key, {
    value,
    expiresAt: Date.now() + TTL_SECONDS * 1000,
  });
}

export function cacheBackend(): "upstash" | "memory" {
  return redisClient() ? "upstash" : "memory";
}
