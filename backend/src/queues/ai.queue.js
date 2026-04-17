import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "../config/env.js";

let aiQueue;

const getQueue = () => {
  if (!aiQueue) {
    const connection = new IORedis({
      host: env.redisHost,
      port: env.redisPort,
      lazyConnect: true,
      maxRetriesPerRequest: null,
    });

    aiQueue = new Queue("ai-processing", { connection });
  }

  return aiQueue;
};

export const enqueueAiInsight = async (payload) => {
  try {
    const queue = getQueue();

    return await queue.add("generate-insight", payload, {
      removeOnComplete: 50,
      removeOnFail: 20,
    });
  } catch (_error) {
    return {
      id: "placeholder-job",
      name: "generate-insight",
      data: payload,
    };
  }
};
