/**
 * Test helper.
 * Returns a new function that proxies return value of `callback`,
 * while recording calls and time of their execution.
 * It provides `callback` with the call number to help mock different
 * return values for different calls.
 */
export function stub<T>(
    callback: (callNumber: number) => T | Promise<T>
): IStub<T> {

    function actualStub() {
        actualStub.calls.push({ calledAt: Date.now() })
        return callback(actualStub.calls.length)
    }

    actualStub.calls = [] as IStubCall[]

    return actualStub
}

export interface IStub<T> {
    (): T | Promise<T>
    calls: IStubCall[]
}

export interface IStubCall {
    calledAt: number
}
