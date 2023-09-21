import { withKappa } from './index.js'

const main = async () => {
	console.log('Starting...')

	const promises = [...Array(1_000)].map(async (_, i) => {
		const cloudevent = {
			id: i % 10,
			source: 'abc',
			time: new Date().toISOString(),
			type: 'aaa',
		}

		return withKappa(cloudevent, {}, {
			func: ({ cloudevent, ctx }) => console.log('Running: ', cloudevent)
		})
	})
	await Promise.all(promises)

	console.log('Finished')

	process.exit(0)
}

main()
