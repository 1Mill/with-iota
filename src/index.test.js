import { CREATE, DELETE, FEATURE_FLAG, INCREMENT, SET } from './utils/mutation.js'
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

		const func = async ({ cloudevent, ctx, mutation, rapids }) => {
			if (cloudevent.id === 0) { throw new Error('This error is expected and is testing the Journal.erase functionality.') }

			const sleepForMs = Math.floor(Math.random() * 7000)
			await new Promise((res) => setTimeout(res, sleepForMs))

			// * Create feature flag
			const {
				id: featureFlagId,
				props: { name: featureFlagName },
			} = mutation.stage({
				action: CREATE,
				props: { name: `FF#${cloudevent.id}`, enabled: false },
				type: FEATURE_FLAG,
			})

			// * Add to feature flag count
			mutation.stage({
				action: INCREMENT,
				id: featureFlagId,
				props: { count: -1 },
				type: FEATURE_FLAG,
			})
			mutation.stage({
				action: INCREMENT,
				id: featureFlagId,
				props: { count: -1 },
				type: FEATURE_FLAG,
			})
			mutation.stage({
				action: INCREMENT,
				id: featureFlagId,
				props: { count: 2 },
				type: FEATURE_FLAG,
			})

			// * Set attribute to a specific value on the feature flag
			mutation.stage({
				action: SET,
				id: featureFlagId,
				props: { hello: 'world' },
				type: FEATURE_FLAG,
			})

			// * Delete created feature flag
			mutation.stage({
				action: DELETE,
				id: featureFlagId,
				type: FEATURE_FLAG,
			})

			// * Stage multiple cloudevents to be sent to the rapids
			rapids.stage({
				data: { id: featureFlagId },
				type: 'cmd.placeholder.v0',
			})

			rapids.stage({
				data: { id: featureFlagId },
				type: 'fct.feature-flag-created.v0',
			})

			return `Created and then deleted feature flag ${featureFlagName} (${featureFlagId})`
		}

		return withIota(cloudevent, {}, { func })
	})

	const results = await Promise.allSettled(promises)
	console.log(results.map(r => r.value || r.reason))

	console.log('Finished')

	process.exit(0)
}

main()
