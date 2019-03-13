/**
 * Creates a new Promise that wraps a provided Promise with a timeout.
 * If the original Promise resolves/rejects before the timeout
 * expires, the new Promise will resolve/reject as usual,
 * otherwise, it will reject with a timeout message.
 *
 * @param originalPromise the original Promise to wrap with the timeout
 * @param ms milliseconds to wait before rejecting due to timeout
 * @param timeoutMessage optional custom timeout message
 */
export function timeout<T>(
    originalPromise: Promise<T>,
    ms: number,
    timeoutMessage = `timed out after ${ms}ms`
): Promise<T> {
    return new Promise((resolve, reject) => {
        const timerId = setTimeout(() => reject(new Error(timeoutMessage)), ms);

        originalPromise.then(
            resolvedValue => {
                clearTimeout(timerId);
                resolve(resolvedValue);
            },
            rejectReason => {
                clearTimeout(timerId);
                reject(rejectReason);
            }
        );
    });
}
