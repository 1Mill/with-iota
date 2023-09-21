import { Cloudevent } from '@1mill/cloudevents'
import { withKappa } from './index.js'

const main = async () => {
	console.log('Starting...')

	const promises = [...Array(15)].map(async (_, i) => {
		const cloudevent = {
			...new Cloudevent({
				data: JSON.stringify({ some: 'payload' }),
				originactor: 'user:admin#id=1234',
				source: 'some-source',
				type: 'cmd.some-type.v0',
				wschannel: 'some-prefix:my-channel-name#id=4321',
			}),
			id: i % 5, // ! Mutate id for testing purposes
		}

		return withKappa(cloudevent, {}, {
			func: async ({ cloudevent, ctx, state }) => {
				const { id, type, source } = cloudevent

				if (id === 0) { throw new Error('This error is expected and is testing the Journal.erase functionality.') }

				await state.mutations([
					{
						recordId: null,
						recordType: 'featureFlags',
						create: { enabled: false, name: `FF#${id}` },
					}
				])

				return { id, type, source }
			}
		})
	})

	const results = await Promise.allSettled(promises)
	console.log(results.map(r => r.value || r.reason))

	console.log('Finished')

	process.exit(0)
}

main()
