import { nanoid } from 'nanoid'
import { sortObjectKeys } from './sortObjectKeys.js'

export enum MutationAction {
	CREATE = 'create',
	DELETE = 'delete',
	INCREMENT = 'increment',
	SET = 'set',
}

export enum MutationVersion {
	v2023_09_27 = '2023-09-27',
}

interface MutationProps {
	action: Mutation['action'],
	id?: Mutation['id'],
	props?: Mutation['props'],
	table: Mutation['table'],
	version?: Mutation['version'],
}

const PERMITTED_ACTIONS = Object.values(MutationAction)
const PERMITTED_VERSIONS = Object.values(MutationVersion)

export class Mutation {
	readonly action: MutationAction
	readonly id: string
	readonly props: object
	readonly table: string
	readonly version: MutationVersion

	constructor({ action, id, props, table, version }: MutationProps) {
		if (!PERMITTED_ACTIONS.includes(action)) { throw new Error(`Mutation action "${action}" is not valid`) }
		this.action = action

		const idValue = action === MutationAction.CREATE
			? id ?? `rn_${nanoid(33)}`
			: id
		if (!idValue) { throw new Error('Mutation id is required') }
		if (typeof idValue !== 'string') { throw new Error('Mutation id must be a string') }
		this.id = idValue

		const propsValue = sortObjectKeys(props || {})
		if (typeof propsValue !== 'object') { throw new Error('Mutation props must be an object') }
		this.props = propsValue

		if (!table) { throw new Error('Mutation table is required') }
		if (typeof table !== 'string') { throw new Error('Mutation table must be a string') }
		this.table = table

		const versionValue = version ?? MutationVersion.v2023_09_27
		if (!PERMITTED_VERSIONS.includes(versionValue)) { throw new Error(`Mutation version "${versionValue}" is not valid`) }
		this.version = versionValue
	}
}
