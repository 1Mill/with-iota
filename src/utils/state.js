import { ADD, CREATE, DELETE, Mutation } from './mutation.js'
import { throwError } from './throwError.js'

export class State {
	constructor({ cloudevent, journal, mongo }) {
		this.cloudevent = cloudevent
		this.journal = journal
		this.mongo = mongo

		this.mutations = []
	}

	async collection(name) {
		const { db } = await this.mongo.connect()
		const collection = db.collection(name)

		return collection
	}

	async commit() {
		const { client } = await this.mongo.connect()
		const session = client.startSession()

		try {
			await session.withTransaction(async () => {
				for (const m of this.mutations) {
					const {
						action,
						id,
						props,
						type,
						version,
					} = m

					const collection = await this.collection(type)

					switch (action) {
						case ADD:
							await collection.updateOne({ id }, { $inc: props }, { session })
							break
						case CREATE:
							await collection.insertOne({ ...props, id }, { session })
							break
						case DELETE:
							await collection.deleteOne({ id }, { session })
							break
						default:
							throwError(`Mutation action "${action}" for version "${version}" is not implemented`)
					}
				}

				await this.journal.done({ cloudevent: this.cloudevent, mutations: this.mutations })
			})
		} finally {
			await session.endSession();
		}
	}

	queueMutation(params) {
		const mutation = new Mutation(params)
		this.mutations.push(mutation)

		return mutation
	}
}
