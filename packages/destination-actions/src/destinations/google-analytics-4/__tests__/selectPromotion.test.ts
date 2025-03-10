import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import ga4 from '../index'

const testDestination = createTestIntegration(ga4)
const apiSecret = 'b287432uhkjHIUEL'
const measurementId = 'G-TESTTOKEN'

describe('GA4', () => {
  describe('Select Promotion', () => {
    it('should append user_properties correctly', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})

      const event = createTestEvent({
        event: 'Select Promotion',
        userId: 'abc123',
        anonymousId: 'anon-2134',
        type: 'track',
        properties: {
          id: '12345abcde',
          name: 'Quadruple Stack Oreos, 52 ct',
          currency: 'USD',
          price: 12.99,
          quantity: 1
        }
      })
      const responses = await testDestination.testAction('selectPromotion', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        mapping: {
          client_id: {
            '@path': '$.anonymousId'
          },
          user_properties: {
            hello: 'world',
            a: '1',
            b: '2',
            c: '3'
          },
          items: {
            item_id: {
              '@path': '$.properties.id'
            },
            promotion_name: {
              '@path': '$.properties.name'
            }
          }
        },
        useDefaultMappings: true
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"anon-2134\\",\\"events\\":[{\\"name\\":\\"select_promotion\\",\\"params\\":{\\"promotion_name\\":\\"Quadruple Stack Oreos, 52 ct\\",\\"items\\":[{\\"item_id\\":\\"12345abcde\\",\\"promotion_name\\":\\"Quadruple Stack Oreos, 52 ct\\"}],\\"engagement_time_msec\\":1}}],\\"user_properties\\":{\\"hello\\":{\\"value\\":\\"world\\"},\\"a\\":{\\"value\\":\\"1\\"},\\"b\\":{\\"value\\":\\"2\\"},\\"c\\":{\\"value\\":\\"3\\"}}}"`
      )
    })

    it('should handle basic mapping overrides', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Promotion Clicked',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          id: 'abc',
          promotion_id: 'promo_1',
          creative: 'top_banner_2',
          name: '75% store-wide shoe sale',
          position: 'home_banner_top'
        }
      })
      const responses = await testDestination.testAction('selectPromotion', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        mapping: {
          clientId: {
            '@path': '$.anonymousId'
          },
          engagement_time_msec: 2,
          location_id: {
            '@path': '$.properties.promotion_id'
          },
          items: {
            item_id: {
              '@path': '$.properties.id'
            },
            promotion_name: {
              '@path': '$.properties.name'
            }
          }
        },
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "content-type": Array [
              "application/json",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"3456fff\\",\\"events\\":[{\\"name\\":\\"select_promotion\\",\\"params\\":{\\"creative_slot\\":\\"top_banner_2\\",\\"location_id\\":\\"promo_1\\",\\"promotion_id\\":\\"promo_1\\",\\"promotion_name\\":\\"75% store-wide shoe sale\\",\\"items\\":[{\\"item_id\\":\\"abc\\",\\"promotion_name\\":\\"75% store-wide shoe sale\\"}],\\"engagement_time_msec\\":2}}]}"`
      )
    })

    it('should handle complete mapping', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Promotion Clicked',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          promotion_id: 'promo_1',
          creative: 'top_banner_2',
          creative_slot: '2',
          location: 'home',
          name: '75% store-wide shoe sale',
          position: 'home_banner_top',
          items: [
            {
              item_id: 'SKU_12345',
              item_name: 'jeggings',
              coupon: 'SUMMER_FUN',
              discount: 2.22,
              promotion_id: 'P_12345',
              promotion_name: 'Summer Sale',
              creative_slot: 'featured_app_1',
              location_id: 'L_12345',
              affiliation: 'Google Store',
              item_brand: 'Gucci',
              item_category: 'pants',
              item_variant: 'Black',
              price: 9.99,
              currency: 'USD'
            }
          ]
        }
      })
      const responses = await testDestination.testAction('selectPromotion', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        mapping: {
          clientId: {
            '@path': '$.anonymousId'
          },
          location_id: {
            '@path': '$.properties.location'
          },
          creative_name: {
            '@path': '$.properties.creative'
          },
          creative_slot: {
            '@path': '$.properties.creative_slot'
          },
          promotion_id: {
            '@path': '$.properties.promotion_id'
          },
          promotion_name: {
            '@path': '$.properties.name'
          },
          items: {
            '@path': '$.properties.items'
          }
        },
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "content-type": Array [
              "application/json",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"client_id\\":\\"3456fff\\",\\"events\\":[{\\"name\\":\\"select_promotion\\",\\"params\\":{\\"creative_name\\":\\"top_banner_2\\",\\"creative_slot\\":\\"2\\",\\"location_id\\":\\"home\\",\\"promotion_id\\":\\"promo_1\\",\\"promotion_name\\":\\"75% store-wide shoe sale\\",\\"items\\":[{\\"item_id\\":\\"SKU_12345\\",\\"item_name\\":\\"jeggings\\",\\"coupon\\":\\"SUMMER_FUN\\",\\"discount\\":2.22,\\"promotion_id\\":\\"P_12345\\",\\"promotion_name\\":\\"Summer Sale\\",\\"creative_slot\\":\\"featured_app_1\\",\\"location_id\\":\\"L_12345\\",\\"affiliation\\":\\"Google Store\\",\\"item_brand\\":\\"Gucci\\",\\"item_category\\":\\"pants\\",\\"item_variant\\":\\"Black\\",\\"price\\":9.99,\\"currency\\":\\"USD\\"}],\\"engagement_time_msec\\":1}}]}"`
      )
    })

    it('should throw error when product name and id is missing', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Promotion Clicked',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          promotion_id: 'promo_1',
          creative: 'top_banner_2',
          name: '75% store-wide shoe sale',
          position: 'home_banner_top',
          items: [
            {
              coupon: 'SUMMER_FUN',
              discount: 2.22,
              promotion_id: 'P_12345',
              promotion_name: 'Summer Sale',
              creative_slot: 'featured_app_1',
              location_id: 'L_12345',
              affiliation: 'Google Store',
              item_brand: 'Gucci',
              item_category: 'pants',
              item_variant: 'Black',
              price: 9.99,
              currency: 'USD'
            }
          ]
        }
      })

      try {
        await testDestination.testAction('selectPromotion', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          mapping: {
            clientId: {
              '@path': '$.anonymousId'
            },
            location_id: {
              '@path': '$.properties.promotion_id'
            },
            items: {
              '@path': '$.properties.items'
            }
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe('One of product name or product id is required for product or impression data.')
      }
    })

    it('should throw error when promotion name and id is missing', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Promotion Clicked',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          promotion_id: 'promo_1',
          creative: 'top_banner_2',
          name: '75% store-wide shoe sale',
          position: 'home_banner_top',
          items: [
            {
              item_id: 'SKU_12345',
              item_name: 'jeggings',
              coupon: 'SUMMER_FUN',
              discount: 2.22,
              creative_slot: 'featured_app_1',
              location_id: 'L_12345',
              affiliation: 'Google Store',
              item_brand: 'Gucci',
              item_category: 'pants',
              item_variant: 'Black',
              price: 9.99,
              currency: 'USD'
            }
          ]
        }
      })

      try {
        await testDestination.testAction('selectPromotion', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          mapping: {
            clientId: {
              '@path': '$.anonymousId'
            },
            location_id: {
              '@path': '$.properties.promotion_id'
            },
            items: {
              '@path': '$.properties.items'
            }
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe('One of promotion name or promotion id is required.')
      }
    })

    it('should throw error when item currency is invalid', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Promotion Clicked',
        userId: '3456fff',
        anonymousId: 'anon-567890',
        type: 'track',
        properties: {
          promotion_id: 'promo_1',
          creative: 'top_banner_2',
          name: '75% store-wide shoe sale',
          position: 'home_banner_top',
          items: [
            {
              item_id: 'SKU_12345',
              item_name: 'jeggings',
              coupon: 'SUMMER_FUN',
              discount: 2.22,
              promotion_id: 'P_12345',
              promotion_name: 'Summer Sale',
              creative_slot: 'featured_app_1',
              location_id: 'L_12345',
              affiliation: 'Google Store',
              item_brand: 'Gucci',
              item_category: 'pants',
              item_variant: 'Black',
              price: 9.99,
              currency: 'US4D'
            }
          ]
        }
      })

      try {
        await testDestination.testAction('selectPromotion', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          mapping: {
            clientId: {
              '@path': '$.anonymousId'
            },
            location_id: {
              '@path': '$.properties.promotion_id'
            },
            items: {
              '@path': '$.properties.items'
            }
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe('US4D is not a valid currency code.')
      }
    })
  })
})
