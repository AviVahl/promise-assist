import { describe, it } from 'mocha';
import assert from 'node:assert/strict';
import { deferred } from '../deferred.js';

describe('deferred', () => {
  it('resolves with undefined by default', async () => {
    const { promise, resolve } = deferred();
    setTimeout(() => resolve(), 50);

    assert.equal(await promise, undefined);
  });

  it('resolves with original value if resolve is called', async () => {
    const { promise, resolve } = deferred<number>();
    setTimeout(() => resolve(2), 50);

    assert.equal(await promise, 2);
  });

  it('resolves with original value if reject is called', async () => {
    const { promise, reject } = deferred<number>();
    setTimeout(() => reject('FAILED!'), 50);

    await assert.rejects(promise, /FAILED!/);
  });
});
