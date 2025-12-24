/**
 * Jamal Worker Service
 * Main worker that processes publishing jobs from the queue
 */

import { runWorker, type WorkerConfig } from "@/lib/jamal/publishingWorker";
import { createLogger } from "@/lib/logger";

const logger = createLogger("JamalWorker");

const WORKER_ID = process.env.WORKER_ID || `worker-${Date.now()}`;

/**
 * Start the Jamal publishing worker
 */
export function startJamalWorker(config?: Partial<WorkerConfig>): () => void {
  const workerConfig: WorkerConfig = {
    workerId: WORKER_ID,
    batchSize: parseInt(process.env.JAMAL_WORKER_BATCH_SIZE || "10", 10),
    pollIntervalMs: parseInt(process.env.JAMAL_WORKER_POLL_INTERVAL_MS || "5000", 10),
    enabled: process.env.JAMAL_WORKER_ENABLED !== "false",
    ...config,
  };

  logger.info("Starting Jamal worker", workerConfig);

  return runWorker(workerConfig);
}

/**
 * Run worker once (for testing or one-off execution)
 */
export async function runWorkerOnce(batchSize = 10): Promise<void> {
  const { processJob } = await import("@/lib/jamal/publishingWorker");
  const { getNextJob } = await import("@/lib/jamal/publishingQueue");

  for (let i = 0; i < batchSize; i++) {
    const job = await getNextJob(WORKER_ID);
    if (!job) {
      break;
    }

    await processJob(job);
  }
}

