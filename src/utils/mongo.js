export class Mongo {
	constructor({ db, uri }) {
		// * Inputs
		this.db = db
		if (!this.db) { throw new Error('Mongo "db" is required') }

		this.uri = uri
		if (!this.uri) { throw new Error('Mongo "uri" is required') }

		// * State
		this.clientPromise = undefined
	}

	// * https://docs.atlas.mongodb.com/best-practices-connecting-from-aws-lambda/
	async connect() {
		if (typeof this.clientPromise === 'undefined') {
			this.clientPromise = new MongoClient(this.uri).connect()
		}

		const client = await this.clientPromise
		const db = client.db(this.db)

		return { client, db }
	}
}
