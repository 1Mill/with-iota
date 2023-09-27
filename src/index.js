import { JournalState } from './utils/journal-state.js'
import { Mongo } from './utils/mongo.js'
import { MutationState } from './utils/mutation-state.js'
import { RapidsState } from './utils/rapids-state.js'
import { fetchEnv } from './utils/fetchEnv.js'

export const SKIPPED = 'SKIPPED'

const EVENETBUS_NAME = fetchEnv(['MILL_KAPPA_EVENTBUS_NAME'], 'default')
const MONGO_DB       = fetchEnv(['MILL_KAPPA_MONGO_DB'])
const MONGO_URI      = fetchEnv(['MILL_KAPPA_MONGO_URI'])
const SERVICE_ID     = fetchEnv(['MILL_KAPPA_SERVICE_ID'])

const mongo = new Mongo({ db: MONGO_DB, uri: MONGO_URI })

const journal = new JournalState({ id: SERVICE_ID, mongo })

export const withIota = async (cloudevent = {}, ctx = {}, { func }) => {
	// * To reuse database connections between invocations, we must stop
	// * AWS from closing the connection. This way, the connection remains
	// * open and ready for immediate use whenever the next cloudevent
	// * comes in.
	// * https://www.mongodb.com/docs/atlas/manage-connections-aws-lambda/#manage-connections-with-aws-lambda
	ctx.callbackWaitsForEmptyEventLoop = false

	const mutation = new MutationState({ mongo })
	const rapids   = new RapidsState({
		cloudevent,
		eventBusName: EVENETBUS_NAME,
		source: SERVICE_ID,
	})

	try {
		const { skip } = await journal.entry({ cloudevent })
		if (skip) { return SKIPPED }

		const response = await func({ cloudevent, ctx, mutation, rapids })


		const { client } = await mongo.connect()
		const session = client.startSession()
		try {
			await session.withTransaction(async () => {
				await Promise.all([
					journal.done({
						cloudevent,
						mutations: mutation.staged,
						rapids: rapids.staged,
						session,
					}),
					mutation.commit({ session }),
				])
			})
		} finally {
			await session.endSession();
		}

		return response
	} catch (err) {
		await journal.erase({ cloudevent })

		throw err
	} finally {
		await rapids.commit()
	}
}
