import { Journal } from './utils/journal.js'
import { Mongo } from './utils/mongo.js'
import { fetchEnv } from './utils/fetchEnv.js'

export const SKIPPED = 'SKIPPED'

const mongo = new Mongo({
	db:  fetchEnv(['MILL_KAPPA_MONGO_DB']),
	uri: fetchEnv(['MILL_KAPPA_MONGO_URI']),
})

const journal = new Journal({
	id: fetchEnv(['MILL_KAPPA_JOURNAL_ID']),
	mongo,
})

const rapids = 'TODO'

const state = 'TODO'

export const withKappa = async (cloudevent = {}, ctx = {}, { func }) => {
	// * To reuse database connections between invocations, we must stop
	// * AWS from closing the connection. This way, the connection remains
	// * open and ready for immediate use whenever the next cloudevent
	// * comes in.
	// * https://www.mongodb.com/docs/atlas/manage-connections-aws-lambda/#manage-connections-with-aws-lambda
	ctx.callbackWaitsForEmptyEventLoop = false

	try {
		const { skip } = await journal.entry({ cloudevent })
		if (skip) { return SKIPPED }

		return func({ cloudevent, ctx, rapids, state })
	} catch (err) {
		await journal.erase({ cloudevent })

		throw err
	}
}
