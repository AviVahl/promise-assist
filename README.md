# promise-assist

[![npm version](https://img.shields.io/npm/v/promise-assist.svg)](https://www.npmjs.com/package/promise-assist)

Several helper functions when working with native promises.

## API

### sleep

Useful for waiting a specific amount of time before continuing an operation.

```ts
import { sleep } from 'promise-assist';

async function myOperation() {
  const startTime = Date.now();
  await sleep(500);
  console.log(`${Date.now() - startTime}ms passed!`);
}
```

### timeout

Useful for limiting the amount of time an async Promise-based operation can take.

```ts
import { timeout } from 'promise-assist';

async function myOperation() {
  try {
    const data = await timeout(
      fetchDataFromServer(), // pass a Promise to the timeout function
      10000, // request will be limited to 10 seconds
      `failed loading required data from backend`
    );
    // do something with the data
  } catch (e) {
    // handle errors
  }
}
```

### deferred

Creates a deferred Promise, where `resolve`/`reject` are exposed to the place that holds the promise.

Generally a bad practice, but there are use-cases, such as mixing callback-based and Promise-based APIs, where this is helpful.

```ts
import { deferred } from 'promise-assist';

const { promise, resolve, reject } = deferred<string>();

// `resolve` or `reject` calls are reflected on `promise`
promise.then((value) => console.log(value));
resolve('some text');
// 'some text' is printed to console
```

### retry

Executes provided `action` (sync or async) and returns its value.
If `action` throws or rejects, it will retry execution several times before failing.

Defaults are:

- 3 retries
- no delay between retries
- no timeout to stop trying

These can be customized via a second optional `options` parameter.

```ts
import { retry } from 'promise-assist';

// with default options
retry(() => fetch('http://some-url/asset.json'))
  .then((value) => value.json())
  .then(console.log)
  .catch((e) => console.error(e));

// with custom options
retry(() => fetch('http://some-url/asset.json'), {
  retries: Infinity, // infinite number of retries
  delay: 10 * 1000, // 10 seconds delay between retries
  timeout: 2 * 60 * 1000, // 2 minutes timeout to stop trying
})
  .then((value) => value.json())
  .then(console.log)
  .catch((e) => console.error(e));
```

### waitFor

Same as `retry`, but with defaults that make more sense for tests:

- delay: `10`
- timeout: `1000`
- retries: `Infinity`

It can be used to wait for some assertion to pass.

```ts
import { waitFor } from 'promise-assist';

describe('suit', () => {
  it('should wait for an assertion to pass', async () => {
    let trueLater = false;
    setTimeout(() => {
      trueLater = true;
    }, 50);

    await waitFor(() => {
      expect(trueLater).to.equal(true);
    });
  });
});
```

## License

MIT
