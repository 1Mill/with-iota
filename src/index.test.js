import { withKappa } from './index.js'

const main = async () => {
	console.log('Starting...')

	const promises = [...Array(50)].map(async (_, i) => {
		const cloudevent = {
			id: i % 5,
			source: 'abc',
			time: new Date().toISOString(),
			type: 'aaa',
		}

		return withKappa(cloudevent, {}, {
			func: ({ cloudevent, ctx }) => {
				if (cloudevent.id === 0) { throw new Error('Testing Journal.erase') }
				console.log('Running: ', cloudevent)
			}
		})
	})
	await Promise.allSettled(promises)

	console.log('Finished')

	process.exit(0)
}

main()
