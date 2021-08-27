import { sleep } from './sleep';

export interface IRetryOptions {
  /**
   * Number of times to retry action if it rejects.
   * Pass `Infinity` for infinite retries.
   *
   * @default 3
   */
  retries?: number;

  /**
   * Delay in ms between trials.
   *
   * @default 0 (no delay)
   */
  delay?: number;

  /**
   * Timeout in ms to stop trying.
   *
   * @default 0 (no timeout)
   */
  timeout?: number;
}

const defaultOptions: Required<IRetryOptions> = {
  retries: 3,
  delay: 0,
  timeout: 0,
};

const envCanCaptureStack = !!Error.captureStackTrace;

/**
 * Executes provided `action` and returns its value.
 * If `action` throws or rejects, it will retry execution
 * several times before failing.
 *
 * @param action sync or async callback
 * @param options customize behavior
 */
export async function retry<T>(action: () => T | Promise<T>, options?: IRetryOptions): Promise<T> {
  const { retries, delay, timeout } = { ...defaultOptions, ...options };

  let lastError: unknown; // we expose last error if all attempts failed
  let timedOut = false;
  let timeoutId!: ReturnType<typeof setTimeout>; // so we can cancel the timeout rejection
  let timeoutMessage = `timed out after ${timeout}ms`;
  if (envCanCaptureStack) {
    const stackProvider = { stack: '' };
    Error.captureStackTrace(stackProvider);
    timeoutMessage += `\n${stackProvider.stack}`;
  }

  const timeoutPromise = new Promise<T>((_res, rej) => {
    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        timedOut = true;
        if (!lastError) {
          lastError = new Error(timeoutMessage);
        }
        rej();
      }, timeout);
    }
  });

  const maxAttempts = retries + 1;
  let attemptCount = 0;

  do {
    attemptCount++;
    try {
      const actionResult = action();
      if (actionResult instanceof Promise) {
        // make sure we always save error of original promise
        // Promise.race below might loose it due to timeout
        actionResult.catch((e) => (lastError = e || lastError));
      }
      const result = (await Promise.race([actionResult, timeoutPromise])) as T;
      clearTimeout(timeoutId!);
      return result;
    } catch (e) {
      lastError = e || lastError;
    }
    if (delay > 0) {
      try {
        await Promise.race([sleep(delay), timeoutPromise]);
      } catch {
        /* we throw lastError at the end */
      }
    }
  } while (!timedOut && attemptCount < maxAttempts);

  clearTimeout(timeoutId!);
  throw lastError || new Error(`failed after ${attemptCount} tries`);
}

/**
 * @param options defaults to `{delay: 10, timeout: 1000, retries: Infinity }`
 */
export function waitFor<T>(action: () => T | Promise<T>, options?: IRetryOptions): Promise<T> {
  return retry(action, { delay: 10, timeout: 1000, retries: Infinity, ...options });
}
