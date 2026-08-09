import { OperationType } from './firebaseUtils';

// Simulate Sentry error logging
function captureException(error: Error, extra?: Record<string, any>) {
  console.error('[SENTRY CAPTURE]', error.message, extra);
}

export async function monitorFirestoreOp<T>(
  operationType: OperationType,
  path: string,
  op: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    return await op();
  } finally {
    const duration = performance.now() - start;
    
    // threshold in ms (enterprise level strictness)
    const LATENCY_THRESHOLD_MS = 300; 

    if (duration > LATENCY_THRESHOLD_MS) {
      const error = new Error(`High Firestore Latency Detected: ${duration.toFixed(0)}ms`);
      captureException(error, {
        tags: {
          issue_category: 'performance_bottleneck',
          operationType,
        },
        extra: {
          path,
          durationMs: duration,
        }
      });
    } else {
      // Normal logging (debug mode)
      // console.log(`[PERF] ${operationType} on ${path} took ${duration.toFixed(0)}ms`);
    }
  }
}
