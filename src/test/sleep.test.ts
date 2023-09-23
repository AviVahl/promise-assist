import { describe, it } from 'mocha';
import assert from 'node:assert/strict';
import { sleep } from '../sleep.js';

describe('sleep', () => {
  it('resolves after provided the ms', async () => {
    const startTime = Date.now();
    const delay = 50;

    await sleep(delay);

    const endTime = Date.now();
    assert.ok(endTime >= startTime + delay * 0.95, 'verify delay');
  });
});
