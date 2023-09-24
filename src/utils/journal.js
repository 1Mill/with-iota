const COLLECTION_NAME = 'journalEntries'
const KEY = 'serviceid'
const MONGODB_DUPLICATE_ERROR_CODE = 11000

export class Journal {
	constructor({ id, mongo }) {
		// * A unique identifier for the service processing the cloudevent so multiple
		// * instances of the same service do not process the same cloudevent.
		this.id = id
		if (!this.id) { throw new Error('Journal "id" is required') }

		this.mongo = mongo
	}

	async _collection() {
		const { db } = await this.mongo.connect()
		const collection = db.collection(COLLECTION_NAME)

		return collection
	}

	async done({ cloudevent, mutations }) {
		const collection = await this._collection()

		const { id, source, type } = cloudevent

		const filter = { id, source, type, [KEY]: this.id }
		const update = { $set: { endedAt: new Date(), mutations } }
		await collection.updateOne(filter, update)
	}

	async entry({ cloudevent }) {
		const collection = await this._collection()

		// * Create unique index for cloudevents
		await collection.createIndex({ [KEY]: 1, id: 1, source: 1, type: 1 }, { unique: true })

		// * Check if this cloudevent has already been run.
		let skip = false
		try {
			// ! Do not mutate the original cloudevent, so create and mutate
			// ! a clone of the cloudevent.
			const ce = {
				// ! Place journal attributes after spread so that they
				// ! cannot be overwritten by cloudevent attributes.
				...cloudevent,
				[KEY]: this.id,
				startedAt: new Date(),
				// ! ---
			}

			// * The insert will fail if this cloudevent is a duplicate because
			// * of the unique index we created above.
			await collection.insertOne(ce)
		} catch(err) {
			if (err.code !== MONGODB_DUPLICATE_ERROR_CODE) { throw err }
			skip = true
		}
		return { skip }
	}

	async erase({ cloudevent }) {
		const collection = await this._collection()

		// * Delete all records with the given cloudevents params in an
		// * overabundance of caution that multiple records may exist.
		const { id, source, type } = cloudevent
		await collection.deleteMany({ [KEY]: this.id, id, source, type })
	}
}
