import { Cloudevent } from '@1mill/cloudevents'
import { throwError } from './throwError.js'

export class Rapids {
	constructor({ cloudevent, source }) {
		this.originCloudevent = cloudevent
		this.source = source
	}

	async async(params) {
		try {
			const { data, datacontenttype } = params

			const dataParams = typeof data !== 'undefined' && typeof datacontenttype === 'undefined'
				? { data: JSON.stringify(data), datacontenttype: 'application/json' }
				: { data, datacontenttype }

			const ce = new Cloudevent({
				...params,
				...dataParams,
				source: this.source,
			}).origin({ cloudevent: this.originCloudevent })

			console.log(ce)
		} catch (err) {
			throwError(err.message, { skipJournalErase: true })
		}
	}
}
