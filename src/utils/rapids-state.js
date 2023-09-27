import { Cloudevent } from '@1mill/cloudevents'
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge'
import { cluster } from 'radash'

const MAX_ENTRIES_PER_COMMAND = 10

const client = new EventBridgeClient()

export class RapidsState {
	constructor({ cloudevent, source }) {
		this.originCloudevent = cloudevent
		this.source = source

		this.staged = []
	}

	async commit() {
		if (this.staged.length <= 0) { return }

		const entries = this.staged.map(cloudevent => ({
			Detail: JSON.stringify(cloudevent),
			DetailType: 'cloudevent',
			EventBusName: 'default',
			Source: cloudevent.source,
		}))

		const chunkedEntries = cluster(entries, MAX_ENTRIES_PER_COMMAND)
		const promises = chunkedEntries.map(async Entries => {
			const command = new PutEventsCommand({ Entries })
			await client.send(command)
		})

		await Promise.all(promises)
	}

	stage(params) {
		const { data, datacontenttype } = params

		// * Automatically JSONify data if it is present and no datacontenttype is given.
		const dataParams = typeof data !== 'undefined' && typeof datacontenttype === 'undefined'
			? { data: JSON.stringify(data), datacontenttype: 'application/json' }
			: { data, datacontenttype }

		const cloudevent = new Cloudevent({
			...params,
			...dataParams,
			source: this.source,
		}).origin({ cloudevent: this.originCloudevent })

		this.staged.push(cloudevent)

		return cloudevent
	}
}
