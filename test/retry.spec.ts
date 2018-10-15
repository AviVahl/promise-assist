import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { retry, sleep } from '../src'
import { stub } from './stub'

chai.use(chaiAsPromised)
const NO_ADDITIONAL_CALLS_GRACE = 200

describe('retry', () => {
    it('resolves value returned by a resolved action', async () => {
        const alwaysResolve = stub(() => Promise.resolve('OK'))

        await expect(retry(alwaysResolve)).to.eventually.become('OK')
        await sleep(NO_ADDITIONAL_CALLS_GRACE)
        expect(alwaysResolve.calls.length).to.equal(1)
    })

    it('rejects if action is always rejecting', async () => {
        const alwaysReject = stub(() => Promise.reject('FAIL'))

        await expect(retry(alwaysReject)).to.eventually.be.rejectedWith('FAIL')
    })

    it('retries 3 times by default', async () => {
        const resolveOnFour = stub(
            callNum => callNum >= 4 ? Promise.resolve('OK') : Promise.reject('FAIL')
        )

        const resolveOnFive = stub(
            callNum => callNum >= 5 ? Promise.resolve('OK') : Promise.reject('FAIL')
        )

        await expect(retry(resolveOnFour)).to.eventually.become('OK')
        await expect(retry(resolveOnFive)).to.eventually.be.rejectedWith('FAIL')
        await sleep(NO_ADDITIONAL_CALLS_GRACE)
        expect(resolveOnFour.calls.length).to.equal(4) // first try and then 3 additional re-tries
        expect(resolveOnFive.calls.length).to.equal(4)
    })

    it('allows specifying number of retries', async () => {
        const resolveOnFour = stub(
            callNum => callNum >= 4 ? Promise.resolve('OK') : Promise.reject('FAIL')
        )

        await expect(retry(resolveOnFour, { retries: 2 })).to.eventually.be.rejectedWith('FAIL')
        await sleep(NO_ADDITIONAL_CALLS_GRACE)
        expect(resolveOnFour.calls.length).to.equal(3) // first try and then 2 additional re-tries
    })

    it('retries infinite number of times when passed -1 ', async () => {
        const resolveOnThousand = stub(
            callNum => callNum >= 100 ? Promise.resolve('OK') : Promise.reject('FAIL')
        )

        await expect(retry(resolveOnThousand, { retries: -1 })).to.eventually.become('OK')
        await sleep(NO_ADDITIONAL_CALLS_GRACE)
        expect(resolveOnThousand.calls.length).to.equal(100)
    })

    it('rejects with custom message if no/empty error message', async () => {
        const alwaysReject = stub(() => Promise.reject())

        await expect(retry(alwaysReject)).to.eventually.be.rejectedWith('failed after 4 tries')
        await sleep(NO_ADDITIONAL_CALLS_GRACE)
        expect(alwaysReject.calls.length).to.equal(4) // first try and then 3 additional re-tries
    })

    it('allows delaying re-tries', async () => {
        const resolveOnThree = stub(callNum => callNum >= 3 ? Promise.resolve('OK') : Promise.reject())
        const delay = 100

        await expect(retry(resolveOnThree, { delay })).to.eventually.become('OK')
        await sleep(NO_ADDITIONAL_CALLS_GRACE)
        expect(resolveOnThree.calls.length).to.equal(3) // first try and then 2 additional re-tries

        const [firstCall, secondCall, thirdCall] = resolveOnThree.calls
        expect(secondCall.calledAt - firstCall.calledAt).to.be.gte(delay)
        expect(thirdCall.calledAt - secondCall.calledAt).to.be.gte(delay)
    })

    it('allows setting a timeout', async () => {
        const neverFulfill = stub(() => new Promise(() => { /* never fulfills */ }))
        const timeout = 100

        await expect(retry(neverFulfill, { timeout })).to.eventually.be.rejectedWith('timed out after 100ms')
        await sleep(NO_ADDITIONAL_CALLS_GRACE)
        expect(neverFulfill.calls.length).to.equal(1) // timeout while first try
    })

    it('allows setting a timeout with a delay', async () => {
        const alwaysReject = stub(() => Promise.reject())
        const delay = 200
        const timeout = 100

        await expect(retry(alwaysReject, { delay, timeout })).to.eventually.be.rejectedWith('timed out after 100ms')
        await sleep(delay * 2)
        expect(alwaysReject.calls.length).to.equal(1) // first try and then timeout while delay
    })

    it('resolves values of sync actions', async () => {
        const syncReturn = stub(() => 'OK')

        await expect(retry(syncReturn)).to.eventually.become('OK')
        await sleep(NO_ADDITIONAL_CALLS_GRACE)
        expect(syncReturn.calls.length).to.equal(1) // first try
    })

    it('handles sync exceptions from action', async () => {
        const syncException = stub(() => { throw new Error('FAIL') })

        await expect(retry(syncException)).to.eventually.be.rejectedWith('FAIL')
        await sleep(NO_ADDITIONAL_CALLS_GRACE)
        expect(syncException.calls.length).to.equal(4) // first try and then three more re-tries
    })
})
