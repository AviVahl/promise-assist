import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { retry, sleep } from '../src';
import { stub } from './stub';

chai.use(chaiAsPromised);
const NO_ADDITIONAL_CALLS_GRACE = 200;

describe('retry', function() {
    this.timeout(5000);

    it('resolves value returned by a resolved action', async () => {
        const alwaysResolve = stub(() => Promise.resolve('OK'));

        await expect(retry(alwaysResolve)).to.eventually.become('OK');
        await sleep(NO_ADDITIONAL_CALLS_GRACE);
        expect(alwaysResolve.calls.length).to.equal(1);
    });

    it('rejects if action is always rejecting', async () => {
        const alwaysReject = stub(() => Promise.reject('FAIL'));

        await expect(retry(alwaysReject)).to.eventually.be.rejectedWith('FAIL');
    });

    it('retries 3 times by default', async () => {
        const resolveOnFour = stub(callNum => (callNum >= 4 ? Promise.resolve('OK') : Promise.reject('FAIL')));

        const resolveOnFive = stub(callNum => (callNum >= 5 ? Promise.resolve('OK') : Promise.reject('FAIL')));

        await expect(retry(resolveOnFour)).to.eventually.become('OK');
        await expect(retry(resolveOnFive)).to.eventually.be.rejectedWith('FAIL');
        await sleep(NO_ADDITIONAL_CALLS_GRACE);
        expect(resolveOnFour.calls.length).to.equal(4); // first try and then 3 additional re-tries
        expect(resolveOnFive.calls.length).to.equal(4);
    });

    it('allows specifying number of retries', async () => {
        const resolveOnFour = stub(callNum => (callNum >= 4 ? Promise.resolve('OK') : Promise.reject('FAIL')));

        await expect(retry(resolveOnFour, { retries: 2 })).to.eventually.be.rejectedWith('FAIL');
        await sleep(NO_ADDITIONAL_CALLS_GRACE);
        expect(resolveOnFour.calls.length).to.equal(3); // first try and then 2 additional re-tries
    });

    it('retries infinite number of times when passed Infinity ', async () => {
        const resolveOnHundred = stub(callNum => (callNum >= 100 ? Promise.resolve('OK') : Promise.reject('FAIL')));

        await expect(retry(resolveOnHundred, { retries: Infinity })).to.eventually.become('OK');
        await sleep(NO_ADDITIONAL_CALLS_GRACE);
        expect(resolveOnHundred.calls.length).to.equal(100);
    });

    it('rejects with custom message if no/empty error message', async () => {
        const alwaysReject = stub(() => Promise.reject());

        await expect(retry(alwaysReject)).to.eventually.be.rejectedWith('failed after 4 tries');
        await sleep(NO_ADDITIONAL_CALLS_GRACE);
        expect(alwaysReject.calls.length).to.equal(4); // first try and then 3 additional re-tries
    });

    it('allows delaying re-tries', async () => {
        const resolveOnThree = stub(callNum => (callNum >= 3 ? Promise.resolve('OK') : Promise.reject()));
        const delay = 100;

        await expect(retry(resolveOnThree, { delay })).to.eventually.become('OK');
        await sleep(NO_ADDITIONAL_CALLS_GRACE);
        expect(resolveOnThree.calls.length).to.equal(3); // first try and then 2 additional re-tries

        const [firstCall, secondCall, thirdCall] = resolveOnThree.calls;
        expect(secondCall.calledAt - firstCall.calledAt).to.be.gte(delay * 0.95);
        expect(thirdCall.calledAt - secondCall.calledAt).to.be.gte(delay * 0.95);
    });

    describe('timeout', () => {
        it('allows setting a timeout, and resolves if action finished before timeout expires', async () => {
            const resolveInHundred = stub(() => sleep(100).then(() => Promise.resolve('OK')));
            const timeout = 150;

            await expect(retry(resolveInHundred, { timeout })).to.eventually.become('OK');

            await sleep(NO_ADDITIONAL_CALLS_GRACE);
            expect(resolveInHundred.calls.length).to.equal(1); // resolve on first call
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
            await expect(retry(neverFulfill, { timeout })).to.eventually.be.rejectedWith('timed out after 100ms');
            expect(Date.now() - beforeActionDate).to.be.gte(timeout * 0.95);
            await sleep(NO_ADDITIONAL_CALLS_GRACE);
            expect(neverFulfill.calls.length).to.equal(1); // timeout while first try
        });

        it('exposes last error if timeout expires during delay', async () => {
            const alwaysReject = stub(() => Promise.reject('FAIL'));
            const delay = 200;
            const timeout = 100;

            await expect(retry(alwaysReject, { delay, timeout })).to.eventually.be.rejectedWith('FAIL');
            await sleep(delay * 2);
            expect(alwaysReject.calls.length).to.equal(1); // first try and then timeout while delay
        });

        it('has default timeout message if no error is exposed', async () => {
            const alwaysReject = stub(() => Promise.reject());
            const delay = 200;
            const timeout = 100;

            await expect(retry(alwaysReject, { delay, timeout })).to.eventually.be.rejectedWith(
                'timed out after 100ms'
            );
            await sleep(delay * 2);
            expect(alwaysReject.calls.length).to.equal(1); // first try and then timeout while delay
        });

        if (typeof Error.captureStackTrace === 'function') {
            it('shows stack trace', async () => {
                const alwaysReject = stub(() => Promise.reject());
                const delay = 200;
                const timeout = 100;

                await expect(retry(alwaysReject, { delay, timeout })).to.eventually.be.rejectedWith(__filename);
                await sleep(delay * 2);
                expect(alwaysReject.calls.length).to.equal(1); // first try and then timeout while delay
            });
        }
    });

    describe('sync action', () => {
        it('resolves with returned values', async () => {
            const syncReturn = stub(() => 'OK');

            await expect(retry(syncReturn)).to.eventually.become('OK');
            await sleep(NO_ADDITIONAL_CALLS_GRACE);
            expect(syncReturn.calls.length).to.equal(1); // first try
        });

        it('exposes exceptions', async () => {
            const syncException = stub(() => {
                throw new Error('FAIL');
            });

            await expect(retry(syncException)).to.eventually.be.rejectedWith('FAIL');
            await sleep(NO_ADDITIONAL_CALLS_GRACE);
            expect(syncException.calls.length).to.equal(4); // first try and then three more re-tries
        });
    });
});
