import { describe, it } from 'mocha';
import assert from 'node:assert/strict';
import { timeout } from '../timeout.js';
import { sleep } from '../sleep.js';

describe('timeout', () => {
  it('resolves with original value if original promise resolves within time frame', async () => {
    assert.equal(await timeout(Promise.resolve('test'), 100), 'test');
  });

  it('rejects with original value if original promise rejects within time frame', async () => {
    await assert.rejects(timeout(Promise.reject('an error'), 100), /an error/);
  });

  it('rejects with a timeout message if time is up and original promise is pending', async () => {
    await assert.rejects(timeout(sleep(200), 50), /timed out after 50ms/);
  });

  it('allows providing a custom timeout message', async () => {
    await assert.rejects(timeout(sleep(200), 50, 'FAILED!'), /FAILED!/);
  });

  it('allows providing a custom timeout message from callback', async () => {
    await assert.rejects(
      timeout(sleep(200), 50, () => 'FAILED!'),
      /FAILED!/
    );
  });
});
