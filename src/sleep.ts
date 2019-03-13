/**
 * Creates a delayed Promise that resolves
 * after waiting the provided ms
 *
 * @param ms milliseconds to wait before resolving the Promise
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
