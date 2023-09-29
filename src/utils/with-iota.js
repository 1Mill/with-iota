import { JournalState } from './journal-state.js'
import { Mongo } from './mongo.js'
import { MutationState } from './mutation-state.js'
import { RapidsState } from './rapids-state.js'
import { fetchEnv } from './fetchEnv.js'

export const SKIPPED = 'SKIPPED'

const EVENETBUS_NAME = fetchEnv(['MILL_IOTA_EVENTBUS_NAME'], 'default')
const JOURNAL_NAME   = fetchEnv(['MILL_IOTA_JOURNAL_NAME'], 'iotaJournalEntries')
const MONGO_DB       = fetchEnv(['MILL_IOTA_MONGO_DB'])
const MONGO_URI      = fetchEnv(['MILL_IOTA_MONGO_URI'])
const SERVICE_ID     = fetchEnv(['MILL_IOTA_SERVICE_ID'])

const mongo = new Mongo({ db: MONGO_DB, uri: MONGO_URI })

const journal = new JournalState({
	id: SERVICE_ID,
	mongo,
	name: JOURNAL_NAME,
})

export const withIota = async (event = {}, ctx = {}, { func }) => {
	// * To reuse database connections between invocations, we must stop
	// * AWS from closing the connection. This way, the connection remains
	// * open and ready for immediate use whenever the next cloudevent
	// * comes in.
	// * https://www.mongodb.com/docs/atlas/manage-connections-aws-lambda/#manage-connections-with-aws-lambda
	ctx.callbackWaitsForEmptyEventLoop = false

	// * If the event is an AWS EventBridge Entry then the cloudevent will
	// * be in the details. Otherwise, assume the event itself is the
	// * cloudevent.
	const cloudevent = event?.detail || event

	if (typeof cloudevent.id !== 'string')     { throw new Error('Cloudevent id is required and must be a string') }
	if (typeof cloudevent.source !== 'string') { throw new Error('Cloudevent source is required and must be a string') }
	if (typeof cloudevent.type !== 'string')   { throw new Error('Cloudevent type is required and must be a string') }

	const mutation = new MutationState({ mongo })
	const rapids   = new RapidsState({
		cloudevent,
		eventBusName: EVENETBUS_NAME,
		source: SERVICE_ID,
	})

	try {
		// * Check for or add the cloudevent in the journal. If it exists,
		// * do not process this cloudevent agian.
		const { skip } = await journal.entry({ cloudevent })
		if (skip) { return SKIPPED }

		// * Try prasing JSON data to make data easier to work with for users.
		const { data: rawData, datacontenttype } = cloudevent
		const data = typeof rawData === 'string' && datacontenttype === 'application/json'
			? JSON.parse(rawData)
			: rawData

		// * Run business logic.
		const response = await func({
			cloudevent,
			ctx,
			data,
			event,
			mutation,
			rapids,
		})

		// * Apply side effects from business logic to the system.
		const { client } = await mongo.connect()
		const session = client.startSession()
		try {
			await session.withTransaction(async () => {
				await mutation.commit({ session })

				// ! Commit rapids after mutations so that any new
				// ! database values are usable by other services.
				await rapids.commit()
			})
		} finally {
			await session.endSession();
		}

		// * Mark the journal entry as done.
		await journal.done({
			cloudevent,
			mutations: mutation.staged,
			rapids: rapids.staged,
		})

		return response
	} catch (err) {
		// * If any error occures, erase the cloudevent entry from
		// * the journal so that processing may be attempted again.
		await journal.erase({ cloudevent })

		throw err
	}
}
