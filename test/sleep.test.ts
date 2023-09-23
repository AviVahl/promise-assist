import { expect } from 'chai';
import { sleep } from '../src';

describe('sleep', () => {
  it('resolves after provided the ms', async () => {
    const startTime = Date.now();
    const delay = 50;

    await sleep(delay);

    const endTime = Date.now();
    expect(endTime, 'verify delay').to.be.gte(startTime + delay * 0.95);
  });
});
