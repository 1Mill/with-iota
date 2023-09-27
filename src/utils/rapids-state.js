import { Cloudevent } from '@1mill/cloudevents'
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge'

const client = new EventBridgeClient()

export class RapidsState {
	constructor({ cloudevent, source }) {
		this.originCloudevent = cloudevent
		this.source = source

		this.staged = []
	}

	async commit() {
		const Entries = this.staged.map(cloudevent => ({
			Detail: JSON.stringify(cloudevent),
			DetailType: 'cloudevent',
			EventBusName: 'default',
			Source: cloudevent.source,
		}))

		// TODO: A command cannot have 0 entries. So, if the number
		// TODO: of entries is 0 do not send any commands.

		console.log({ Entries })

		// TODO: A single command can only have up to 10 entries.
		// TODO: So, we need to chunk all entries into groups of 10
		// TODO: and send them off in indepdnent commands.
		// const command = new PutEventsCommand({ Entries })

		// await client.send(command)
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
