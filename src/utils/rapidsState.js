import { Cloudevent } from '@1mill/cloudevents'
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge'
import { cluster } from 'radash'
import { fetchEnv } from './fetchEnv.js'

const MAX_ENTRIES_PER_COMMAND = 10

const client = new EventBridgeClient({
	credentials: {
		accessKeyId:     fetchEnv({ vars: ['MILL_IOTA_AWS_ACCESS_KEY_ID',     'AWS_ACCESS_KEY_ID'] }),
		secretAccessKey: fetchEnv({ vars: ['MILL_IOTA_AWS_SECRET_ACCESS_KEY', 'AWS_SECRET_ACCESS_KEY'] }),
		sessionToken:    fetchEnv({ vars: ['MILL_IOTA_AWS_SESSION_TOKEN',     'AWS_SESSION_TOKEN'] }),
	},
	endpoint: fetchEnv({ vars: ['MILL_IOTA_AWS_ENDPOINT', 'AWS_ENDPOINT'] }),
	region:   fetchEnv({ vars: ['MILL_IOTA_AWS_REGION',   'AWS_REGION'] }),
})

export class RapidsState {
	constructor({ cloudevent, eventBusName, source }) {
		this.eventBusName = eventBusName
		if (!this.eventBusName) { throw new Error('RapidsState eventBusName is required') }

		this.originCloudevent = cloudevent
		this.source = source

		this.staged = []
	}

	async commit() {
		if (this.staged.length <= 0) { return }

		const entries = this.staged.map(cloudevent => ({
			Detail: JSON.stringify(cloudevent),
			DetailType: 'application/cloudevents+json',
			EventBusName: this.eventBusName,
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
		const cloudevent = new Cloudevent({
			...params,
			origin: this.originCloudevent,
			source: this.source,
		})

		this.staged.push(cloudevent)

		return cloudevent
	}
}
