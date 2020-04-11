import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { timeout, sleep } from '../src';

chai.use(chaiAsPromised);

describe('timeout', () => {
  it('resolves with original value if original promise resolves within time frame', async () => {
    await expect(timeout(Promise.resolve('test'), 100)).to.eventually.become('test');
  });

  it('rejects with original value if original promise rejects within time frame', async () => {
    await expect(timeout(Promise.reject('an error'), 100)).to.eventually.be.rejectedWith('an error');
  });

  it('rejects with a timeout message if time is up and original promise is pending', async () => {
    await expect(timeout(sleep(200), 50)).to.eventually.be.rejectedWith('timed out after 50ms');
  });

  it('allows providing a custom timeout message', async () => {
    await expect(timeout(sleep(200), 50, 'FAILED!')).to.eventually.be.rejectedWith('FAILED!');
  });
});
