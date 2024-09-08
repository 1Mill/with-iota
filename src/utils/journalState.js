const MONGODB_DUPLICATE_ERROR_CODE = 11000

export class JournalState {
	constructor({ id, mongo, name }) {
		// * A unique identifier for the service processing the cloudevent so multiple
		// * instances of the same service do not process the same cloudevent.
		this.id = id
		if (!this.id) { throw new Error('JournalState "id" is required') }

		this.mongo = mongo

		this.name = name
		if (!this.id) { throw new Error('JournalState "name" is required') }
	}

	async done({ cloudevent, mutations = [], rapids = [] }) {
		const filter = {
			'cloudevent.id': cloudevent.id,
			'cloudevent.source': cloudevent.source,
			'cloudevent.type': cloudevent.type,
			'service.id': this.id,
		}
		const update = {
			$set: {
				'service.endedAt': new Date().toISOString(),
				mutations,
				rapids,
			},
		}

		const collection = await this.mongo.collection(this.name)
		await collection.updateOne(filter, update)
	}

	async entry({ cloudevent }) {
		const collection = await this.mongo.collection(this.name)

		// * Create an index to make each journal entry unique.
		await collection.createIndex({ 'cloudevent.id': 1, 'cloudevent.source': 1, 'cloudevent.type': 1, 'service.id': 1 }, { unique: true })

		// * Check if a journal entry for a given cloudevent has already run.
		let skip = false
		try {
			const entry = {
				cloudevent,
				service: {
					id: this.id,
					startedAt: new Date().toISOString(),
					endedAt: null,
				},
				mutations: null,
				rapids: null,
			}

			// * This insert will fail if the entry already exists because
			// * of the unique index we created previously.
			await collection.insertOne(entry)
		} catch(err) {
			// * Throw all errors except for our expected duplicate errors.
			if (err.code !== MONGODB_DUPLICATE_ERROR_CODE) { throw err }
			skip = true
		}

		return { skip }
	}

	async erase({ cloudevent }) {
		const collection = await this.mongo.collection(this.name)

		// * Delete all records with the given cloudevents params in an
		// * overabundance of caution that multiple records may exist.
		await collection.deleteMany({
			'cloudevent.id': cloudevent.id,
			'cloudevent.source': cloudevent.source,
			'cloudevent.type': cloudevent.type,
			'service.id': this.id,
		})
	}
}
