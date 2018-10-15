import { sleep } from './sleep'

export interface IRetryOptions {
    /**
     * Number of times to retry action if it rejects.
     * Pass `Infinity` for infinite retries.
     *
     * @default 3
     */
    retries?: number

    /**
     * Delay in ms between trials.
     *
     * @default 0 (no delay)
     */
    delay?: number

    /**
     * Timeout in ms to stop trying.
     *
     * @default 0 (no timeout)
     */
    timeout?: number
}

const defaultOptions: Required<IRetryOptions> = {
    retries: 3,
    delay: 0,
    timeout: 0
}

/**
 * Executes provided `action` and returns its value.
 * If `action` throws or rejects, it will retry execution
 * several times before failing.
 *
 * @param action sync or async callback
 * @param options customize behavior
 */
export async function retry<T>(
    action: () => T | Promise<T>,
    options?: IRetryOptions,
): Promise<T> {
    const { retries, delay, timeout } = { ...defaultOptions, ...options }

    let timedOut = false
    let timeoutId: number | undefined // so we can cancel the timeout rejection

    const timeoutPromise = new Promise<T>((_res, rej) => {
        if (timeout > 0) {
            timeoutId = setTimeout(() => {
                timedOut = true
                rej(new Error(`timed out after ${timeout}ms`))
            }, timeout)
        }
    })

    const maxAttempts = retries + 1
    let attemptCount = 0
    let lastError: Error

    do {
        attemptCount++
        try {
            const result = await Promise.race([action(), timeoutPromise])
            clearTimeout(timeoutId)
            return result
        } catch (e) {
            lastError = e
            await Promise.race([sleep(delay), timeoutPromise])
        }
    } while (!timedOut && (attemptCount < maxAttempts))

    clearTimeout(timeoutId)
    throw (lastError || new Error(`failed after ${attemptCount} tries`))
}

export function waitFor<T>(
    action: () => T | Promise<T>,
    options?: IRetryOptions
): Promise<T> {
    return retry(action, { delay: 10, timeout: 500, retries: Infinity, ...options })
}
