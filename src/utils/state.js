export class State {
	constructor({ mongo }) {
		this.mongo = mongo
	}

	async _collection(name) {
		const { db } = await this.mongo.connect()
		const collection = db.collection(name)

		return collection
	}

	async mutate(mutations = []) {
		const { client } = await this.mongo.connect()
		const session = client.startSession()

		try {
			await session.withTransaction(async () => {
				const promises = mutations.map(async m => {
					const { recordType, create } = m
					const collection = await this._collection(recordType)

					return collection.insertOne({ ...create }, { session })
				})

				await Promise.all(promises)
			})
		} finally {
			await session.endSession();
		}

		// TODO: Either before or after mutations are applied to the state,
		// TODO: save the raw form of the mutations to the journal. This way
		// TODO: we can monitor which mutations are taking place and recreate
		// TODO: the state by re-running the mutations without having to re-run
		// TODO: the business logic itself.
	}
}
