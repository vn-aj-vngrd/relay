/** Register before publication; cleanup inspects the exact ID captured by the lifecycle. */
export async function withLifecycleCleanup(
  lifecycle: () => Promise<void>,
  cleanup: () => Promise<void>,
  onCleanupFailure: () => void
) {
  let lifecycleFailed = false;
  let lifecycleError: unknown;
  let cleanupFailed = false;
  let cleanupError: unknown;
  try {
    await lifecycle();
  } catch (error) {
    lifecycleFailed = true;
    lifecycleError = error;
  } finally {
    try {
      await cleanup();
    } catch (error) {
      cleanupFailed = true;
      cleanupError = error;
    }
  }
  if (cleanupFailed) onCleanupFailure();
  if (lifecycleFailed) throw lifecycleError;
  if (cleanupFailed) throw cleanupError;
}
