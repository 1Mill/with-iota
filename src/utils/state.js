import { nanoid } from 'nanoid';

export class State {
	constructor({ cloudevent, journal, mongo }) {
		this.cloudevent = cloudevent
		this.journal = journal
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

		const computedMutations = mutations.map(m => {
			m.create.id = m.recordId ?? nanoid()
			m.version   = '2023-09-27'

			return m
		})

		try {
			await session.withTransaction(async () => {
				await Promise.all(computedMutations.map(async m => {
					const { recordType, create } = m
					const collection = await this._collection(recordType)

					return collection.insertOne(create, { session })
				}))

				await this.journal.done({ cloudevent: this.cloudevent, mutations: computedMutations })
			})
		} finally {
			await session.endSession();
		}
	}
}
