// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * This field allows you to specify where your conversions occurred.
   */
  action_source: string
  /**
   * A Unix timestamp in seconds indicating when the actual event occurred.
   */
  event_time: string
  /**
   * These parameters are a set of identifiers Facebook can use for targeted attribution. You must provide at least one of the following user_data keys in your request. More information on recommended User Data parameters in Facebook’s [Best Practices for Conversions API](https://www.facebook.com/business/help/308855623839366).
   */
  user_data: {
    /**
     * Any unique ID from the advertiser, such as loyalty membership IDs, user IDs, and external cookie IDs. You can send one or more external IDs for a given event.
     */
    externalId?: string
    /**
     * An email address, in lowercase. Example: joe@eg.com
     */
    email?: string
    /**
     * A phone number. Include only digits with country code, area code, and number. Remove symbols, letters, and any leading zeros. In addition, always include the country code as part of the customer phone number, even if all of the data is from the same country, as the country code is used for matching.
     */
    phone?: string
    /**
     * Gender, in lowercase. Either f or m.
     */
    gender?: string
    /**
     * A date of birth given as year, month, and day. Example: 19971226 for December 26, 1997.
     */
    dateOfBirth?: string
    /**
     * A last name in lowercase.
     */
    lastName?: string
    /**
     * A first name in lowercase.
     */
    firstName?: string
    /**
     * A city in lower-case without spaces or punctuation. Example: menlopark.
     */
    city?: string
    /**
     * A two-letter state code in lowercase. Example: ca.
     */
    state?: string
    /**
     * If you are in the United States, this is a five-digit zip code. For other locations, follow each country`s standards. Example: 94035 (for United States)
     */
    zip?: string
    /**
     * A two-letter country code in lowercase.
     */
    country?: string
    /**
     * The IP address of the browser corresponding to the event.
     */
    client_ip_address?: string
    /**
     * The user agent for the browser corresponding to the event. client_user_agent is required if action_source = “website”; however it is strongly recommended that you include it for any action_source.
     */
    client_user_agent?: string
    /**
     * The Facebook click ID value stored in the _fbc browser cookie under your domain.
     */
    fbc?: string
    /**
     * The Facebook browser ID value stored in the _fbp browser cookie under your domain.
     */
    fbp?: string
    /**
     * The subscription ID for the user in this transaction.
     */
    subscriptionID?: string
    /**
     * ID associated with a lead generated by Facebook`s Lead Ads.
     */
    leadID?: number
    /**
     * ID issued by Facebook when a person first logs into an instance of an app.
     */
    fbLoginID?: number
  }
  /**
   * This ID can be any unique string chosen by the advertiser. event_id is used to deduplicate events sent by both Facebook Pixel and Conversions API.
   */
  event_id?: string
  /**
   * The browser URL where the event happened. The URL must begin with http:// or https:// and should match the verified domain. event_source_url is required if action_source = “website”; however it is strongly recommended that you include it for any action_source.
   */
  event_source_url?: string
  /**
   * The custom data object which can be used to pass custom properties. See [here](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/custom-data) for more information
   */
  custom_data?: {
    [k: string]: unknown
  }
}
