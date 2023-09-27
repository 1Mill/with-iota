import sortKeys from 'sort-keys'
import { nanoid } from 'nanoid'

// * Actions
export const CREATE = 'create'
export const DELETE = 'delete'
export const INCREMENT = 'increment'
export const SET = 'set'

const VALID_ACTIONS = Object.freeze([CREATE, DELETE, INCREMENT, SET])

// * Collections
export const FEATURE_FLAG = 'featureFlags'

const VALID_COLLECTIONS = Object.freeze([FEATURE_FLAG])

// * Versions
export const v2023_09_27 = '2023-09-27'

const VALID_VERSIONS = Object.freeze([v2023_09_27])

export class Mutation {
	constructor({
		action,
		id,
		props,
		type,
		version,
	}) {
		this.action = action
		if (!VALID_ACTIONS.includes(this.action)) { throw new Error(`Mutation action "${this.action}" is not valid`) }

		this.id = action === CREATE
			? id || nanoid()
			: id
		if (!this.id) { throw new Error('Mutation id is required') }
		if (typeof this.id !== 'string') { throw new Error('Mutation id must be a string') }

		this.props = sortKeys(props || {}, { deep: true })
		if (typeof this.props !== 'object') { throw new Error('Mutation props must be an object') }

		this.type = type
		if (!VALID_COLLECTIONS.includes(this.type)) { throw new Error(`Mutation type "${this.type}" is not valid`) }

		this.version = version || v2023_09_27
		if (!VALID_VERSIONS.includes(this.version)) { throw new Error(`Mutation version "${this.version}" is not valid`) }
	}
}
