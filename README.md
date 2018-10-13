# promise-assist

Several helper functions when working with native promises.

## API
---
### sleep

Useful for waiting a specific amount of time before continuing an operation.

```ts
import { sleep } from 'promise-assist'

async function myOperation() {
    const startTime = Date.now()
    await sleep(500)
    console.log(`${Date.now() - startTime}ms passed!`)
}
```
---
### timeout

Useful for limiting the amount of time an async Promise-based operation can take.

```ts
import { timeout } from 'promise-assist'

async function myOperation() {
    try {
        const data = await timeout(
            fetchDataFromServer(), // pass a Promise to the timeout function
            10000, // request will be limited to 10 seconds
            `failed loading required data from backend`
        )
        // do something with the data
    } catch (e) {
        // handle errors
    }
}
```
---
### deferred

Creates a deferred Promise, where `resolve`/`reject` are exposed to the place that holds the promise.

Generally bad practice, but there are use-cases where one mixes callback-based API with Promise API and this is helpful.
```ts
import { deferred } from 'promise-assist'

const { promise, resolve, reject } = deferred<string>()

// `resolve` or `reject` calls are reflected on `promise`
promise.then(value => console.log(value))
resolve('some text')
// 'some text' is printed to console
```
---

## License

MIT
