import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  formatUserProperties,
  user_properties,
  params,
  client_id,
  user_id,
  engagement_time_msec
} from '../ga4-properties'

const normalizeEventName = (name: string, lowercase: boolean | undefined): string => {
  name = name.trim()
  name = name.replace(/\s/g, '_')

  if (lowercase) {
    name = name.toLowerCase()
  }
  return name
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Custom Event',
  description: 'Send any custom event',
  defaultSubscription: 'type = "track"',
  fields: {
    clientId: { ...client_id },
    user_id: { ...user_id },
    name: {
      label: 'Event Name',
      description:
        'The unique name of the custom event created in GA4. GA4 does not accept spaces in event names so Segment will replace any spaces with underscores. More information about GA4 event name rules is available in [their docs](https://support.google.com/analytics/answer/10085872?hl=en&ref_topic=9756175#event-name-rules&zippy=%2Cin-this-article.%2Cin-this-article).',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    lowercase: {
      label: 'Lowercase Event Name',
      description:
        'If true, the event name will be converted to lowercase before sending to Google. Event names are case sensitive in GA4 so enable this setting to avoid distinct events for casing differences. More information about GA4 event name rules is available in [their docs](https://support.google.com/analytics/answer/10085872?hl=en&ref_topic=9756175#event-name-rules&zippy=%2Cin-this-article.%2Cin-this-article).',
      type: 'boolean',
      default: false
    },
    user_properties: user_properties,
    engagement_time_msec: engagement_time_msec,
    params: { ...params }
  },
  perform: (request, { payload }) => {
    const event_name = normalizeEventName(payload.name, payload.lowercase)
    return request('https://www.google-analytics.com/mp/collect', {
      method: 'POST',
      json: {
        client_id: payload.clientId,
        user_id: payload.user_id,
        events: [
          {
            name: event_name,
            params: payload.params
          }
        ],
        ...formatUserProperties(payload.user_properties)
      }
    })
  }
}
export default action
