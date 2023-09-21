const COLLECTION_NAME = 'journalEntries'
const MONGODB_DUPLICATE_ERROR_CODE = 11000

export class Journal {
	constructor({ mongo }) {
		this.mongo = mongo
	}

	async _collection() {
		const { db } = await this.mongo.connect()
		const collection = db.collection(COLLECTION_NAME)

		return collection
	}

	async entry({ cloudevent }) {
		const collection = await this._collection()

		// * Create unique index for cloudevents
		await collection.createIndex({ id: 1, source: 1, type: 1 }, { unique: true })

		// * Check if this cloudevent has already been run.
		let skip = false
		try {
			// ! Do not mutate the original cloudevent, so create and mutate
			// ! a clone of the cloudevent.
			const ce = { ...cloudevent }

			// * The insert will fail if this cloudevent is a duplicate because
			// * of the unique index we created above.
			await collection.insertOne(ce)
		} catch(err) {
			if (err.code !== MONGODB_DUPLICATE_ERROR_CODE) { throw err }
			skip = true
		}
		return { skip }
	}
}
