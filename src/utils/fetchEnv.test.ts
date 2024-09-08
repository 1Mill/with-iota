import { createSandbox } from 'sinon'
import { expect } from 'chai'
import { fetchEnv } from './fetchEnv.js'

describe('fetchEnv', () => {
	const name1 = 'SOME_NAME'
	const name2 = 'SOME_OTHER_NAME'
	const name3 = 'YET_ANOTHER_NAME'

	const vars = [name1, name2, name3]


	const sandbox = createSandbox()

	afterEach(() => { sandbox.restore() })

	describe('without an env var match', () => {
		beforeEach(() => {
			sandbox.stub(process, 'env').value({})
		})

		describe('without a fallback', () => {
			it('returns undefined', () => {
				const result = fetchEnv({ vars })
				expect(result).to.be.undefined
			})
		})

		describe('with a fallback', () => {
			it('returns the fallback', () => {
				const fallback = 'some-fallback'
				const result = fetchEnv({ fallback, vars })
				expect(result).to.eq(fallback)
			})
		})
	})

	describe('with env var matches', () => {
		const expected = false

		beforeEach(() => {
			sandbox.stub(process, 'env').value({
				[name1]: undefined,
				[name2]: expected,
				[name3]: 'not-expected',
			})
		})

		it('returns the first match', () => {
			const result = fetchEnv({ vars })
			expect(result).to.eq(expected)
		})
	})
})
