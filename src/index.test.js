import { Cloudevent } from '@1mill/cloudevents'
import { withIota } from './index.js'
import { CREATE, FEATURE_FLAG } from './utils/state.js';

const main = async () => {
	console.log('Starting...')

	const promises = [...Array(20)].map(async (_, i) => {
		const cloudevent = {
			...new Cloudevent({
				data: JSON.stringify({ some: 'payload' }),
				originactor: 'user:admin#id=1234',
				source: 'some-source',
				type: 'cmd.some-type.v0',
				wschannel: 'some-prefix:my-channel-name#id=4321',
			}),
			id: i % 5, // ! Modify id for testing purposes
		}

		const func = async ({ cloudevent, ctx, state }) => {
			if (cloudevent.id === 0) { throw new Error('This error is expected and is testing the Journal.erase functionality.') }

			const sleepForMs = Math.floor(Math.random() * 7000)
			await new Promise((res) => setTimeout(res, sleepForMs))

			const mutations = await state.mutate([
				{
					action: CREATE,
					props: { name: `FF#${cloudevent.id}`, enabled: false },
					type: FEATURE_FLAG,
				}
			])

			const collection = await state.collection(FEATURE_FLAG)
			const featureFlag = await collection.findOne({ id: mutations[0].id })

			return `Created Feature Flag ${featureFlag.name} (${featureFlag.id})`
		}

		return withIota(cloudevent, {}, { func })
	})

	const results = await Promise.allSettled(promises)
	console.log(results.map(r => r.value || r.reason))

	console.log('Finished')

	process.exit(0)
}

main()
