const { CREATE, DELETE, INCREMENT, SET, withIota } = require('./dist/bundle-node/with-iota.cjs')
const { Cloudevent } = require('@1mill/cloudevents')

const FEATURE_FLAG = 'featureFlags'

const main = async () => {
	console.log('Starting...')

	setTimeout(() => process.exit(1), 7000)

	const promises = [...Array(20)].map(async (_, i) => {
		const cloudevent = {
			...new Cloudevent({
				data: { name:`FF#${i}`},
				originactor: 'user:admin#id=1234',
				source: 'some-source',
				type: 'cmd.create-feature-flag.v0',
				wschannel: 'some-prefix:my-channel-name#id=4321',
			}),
			id: (i % 5).toString(), // ! Modify id for testing purposes
		}

		const func = async ({ cloudevent, ctx, data, findOne, mutation, rapids }) => {
			if (cloudevent.id === '0') { throw new Error('This error is expected and is testing the JournalState.erase functionality.') }

			const sleepForMs = Math.floor(Math.random() * 7000)
			await new Promise((res) => setTimeout(res, sleepForMs))

			const { name } = data

			// * Create feature flag and get generated ID from mutation
			const { id } = mutation.stage({
				action: CREATE,
				props: { name, enabled: false },
				table: FEATURE_FLAG,
			})

			// * Add to feature flag count
			mutation.stage({
				action: INCREMENT,
				id,
				props: { count: -1 },
				table: FEATURE_FLAG,
			})
			mutation.stage({
				action: INCREMENT,
				id,
				props: { count: -1 },
				table: FEATURE_FLAG,
			})
			mutation.stage({
				action: INCREMENT,
				id,
				props: { count: 2 },
				table: FEATURE_FLAG,
			})

			// * Set attribute to a specific value on the feature flag
			mutation.stage({
				action: SET,
				id,
				props: { hello: 'world' },
				table: FEATURE_FLAG,
			})

			// * Delete created feature flag
			mutation.stage({
				action: DELETE,
				id,
				table: FEATURE_FLAG,
			})

			// * Stage multiple cloudevents to be sent to the rapids
			rapids.stage({
				data: { id },
				type: 'cmd.do-something.v0',
			})

			rapids.stage({
				data: { id },
				type: 'fct.feature-flag-created.v0',
			})

			// * Get the last journal entry that exists in the database
			// * before these mutations are applied.
			const lastJournalEntry = await findOne('iotaJournalEntries', {}, { sort: { $natural: -1 } })
			console.log({ lastJournalEntry })

			return `Created and then deleted feature flag ${name} (${id})`
		}

		return withIota(cloudevent, {}, { func })
	})

	const results = await Promise.allSettled(promises)
	console.log(results.map(r => r.value || r.reason))

	console.log('Finished')

	process.exit(0)
}

main()
