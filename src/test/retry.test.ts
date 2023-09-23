import { describe, it } from 'mocha';
import assert from 'node:assert/strict';
import { retry } from '../retry.js';
import { sleep } from '../sleep.js';
import { IStubCall, stub } from './stub.js';

const NO_ADDITIONAL_CALLS_GRACE = 200;

describe('retry', function () {
  it('resolves value returned by a resolved action', async () => {
    const alwaysResolve = stub(() => Promise.resolve('OK'));

    assert.equal(await retry(alwaysResolve), 'OK');

    await sleep(NO_ADDITIONAL_CALLS_GRACE);

    assert.equal(alwaysResolve.calls.length, 1);
  });

  it('rejects if action is always rejecting', async () => {
    const alwaysReject = () => Promise.reject('FAIL');

    await assert.rejects(retry(alwaysReject), /FAIL/);
  });

  it('retries 3 times by default', async () => {
    const resolveOnFour = stub((callNum) => (callNum >= 4 ? Promise.resolve('OK') : Promise.reject('FAIL')));

    const resolveOnFive = stub((callNum) => (callNum >= 5 ? Promise.resolve('OK') : Promise.reject('FAIL')));

    assert.equal(await retry(resolveOnFour), 'OK');
    await assert.rejects(retry(resolveOnFive), /FAIL/);

    await sleep(NO_ADDITIONAL_CALLS_GRACE);
    assert.equal(resolveOnFour.calls.length, 4); // first try and then 3 additional re-tries
    assert.equal(resolveOnFive.calls.length, 4);
  });

  it('allows specifying number of retries', async () => {
    const resolveOnFour = stub((callNum) => (callNum >= 4 ? Promise.resolve('OK') : Promise.reject('FAIL')));

    await assert.rejects(retry(resolveOnFour, { retries: 2 }), /FAIL/);
    await sleep(NO_ADDITIONAL_CALLS_GRACE);
    assert.equal(resolveOnFour.calls.length, 3); // first try and then 2 additional re-tries
  });

  it('retries infinite number of times when passed Infinity ', async () => {
    const resolveOnHundred = stub((callNum) => (callNum >= 100 ? Promise.resolve('OK') : Promise.reject('FAIL')));

    await assert.equal(await retry(resolveOnHundred, { retries: Infinity }), 'OK');
    await sleep(NO_ADDITIONAL_CALLS_GRACE);
    assert.equal(resolveOnHundred.calls.length, 100);
  });

  it('rejects with custom message if no/empty error message', async () => {
    const alwaysReject = stub(() => Promise.reject());

    await assert.rejects(retry(alwaysReject), /failed after 4 tries/);
    await sleep(NO_ADDITIONAL_CALLS_GRACE);
    assert.equal(alwaysReject.calls.length, 4); // first try and then 3 additional re-tries
  });

  it('allows delaying re-tries', async () => {
    const resolveOnThree = stub((callNum) => (callNum >= 3 ? Promise.resolve('OK') : Promise.reject()));
    const delay = 100;

    assert.equal(await retry(resolveOnThree, { delay }), 'OK');
    await sleep(NO_ADDITIONAL_CALLS_GRACE);
    assert.equal(resolveOnThree.calls.length, 3); // first try and then 2 additional re-tries

    const [firstCall, secondCall, thirdCall] = resolveOnThree.calls as [IStubCall, IStubCall, IStubCall];
    assert.ok(secondCall.calledAt - firstCall.calledAt >= delay * 0.95);
    assert.ok(thirdCall.calledAt - secondCall.calledAt >= delay * 0.95);
  });

  describe('timeout', () => {
    it('allows setting a timeout, and resolves if action finished before timeout expires', async () => {
      const resolveInHundred = stub(() => sleep(100).then(() => Promise.resolve('OK')));
      const timeout = 150;

      assert.equal(await retry(resolveInHundred, { timeout }), 'OK');

      await sleep(NO_ADDITIONAL_CALLS_GRACE);
      assert.equal(resolveInHundred.calls.length, 1); // resolve on first call
    });

    it('rejects if provided timeout expires while action is still pending', async () => {
      const neverFulfill = stub(
        () =>
          new Promise(() => {
            /* never fulfills */
          })
      );
      const timeout = 100;

      const beforeActionDate = Date.now();
      await assert.rejects(retry(neverFulfill, { timeout }), /timed out after 100ms/);
      assert.ok(Date.now() - beforeActionDate >= timeout * 0.95);
      await sleep(NO_ADDITIONAL_CALLS_GRACE);
      assert.equal(neverFulfill.calls.length, 1); // timeout while first try
    });

    it('exposes last error if timeout expires during delay', async () => {
      const alwaysReject = stub(() => Promise.reject('FAIL'));
      const delay = 200;
      const timeout = 100;

      await assert.rejects(retry(alwaysReject, { delay, timeout }), /FAIL/);
      await sleep(delay * 2);
      assert.equal(alwaysReject.calls.length, 1); // first try and then timeout while delay
    });

    it('exposes last error if timeout expires during action', async () => {
      const sleepThenReject = stub(() => sleep(75).then(() => Promise.reject('FAIL')));
      const timeout = 100;

      await assert.rejects(retry(sleepThenReject, { timeout }), /FAIL/);
      assert.equal(sleepThenReject.calls.length, 2); // first try and then timeout while delay
    });

    it('has default timeout message if no error is exposed', async () => {
      const alwaysReject = stub(() => Promise.reject());
      const delay = 200;
      const timeout = 100;

      await assert.rejects(retry(alwaysReject, { delay, timeout }), /timed out after 100ms/);
      await sleep(delay * 2);
      assert.equal(alwaysReject.calls.length, 1); // first try and then timeout while delay
    });

    if (typeof Error.captureStackTrace === 'function') {
      it('shows stack trace', async () => {
        const alwaysReject = stub(() => Promise.reject());
        const delay = 200;
        const timeout = 100;

        const promise = retry(alwaysReject, { delay, timeout });
        try {
          await assert.rejects(promise);
          await promise; // to actually inspect stack in catch
        } catch (e) {
          assert.match((e as Error).stack!, /retry.test/);
        }
        await sleep(delay * 2);
        assert.equal(alwaysReject.calls.length, 1); // first try and then timeout while delay
      });
    }
  });

  describe('sync action', () => {
    it('resolves with returned values', async () => {
      const syncReturn = stub(() => 'OK');

      assert.equal(await retry(syncReturn), 'OK');
      await sleep(NO_ADDITIONAL_CALLS_GRACE);
      assert.equal(syncReturn.calls.length, 1); // first try
    });

    it('exposes exceptions', async () => {
      const syncException = stub(() => {
        throw new Error('FAIL');
      });

      await assert.rejects(retry(syncException), /FAIL/);
      await sleep(NO_ADDITIONAL_CALLS_GRACE);
      assert.equal(syncException.calls.length, 4); // first try and then three more re-tries
    });
  });
});
