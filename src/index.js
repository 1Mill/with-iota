import { Journal } from './utils/journal.js'
import { Mongo } from './utils/mongo.js'
import { fetchEnv } from './utils/fetchEnv.js'

const mongo = new Mongo({
	db:  fetchEnv(['MILL_KAPPA_DB']),
	uri: fetchEnv(['MILL_KAPPA_URI']),
})

const journal = new Journal({ mongo })

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
		const { response: cachedResponse, skip } = await journal.entry({ cloudevent })
		if (skip) { return cachedResponse }

		const response = func({ cloudevent, ctx, rapids, state })
		// journal.adjust({ cloudevent, response })

		return response
	} catch (err) {
		await journal.erase({ cloudevent })
		throw err
	}
}
