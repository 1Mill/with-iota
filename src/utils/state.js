import sortKeys from 'sort-keys'
import { nanoid } from 'nanoid'

// * Actions
export const CREATE = 'create'

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

	async _collection(name) {
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
				await Promise.all(computedMutations.map(async m => {
					const {
						action,
						id,
						props,
						type,
						version,
					} = m

					if (action !== CREATE) { throw new Error(`Mutation action "${type} is not valid`) }
					if (type !== FEATURE_FLAG) { throw new Error(`Mutation type "${type}" is not valid`) }
					if (version !== v2023_09_27) { throw new Error(`Mutation version "${version}" is not valid`) }

					const collection = await this._collection(type)

					return collection.insertOne({ ...props, id }, { session })
				}))

				await this.journal.done({ cloudevent: this.cloudevent, mutations: computedMutations })
			})
		} finally {
			await session.endSession();
		}
	}
}
