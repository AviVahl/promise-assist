export type PromiseResolveCb<T> = (value?: T | PromiseLike<T>) => void
export type PromiseRejectCb = (reason?: any) => void

export interface IDeferredPromise<T> {
    promise: Promise<T>
    resolve: PromiseResolveCb<T>
    reject: PromiseRejectCb
}

/**
 * Creates a deferred Promise, where resolve/reject
 * are exposed to the place that holds the promise.
 *
 * Generally bad practice, but there are use-cases where one mixes
 * callback-based API with Promise API and this is helpful.
 */
export function deferred<T = void>(): IDeferredPromise<T> {
    let resolve!: PromiseResolveCb<T>
    let reject!: PromiseRejectCb
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })

    return { promise, resolve, reject }
}
