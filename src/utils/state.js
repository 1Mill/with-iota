import { CREATE, DELETE, INCREMENT, Mutation, SET } from './mutation.js'
import { throwError } from './throwError.js'

export class State {
	constructor({ mongo }) {
		this.mongo = mongo

		this.mutations = []
	}

	async commit({ session }) {
		for (const m of this.mutations) {
			const {
				action,
				id,
				props,
				type,
				version,
			} = m

			const collection = await this.mongo.collection(type)

			switch (action) {
				case CREATE:
					await collection.insertOne({ ...props, id }, { session })
					break
				case DELETE:
					await collection.deleteOne({ id }, { session })
					break
				case INCREMENT:
					await collection.updateOne({ id }, { $inc: props }, { session })
					break
				case SET:
					await collection.updateOne({ id }, { $set: props }, { session })
					break
				default:
					throwError(`Mutation action "${action}" for version "${version}" is not implemented`)
			}
		}

		return this.mutations
	}

	queueMutation(params) {
		const mutation = new Mutation(params)
		this.mutations.push(mutation)

		return mutation
	}
}
