import { CREATE, DELETE, FEATURE_FLAG, INCREMENT } from './utils/mutation.js'
import { Cloudevent } from '@1mill/cloudevents'
import { withIota } from './index.js'

const main = async () => {
	console.log('Starting...')

	const promises = [...Array(20)].map(async (_, i) => {
		const cloudevent = {
			...new Cloudevent({
				data: JSON.stringify({ some: 'payload' }),
				originactor: 'user:admin#id=1234',
				source: 'some-source',
				type: 'cmd.create-feature-flag.v0',
				wschannel: 'some-prefix:my-channel-name#id=4321',
			}),
			id: i % 5, // ! Modify id for testing purposes
		}

		const func = async ({ cloudevent, ctx, rapids, state }) => {
			if (cloudevent.id === 0) { throw new Error('This error is expected and is testing the Journal.erase functionality.') }

			const sleepForMs = Math.floor(Math.random() * 7000)
			await new Promise((res) => setTimeout(res, sleepForMs))

			// * Create feature flag
			const mutation = state.queueMutation({
				action: CREATE,
				props: { name: `FF#${cloudevent.id}`, enabled: false },
				type: FEATURE_FLAG,
			})

			// * Add to feature flag count
			state.queueMutation({
				action: INCREMENT,
				id: mutation.id,
				props: { count: -1 },
				type: FEATURE_FLAG,
			})
			state.queueMutation({
				action: INCREMENT,
				id: mutation.id,
				props: { count: -1 },
				type: FEATURE_FLAG,
			})
			state.queueMutation({
				action: INCREMENT,
				id: mutation.id,
				props: { count: 2 },
				type: FEATURE_FLAG,
			})

			// * Delete created feature flag
			state.queueMutation({
				action: DELETE,
				id: mutation.id,
				type: FEATURE_FLAG,
			})


			// TODO: In a similar way to how mutations are aggrigated and finally committed after
			// TODO: the `return` happens. We must also accumulate rapids.async cloudevents so
			// TODO: that they are only emitted after as well. Ideally as part of the same DB
			// TODO: transaction so the mutations are reversed whenever an error occures during
			// TODO: this final "commit" set.

			// await rapids.async([
			// 	{
			// 		data: { id: featureFlag.id },
			// 		type: 'cmd.placeholder.v0',
			// 	},
			// 	{
			// 		data: { id: featureFlag.id },
			// 		type: 'fct.feature-flag-created.v0',
			// 	},
			// ])

			return `Created and then deleted feature flag ${mutation.props.name} (${mutation.id})`
		}

		return withIota(cloudevent, {}, { func })
	})

	const results = await Promise.allSettled(promises)
	console.log(results.map(r => r.value || r.reason))

	console.log('Finished')

	process.exit(0)
}

main()
