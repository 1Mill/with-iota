# with-iota

## Getting started

1. Run `npm install @1mill/with-iota`
1. Configure your AWS Lambda handler

    ```node
    import { CREATE, DELETE, INCREMENT, SET, withIota } from '@1mill/with-iota'

    const func = async ({ cloudevent, ctx, data, mutation, rapids }) => {
      const { companyId, name } = data

      if (!companyId) { throw new Error('companyId is required') }
      if (!name) { throw new Error('name is required') }

      // * Create some record
      const { id } = mutation.stage({
        action: CREATE,
        props: { companyId, name, comment: 'Hello world!' },
        type: 'myRecords',
      })

      // * Enqueue cloudevent that will be emitted after all staged mutations
      // * are comitted.
      rapids.stage({
        data: { id },
        type: 'fct.my-record-created.v0',
      })

      // * Increment some value on a different record
      mutation.stage({
        action: INCREMENT,
        id: companyId,
        props: { recordsCount: 1 },
        type: 'companies',
      })

      // * Set a value on the record we just created
      mutation.stage({
        action: SET,
        id,
        props: { comment: 'Update this comment!' },
        type: 'myRecords'
      })

      // * Selete the record we just created
      mutation.stage({
        action: DELETE,
        id,
        type: 'myRecords',
      })

      // * Enqueue another cloudevent that will be emitted after all
      // * staged mutations are committed.
      rapids.stage({
        data: { id },
        type: 'fct.my-record-deleted.v0',
      })

      // * Return some value for calls with InvocationType set to RequestResponse.
      return cloudevent.id
    }

    export const handler = (cloudevent, ctx) => withIota(cloudevent, ctx, { func })
    // export const handler = (...args) => withIota(...args, { func })

    ```

## Interface

TODO

## Lifecycle

Despite the straggered nature of staged mutations and staged rapids cloudevents, all mutations are applied first in order. Then, all rapids cloudevents are emitted in order.

| Lifecycle | Commit order |
| --- | --- |
| ![Image communicating lifecycle](./images/lifecycle.jpg) | ![Image communicating that all mutations are applied first followed by all rapids cloudevents](/images/commit-order.jpg) |

## Development

1. Run `npm install`
1. Create `.env` file with with `AWS_ACCESS_KEY_ID`, `AWS_REGION`, and `AWS_SECRET_ACCESS_KEY`.
1. Run `docker compose up -d mongo mongo-admin`
1. Run `docker compose up test`
