# Build & Test Cloud Destinations

- [Local End-to-end Testing](#local-end-to-end-testing)
- [Unit Testing](#unit-testing)
- [Snapshot Testing](#snapshot-testing)
- [Canary Testing](#canary-testing)

## Actions Tester

In order to see a visual representation of the settings/mappings fields we provide a tool to preview and execute simulated actions mappings against your in development destination. For more information on how to use actions tester [click here](./actions_tester.md).

## Local End-to-end Testing

To test a destination action locally, you can spin up a local HTTP server through the Actions CLI.

```sh
# For more information, add the --help flag
./bin/run serve
```

The default port is set to `3000`. To use a different port, you can specify the `PORT` environment variable (e.g. `PORT=3001 ./bin/run serve`).

After running the `serve` command, select the destination you want to test locally. Once a destination is selected, the server should start up.

To test a specific destination action, you can send a Postman or cURL request with the following URL format: `https://localhost:<PORT>/<ACTION>`. A list of eligible URLs will also be provided by the CLI command when the server is spun up.

### Example

The following is an example of a cURL command for `google-analytics-4`'s `search` action. Note that `payload`, `settings`, and `auth` values are all optional in the request body. However, you must still pass in all required fields for the specific destination action under `payload`.

```sh
curl --location --request POST 'http://localhost:3000/search' \
--header 'Content-Type: application/json' \
--data '{
    "payload": {
        "client_id": "<CLIENT_ID>",
        "search_term": "<SEARCH_TERM>"
    },
    "settings": {
        "measurementId": "<MEASUREMENT_ID>",
        "apiSecret": "<API_SECRET>"
    },
    "auth": {
        "accessToken": "<ACCESS_TOKEN>",
        "refreshToken": "<REFRESH_TOKEN>"
    }
}'
```

### Testing Batches

Actions destinations that support batching, i.e. that have a `performBatch` handler implemented, can also be tested locally. Test events should be formatted similarly to the example above, with the exception that `payload` will be an array. Here is an example of `webhook`'s `send` action, with a batch `payload`.

```sh
curl --location --request POST 'http://localhost:3000/send' \
--header 'Content-Type: application/json' \
--data '{
    "payload": [{
        "url": "https://www.example.com",
        "method": "PUT",
        "data": {
            "cool": true
        }
    }],
    "settings": {},
    "auth": {}
}'
```

## Unit Testing

When building a destination action, you should write unit and end-to-end tests to ensure your action is working as intended. Tests are automatically run on every commit in Github Actions. Pull requests that do not include relevant tests will not be approved.

Today, our unit tests behave more like <i>integration tests</i> in that you are not only testing the `perform` operation/unit, but also how events + mappings get transformed and validated.

Run tests for all cloud destinations with `yarn cloud test` or target a specific destination with the `--testPathPattern` flag:

```
yarn cloud test --testPathPattern=src/destinations/sendgrid
```

### Mocking HTTP Requests

While testing, we want to avoid hitting external APIs. We use `nock` to intercept requests before they hit the network.

### Examples

`Testing events + mapping`

```sh
import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import SendGrid from '../index'

const testDestination = createTestDestination(SendGrid)

const SENDGRID_API_KEY = 'some random secret'

describe('SendGrid', () => {
  describe('createList', () => {
    it('should validate action fields', async () => {
      try {
        await testDestination.testAction('createList', {
          settings: { apiKey: SENDGRID_API_KEY },
          skipDefaultMappings: true
        })
      } catch (err) {
        expect(err.message).toContain("missing the required field 'name'.")
      }
    })

    it('should work', async () => {
      nock('https://api.sendgrid.com/v3')
        .post('/marketing/lists', { name: 'Some Name' })
        .reply(200)

      await testDestination.testAction('createList', {
        mapping: { name: 'Some Name' },
        settings: { apiKey: SENDGRID_API_KEY }
      })
    })
  })
})
```

`Testing authentication scheme with unit tests`

```sh
// ...

describe('SendGrid', () => {
  // ...

  describe('authentication', () => {
    it('should validate api keys', async () => {
      try {
        await testDestination.testAuthentication({ apiKey: 'secret' })
      } catch (err) {
        expect(err.message).toContain('API Key should be 32 characters')
      }
    })

    it('should test that authentication works', async () => {
      nock('https://api.sendgrid.com/v3')
        .get('/user/profile')
        .matchHeader('authorization', `Bearer some valid super secret api key`)
        .reply(200, {})

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrow()
    })
    it('should test that authentication fails', async () => {
      nock('https://api.sendgrid.com/v3')
        .get('/user/profile')
        .reply(403, {
          errors: [{ field: null, message: 'access forbidden' }]
        })

      try {
        await testDestination.testAuthentication({ apiKey: `nope this is an invalid key` })
      } catch (err) {
        expect(err.message).toContain('Credentials are invalid')
      }
    })
  })
})
```

## Snapshot Testing

Snapshot tests help developers understand how their changes affect the request body and the downstream tool. In `action-destinations`, they are automatically generated with both the `init` and `generate:action` CLI commands - the former creating destination-level snapshots and the latter creating action-level snapshots. These tests can be found in the `snapshot.test.ts` file under the `__tests__` folder.

The `snapshot.test.ts` file mocks an HTTP server using `nock`, and generates random test data (w/ `Chance`) based on the destination action's fields and corresponding data type. For each destination action, it creates two snapshot tests - one for all fields and another for just the required fields. To ensure deterministic tests, the `Chance` instance is instantiated with a fixed seed corresponding to the destination action name.

Once the actions under a new destination are complete, developers can run the following command to generate a snapshot file (`snapshot.test.ts.snap`) under `/__tests__/snapshots/`.

```
yarn jest --testPathPattern='./packages/destination-actions/src/destinations/<DESTINATION SLUG>' --updateSnapshot
```

## Canary Testing

Once you've created a pull request, you can publish a canary package. This can be useful when testing your changes with the `integrations` repository. To create a canary package, simply post a comment with the text `/publish-canary` on your pull request. After a few moments, the github-actions bot will reply with a comment letting you know that your canary package has been created. You can then view the created package on NPM [here](https://www.npmjs.com/package/@segment/action-destinations?activeTab=versions).

![image](https://user-images.githubusercontent.com/14829777/140416239-157a3e33-dff9-4322-8815-f66298bf43e1.png)
