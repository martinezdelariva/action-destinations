# Action Destinations

Action Destinations are a way to build streaming destinations on Segment. To begin, follow the instructions in Get Started below.

Fore more detailed instruction, see the following READMEs:

- [Contributing Document](./CONTRIBUTING.md)
- [Create a Destination Action](./docs/create.md)
- [Build & Test Cloud Destinations](./docs/testing.md)
- [Troubleshooting](./docs/testing.md)
- [Authentication](./docs/authentication.md)
- [Mapping Kit](./packages/core/src/mapping-kit/README.md)
- [Destination Kit](./packages/core/src/destination-kit/README.md)

Table of Contents:

- [Get Started](#get-started)
- [Actions CLI](#actions-cli)
- [Example Destination](#example-destination)
- [Input Fields](#input-fields)
- [Default Values](#default-values)
- [perform function](#the-perform-function)
- [Batching Requests](#batching-requests)
- [HTTP Requests](#http-requests)

## Get started

### Local development

This is a monorepo with multiple packages leveraging [`lerna`](https://github.com/lerna/lerna) with [Yarn Workspaces](https://classic.yarnpkg.com/en/docs/workspaces):

- `packages/ajv-human-errors` - a wrapper around [AJV](https://ajv.js.org/) errors to produce more friendly validation messages
- `packages/browser-destinations` - destination definitions that run on device via Analytics 2.0
- `packages/cli` - a set of command line tools for interacting with the repo
- `packages/core` - the core runtime engine for actions, including mapping-kit transforms
- `packages/destinations-actions` - destination definitions and their actions
- `packages/destinations-subscriptions` - validates events against an action's subscription AST

### Getting set up

You'll need to have some tools installed locally to build and test action destinations.

- Yarn 1.x
- Node 14.17 (latest LTS, we recommand using [`nvm`](https://github.com/nvm-sh/nvm) for managing Node versions)

If you are a Segment employee you can directly `git clone` the repository locally. Otherwise you'll want to fork this repository for your organization to submit Pull Requests against the main Segment repository. Once you've got a fork, you can `git clone` that locally.

```sh
# Clone the repo locally
git clone <your fork or https://github.com/segmentio/action-destinations.git>
cd action-destinations

npm login
yarn login

# Requires node 14.17, optionally: nvm use 14.17
yarn --ignore-optional
yarn bootstrap
yarn build
yarn install

# Run unit tests to ensure things are working! All tests should pass :)
yarn test
```

### Actions CLI

In order to run the CLI (`./bin/run`), your current working directory needs to be the root of the `action-destinations` repository.

```sh
# see what's supported by the CLI
./bin/run --help

# scaffold a new destination
./bin/run init

# scaffold a new action within a destination
./bin/run generate:action <ACTION_NAME> <browser|server>

# generates TypeScript definitions for an integration
./bin/run generate:types

# start local development server
./bin/run serve
```

For specific information about each CLI command, please refer to this [README](https://github.com/segmentio/action-destinations/tree/main/packages/cli).

#### Troubleshooting CLI

If a CLI command fails to work properly, run the command with `DEBUG=*` at the beginning (e.g. `DEBUG=* ./bin/run serve`). This will produce a verbose debugging output, providing hints as to why something isn't working as expected. All of the CLI commands are also in the `./packages/cli/src/commands` directory if you need to inspect them further.

### Testing

Refer [here](./docs/testing.md) for more information about testing your destination actions.

## Debugging

Pass the Node flag `--inspect` when you run the local server, and then you can attach a debugger from your IDE. The `serve` command will pass any extra args/flags to the underlying Node process.

### Configuring

Action destinations are configured using a single Destination setting (`subscriptions`) that should contain a JSON blob of all subscriptions for the destination. The format should look like this:

```js
[
  {
    "subscribe": "<fql query>",
    "partnerAction": "<actionSlug>",

    // See ./packages/core/src/mapping-kit/README.md for documentation. The keys in this object should match the `action.fields`
    "mapping": { ... }
  }
]
```

Here's a full example:

```json
[
  {
    "subscribe": "type = 'track'",
    "partnerAction": "postToChannel",
    "mapping": {
      "text": {
        "@template": "Tracked! event={{event}}, {{properties.text}}"
      },
      "url": "https://hooks.slack.com/services/0HL7TC62R/0T276CRHL/8WvI6gEiE9ZqD47kWqYbfIhZ",
      "channel": "test-channel"
    }
  },
  {
    "subscribe": "type = 'identify'",
    "partnerAction": "postToChannel",
    "mapping": {
      "text": {
        "@template": "User identified! email={{email}}"
      },
      "url": "https://hooks.slack.com/services/0HL7TC62R/0T276CRHL/8WvI6gEiE9ZqD47kWqYbfIhZ",
      "channel": "test-channel"
    }
  }
]
```

## Example Destination

### Local File Structure

In your destination’s folder, you should see this general structure. The `index.ts` file (with the asterisk) is the entry point to your destination - the CLI expects you to export a destination definition there.

```
$ tree packages/destination-actions/src/destinations/slack
packages/destination-actions/src/destinations/slack
├── generated-types.ts
├── index.ts (*)
└── postToChannel
    ├── generated-types.ts
    └── index.ts
```

### Local Destination Definition

The main definition of your Destination will look something like this, and is what your index.ts should export as the default export:

```js
const destination = {
  name: 'Example Destination',

  // a human-friendly description that gets displayed to users. supports markdown
  description: '',

  // see "Authentication" section below
  authentication: {},

  // see "HTTP Requests" section below
  extendRequest: () => {}

  // see "Actions" section below
  actions: {}
}

export default destination
```

## Input Fields

For each action or authentication scheme you can define a collection of inputs as fields. Input fields are what users see in the Action Editor to configure how data gets sent to the destination or what data is needed for authentication. These fields (for the action only) are able to accept input from the Segment event.

Input fields have various properties that help define how they are rendered, how their values are parsed and more. Here’s an example:

```js
const destination = {
  // ...other properties
  actions: {
    postToChannel: {
      // ...
      fields: {
        webhookUrl: {
          label: 'Webhook URL',
          description: 'Slack webhook URL.',
          type: 'string',
          required: true
        },
        text: {
          label: 'Message',
          description: 'The text message to post to Slack',
          type: 'string',
          required: true
        }
      }
    }
  }
}
```

### Input Field Interface

Here's the full interface that input fields allow:

```ts
interface InputField {
  /** A short, human-friendly label for the field */
  label: string

  /** A human-friendly description of the field */
  description: string

  /** The data type for the field */
  type: 'string' | 'text' | 'number' | 'integer' | 'datetime' | 'boolean' | 'password' | 'object'

  /** Whether null is allowed or not */
  allowNull?: boolean

  /** Whether or not the field accepts multiple values (an array of `type`) */
  multiple?: boolean

  /** An optional default value for the field */
  default?: string | number | boolean | object | Directive

  /** A placeholder display value that suggests what to input */
  placeholder?: string

  /** Whether or not the field supports dynamically fetching options */
  dynamic?: boolean

  /** Whether or not the field is required */
  required?: boolean

  /**
   * Optional definition for the properties of `type: 'object'` fields
   * (also arrays of objects when using `multiple: true`)
   * Note: this part of the schema is not persisted outside the code
   * but is used for validation and typedefs
   */
  properties?: Record<string, InputField>

  /**
   * Format option to specify more nuanced 'string' types
   * @see {@link https://github.com/ajv-validator/ajv/tree/v6#formats}
   */
  format?:
    | 'date' // full-date according to RFC3339.
    | 'time' // time with optional time-zone.
    | 'date-time' // date-time from the same source (time-zone is mandatory). date, time and date-time validate ranges in full mode and only regexp in fast mode (see options).
    | 'uri' // full URI.
    | 'uri-reference' // URI reference, including full and relative URIs.
    | 'uri-template' // URI template according to RFC6570
    | 'email' // email address.
    | 'hostname' // host name according to RFC1034.
    | 'ipv4' // IP address v4.
    | 'ipv6' // IP address v6.
    | 'regex' // tests whether a string is a valid regular expression by passing it to RegExp constructor.
    | 'uuid' // Universally Unique IDentifier according to RFC4122.
    | 'password' // hint to the UI to hide/obfuscate input strings (applied automatically when using `type: 'password'`
    | 'text' // longer strings (applied automatically when using `type: 'text'`
}
```

## Default Values

You can set default values for fields. These defaults are not used at run-time, however. These defaults **pre-populate the initial value of the field when users first set up an action**.

Default values can be literal values that match the `type` of the field (e.g. a literal string: ` "``hello``" `) or they can be mapping-kit directives just like the values from Segment’s rich input in the app. It’s likely that you’ll want to use directives to the default value. Here are some examples:

```js
const destination = {
  // ...other properties
  actions: {
    doSomething: {
      // ...
      fields: {
        name: {
          label: 'Name',
          description: 'The person\'s name',
          type: 'string',
          default: { '@path': '$.traits.name' },
          required: true
        },
        email: {
          label: 'Email',
          description: 'The person\'s email address',
          type: 'string',
          default: { '@path': '$.properties.email_address' }
        }
      }
    }
  }
}
```

In addition to default values for input fields, you can also specify the defaultSubscription for a given action – this is the FQL query that will be automatically populated when a customer configures a new subscription triggering a given action.

## The `perform` function

The `perform` function defines what the action actually does. All logic and request handling happens here. Every action MUST have a `perform` function defined.

By the time the actions runtime invokes your action’s perform, payloads have already been resolved based on the customer’s configuration, validated against the schema, and can be expected to match the types provided in your `perform` function. You’ll get compile-time type-safety for how you access anything in the `data.payload` (the 2nd argument of the perform).

A basic example:

```js
const destination = {
  actions: {
    someAction: {
      // ...
      fields: {
        greeting: {
          label: 'Greeting',
          description: 'The text message to send',
          type: 'string',
          required: true
        }
      },
      // `perform` takes two arguments:
      // 1. the request client instance (extended with your destination's `extendRequest`
      // 2. the data bundle which includes `settings` for top-level authentication fields and the `payload` which contains all the validated, resolved fields expected by the action
      perform: (request, data) => {
        return request('https://example.com', {
          headers: { Authorization: `Bearer ${data.settings.api_key}` },
          json: data.payload
        })
      }
    }
  }
}
```

The perform method will be invoked once for every event subscription that triggers the action. If you need to support batching, we’ve begun rolling out experimental support for defining a `performBatch` function. Continue reading to learn about how that works.

## Batching Requests

Sometimes your customers have a lot of events, and your API supports a more efficient way to receive and process those large sets of data. We have early, experimental support for batching.

You can implement an _additional_ perform method named `performBatch` in the action definition, alongside the `perform` method. The method signature looks like identical to `perform` except the `payload` is an array of data, where each item is an object matching your action’s field schema:

```js
function performBatch(request, { settings, payload }) {
  return request('https://example.com/batch', {
    // `payload` is an array of objects, each matching your action's field definition
    json: payload
  })
}
```

This will give customers the ability to opt-in to batching (there may be trade-offs they need to consider before opting in). Each customer subscription will be given the ability to Enable Batching.

Keep in mind a few important things about how batching works:

- Batching can add latency while Segment accumulates events in batches internally. This can be up to a minute, currently, but this is subject to change at any time. Latency is lower when you send a higher volume of events.
- Batches may have to up 1,000 events, currently. This, too, is subject to change.
- Batch sizes are not guaranteed. Due to the way that batches are accumulated internally, you may see smaller batch sizes than you expect when sending low rates of events.

Additionally, you’ll need to coordinate with Segment’s R&D team for the time being. Please reach out to us in your dedicated Slack channel!

## HTTP Requests

Today, there is only one way to make HTTP requests in a destination: **Manual HTTP Requests**.

You can use the `request` object to make requests and curate responses. This `request` is injected as the first argument in all operation functions in the definition (for example, in an action’s `perform` function).

In addition to making manual HTTP requests, you can use the `extendRequest` helper to reduce boilerplate across actions and authentication operations in the definition:

```js
const destination = {
  // ...other properties
  extendRequest: (request, { settings }) => {
    return {
      headers: { Authorization: `Bearer ${settings.apiKey}` }
    }
  },

  actions: {
    doAThing: {
      // ...other properties
      perform: (request, data) => {
        // this request will have the Authorization header
        return request('https://example.com/api/me.json', {
          method: 'post',
          json: data
        })
      }
    }
  }
}
```

### HTTP Request Options

The request client is a thin wrapper around the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API), made available both in Node (via `node-fetch`) and in the browser (with the `whatwg-fetch` ponyfill as needed).

Both the `request(url, options)` function and the `extendRequest` return value also support all of the Fetch API and some additional `options`:

- `method`: HTTP method, default is `GET`.
- `headers`: HTTP request headers object as a plain object `{ foo: 1, bar: true }`.
- `json`: shortcut to automatically JSON.stringify into the request body and set the `content-type` header to `application/json`.
- `password`: Basic authentication password field. Will automatically get base64 encoded with the username and added to the request headers: `Authorization: Basic <username:password>`
- `searchParams`: URLSearchParams or a plain object that you want included in request url’s query string.
- `throwHttpErrors`: whether or not the request should throw an HTTPError for non-2xx responses. Default is `true`.
- `timeout`: Time in milliseconds when a request should be aborted. Default is `10000`.
- `username`: Basic authentication username field. Will automatically get base64 encoded with the password and added to the request headers: `Authorization: Basic <username:password>`

```js
const response = await request('https://example.com', {
  method: 'post',
  headers: { 'content-type': 'application/json' },
  json: { hello: 'world' },
  searchParams: { foo: 1, bar: true },
  username: 'my',
  password: 'secret',
  timeout: 10000,
  throwHttpErrors: true
})
```

### Differences from the Fetch API

There are a few subtle differences from the Fetch API which are meant to limit the interface to be a bit more predictable. We may consider loosening this to match the complete spec.

- the `url` argument can only be a string instead of also accepting a `Request` object or a `URL` object.
- `headers` can only be a plain object instead of also accepting a `Headers` object.
- some options and behaviors are not applicable to Node.js and will be ignored by `node-fetch`. See this list of [known differences](https://github.com/node-fetch/node-fetch/blob/1780f5ae89107ded4f232f43219ab0e548b0647c/docs/v2-LIMITS.md).
- `method` will automatically get upcased for consistency.

## License

MIT License

Copyright (c) 2022 Segment

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Contributing

All third party contributors acknowledge that any contributions they provide will be made under the same open source license that the open source project is provided under.
