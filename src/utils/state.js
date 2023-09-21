export class State {
	constructor({ mongo }) {
		this.mongo = mongo
	}

	async _collection(name) {
		const { db } = await this.mongo.connect()
		const collection = db.collection(name)

		return collection
	}

	async mutations(mutations = []) {
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
	}
}
