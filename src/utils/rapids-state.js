import { Cloudevent } from '@1mill/cloudevents'
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge'
import { throwError } from './throwError.js'

const client = new EventBridgeClient()

export class RapidsState {
	constructor({ cloudevent, source }) {
		this.originCloudevent = cloudevent
		this.source = source
	}

	async async(array) {
		try {
			const Entries = array.map(params => {
				const { data, datacontenttype } = params

				const dataParams = typeof data !== 'undefined' && typeof datacontenttype === 'undefined'
					? { data: JSON.stringify(data), datacontenttype: 'application/json' }
					: { data, datacontenttype }

				const ce = new Cloudevent({
					...params,
					...dataParams,
					source: this.source,
				}).origin({ cloudevent: this.originCloudevent })

				return {
					Detail: JSON.stringify(ce),
					DetailType: 'cloudevent',
					EventBusName: 'default',
					Source: ce.source
				}
			})

			const command = new PutEventsCommand({ Entries })

			await client.send(command)
		} catch (err) {
			throwError(err.message, { skipJournalErase: true })
		}
	}
}
