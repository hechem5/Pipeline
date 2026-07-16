import cron from 'node-cron';
import prisma from '../lib/prisma';

/**
 * Run the ghosted sweep synchronously.
 * Marks all APPLIED applications older than GHOSTED_THRESHOLD_DAYS as GHOSTED.
 *
 * Exported for manual triggering (e.g. tests, admin endpoints).
 */
export async function runGhostedSweep(): Promise<void> {
  const thresholdDays = parseInt(
    process.env.GHOSTED_THRESHOLD_DAYS ?? '21',
    10
  );

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - thresholdDays);

  const result = await prisma.application.updateMany({
    where: {
      status: 'APPLIED',
      lastStatusUpdate: {
        lt: cutoffDate,
      },
    },
    data: {
      status: 'GHOSTED',
    },
  });

  console.log(
    `[ghosted-sweep] ${new Date().toISOString()} — swept ${result.count} application(s) to GHOSTED ` +
      `(threshold: ${thresholdDays} days, cutoff: ${cutoffDate.toISOString()})`
  );
}

/**
 * Start the ghosted sweep cron job.
 * Runs at midnight (00:00) every day.
 *
 * Scheduled expression: '0 0 * * *'
 */
export function startGhostedSweep(): void {
  cron.schedule('0 0 * * *', async () => {
    try {
      await runGhostedSweep();
    } catch (err) {
      console.error(
        '[ghosted-sweep] Error during sweep:',
        err instanceof Error ? err.message : err
      );
    }
  });

  console.log('[ghosted-sweep] Scheduled daily ghosted sweep at midnight (00:00)');
}
