import { nanoid } from 'nanoid'
import { sortObjectKeys } from './sortObjectKeys'

// * Actions
export const CREATE = 'create'
export const DELETE = 'delete'
export const INCREMENT = 'increment'
export const SET = 'set'

const VALID_ACTIONS = Object.freeze([CREATE, DELETE, INCREMENT, SET])

// * Versions
export const v2023_09_27 = '2023-09-27'

const VALID_VERSIONS = Object.freeze([v2023_09_27])

export class Mutation {
	constructor({
		action,
		id,
		props,
		table,
		version,
	}) {
		this.action = action
		if (!VALID_ACTIONS.includes(this.action)) { throw new Error(`Mutation action "${this.action}" is not valid`) }

		this.id = action === CREATE
			? id || `rn_${nanoid(33)}`
			: id
		if (!this.id) { throw new Error('Mutation id is required') }
		if (typeof this.id !== 'string') { throw new Error('Mutation id must be a string') }

		this.props = sortObjectKeys(props || {})
		if (typeof this.props !== 'object') { throw new Error('Mutation props must be an object') }

		this.table = table
		if (!this.table) { throw new Error('Mutation table is required') }
		if (typeof this.table !== 'string') { throw new Error('Mutation table must be a string') }

		this.version = version || v2023_09_27
		if (!VALID_VERSIONS.includes(this.version)) { throw new Error(`Mutation version "${this.version}" is not valid`) }
	}
}
