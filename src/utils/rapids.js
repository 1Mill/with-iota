import { Cloudevent } from '@1mill/cloudevents'

export class Rapids {
	constructor({ cloudevent, source }) {
		this.originCloudevent = cloudevent
		this.source = source
	}

	async async({ data, type }) {
		const ce = new Cloudevent({
			data: typeof data !== 'undefined' ? JSON.stringify(data) : data,
			source: this.source,
			type,
		}).origin({ cloudevent: this.originCloudevent })

		console.log(ce)
	}
}
