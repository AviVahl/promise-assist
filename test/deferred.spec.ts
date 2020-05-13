import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { deferred } from '../src';

chai.use(chaiAsPromised);

describe('deferred', () => {
  it('resolves with undefined by default', async () => {
    const { promise, resolve } = deferred();
    setTimeout(() => resolve(), 50);

    await expect(promise).to.eventually.become(undefined);
  });

  it('resolves with original value if resolve is called', async () => {
    const { promise, resolve } = deferred<number>();
    setTimeout(() => resolve(2), 50);

    await expect(promise).to.eventually.become(2);
  });

  it('resolves with original value if reject is called', async () => {
    const { promise, reject } = deferred<number>();
    setTimeout(() => reject('FAILED!'), 50);

    await expect(promise).to.eventually.be.rejectedWith('FAILED!');
  });
});
