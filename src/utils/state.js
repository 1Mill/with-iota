import sortKeys from 'sort-keys'
import { nanoid } from 'nanoid'
import { throwError } from './throwError.js'

// * Actions
export const CREATE = 'create'
export const DELETE = 'delete'

// * Collections
export const FEATURE_FLAG = 'featureFlags'

// * Versions
export const v2023_09_27 = '2023-09-27'

export class State {
	constructor({ cloudevent, journal, mongo }) {
		this.cloudevent = cloudevent
		this.journal = journal
		this.mongo = mongo
	}

	async collection(name) {
		const { db } = await this.mongo.connect()
		const collection = db.collection(name)

		return collection
	}

	async mutate(mutations = []) {
		const { client } = await this.mongo.connect()
		const session = client.startSession()

		const computedMutations = mutations.map(m => {
			m.version ??= v2023_09_27

			if (m.action === CREATE) {
				m.id ??= nanoid()
			}

			return sortKeys(m, { deep: true })
		})

		try {
			await session.withTransaction(async () => {
				const mutationPromises = computedMutations.map(async m => {
					const {
						action,
						id,
						props,
						type,
						version,
					} = m

					if (!id) { throwError(`Mutation id is required`) }
					if (type !== FEATURE_FLAG) { throwError(`Mutation type "${type}" is not valid`) }
					if (version !== v2023_09_27) { throwError(`Mutation version "${version}" is not valid`) }

					const collection = await this.collection(type)

					switch (action) {
						case CREATE:
							return collection.insertOne({ ...props, id }, { session })
						case DELETE:
							return collection.deleteOne({ id }, { session })
						default:
							throwError(`Mutation action "${action}" is not valid`)
					}
				})

				await Promise.all([
					...mutationPromises,
					this.journal.done({ cloudevent: this.cloudevent, mutations: computedMutations })
				])
			})
		} finally {
			await session.endSession();
		}

		return computedMutations
	}
}
