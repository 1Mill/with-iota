import { Journal } from './utils/journal.js'
import { Mongo } from './utils/mongo.js'
import { Rapids } from './utils/rapids.js'
import { SKIP_ERASE } from './utils/throwError.js'
import { State } from './utils/state.js'
import { fetchEnv } from './utils/fetchEnv.js'

export const SKIPPED = 'SKIPPED'

const SERVICE_ID = fetchEnv(['MILL_KAPPA_SERVICE_ID'])

const mongo = new Mongo({
	db:  fetchEnv(['MILL_KAPPA_MONGO_DB']),
	uri: fetchEnv(['MILL_KAPPA_MONGO_URI']),
})

const journal = new Journal({
	id: SERVICE_ID,
	mongo,
})

export const withIota = async (cloudevent = {}, ctx = {}, { func }) => {
	// * To reuse database connections between invocations, we must stop
	// * AWS from closing the connection. This way, the connection remains
	// * open and ready for immediate use whenever the next cloudevent
	// * comes in.
	// * https://www.mongodb.com/docs/atlas/manage-connections-aws-lambda/#manage-connections-with-aws-lambda
	ctx.callbackWaitsForEmptyEventLoop = false

	try {
		const { skip } = await journal.entry({ cloudevent })
		if (skip) { return SKIPPED }

		const rapids = new Rapids({ cloudevent, source: SERVICE_ID })
		const state  = new State({ mongo })

		const response = await func({ cloudevent, ctx, rapids, state })


		const { client } = await mongo.connect()
		const session = client.startSession()
		try {
			await session.withTransaction(async () => {
				const mutations = await state.commit({ session })
				await journal.done({ cloudevent, mutations, session })
			})
		} finally {
			await session.endSession();
		}

		return response
	} catch (err) {
		if (!err.message.startsWith(SKIP_ERASE)) {
			await journal.erase({ cloudevent })
		}

		throw err
	}
}
