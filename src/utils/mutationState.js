import { Mutation, MutationAction } from './mutation.js'

export class MutationState {
	constructor({ mongo }) {
		this.mongo = mongo

		this.staged = []
	}

	async commit() {
		const { client } = await this.mongo.connect()
		const session = client.startSession()

		try {
			for (const m of this.staged) {
				const {
					action,
					id,
					props,
					table,
					version,
				} = m

				const collection = await this.mongo.collection(table)

				switch (action) {
					case MutationAction.CREATE: {
						await collection.insertOne({ ...props, id }, { session })
						break
					}
					case MutationAction.DELETE: {
						await collection.deleteOne({ id }, { session })
						break
					}
					case MutationAction.INCREMENT: {
						await collection.updateOne({ id }, { $inc: props }, { session })
						break
					}
					case MutationAction.SET: {
						await collection.updateOne({ id }, { $set: props }, { session })
						break
					}
					default: {
						throw new Error(`Mutation action "${action}" for version "${version}" is not implemented`)
					}
				}
			}
		} finally {
			await session.endSession()
		}
	}

	stage(params) {
		const mutation = new Mutation(params)

		this.staged.push(mutation)

		return mutation
	}
}
