# Creating a client - The communication protocol

Clients should communicate with Chief over WebSockets. They were chosen because of their efficiency, real-time
capabilities, ease to implement, and great browser support.

The websocket endpoint lives at `/ws`. This means you need to point your client to `ws(s)://<host>/ws`. For example,
PlaceNL's endpoint would be `wss://chief.placenl.nl/ws`.

All messages to and from the websocket should be JSON. The server is allowed to close the connection if you send a
non-json payload (the same applies to the client if the server sends invalid JSON).

All messages have a required `type` parameter (string), and an optional `payload` paramter, which can be of different
types, depending on the message type.

All types followed by `?` are nullable, and all types followed with `(optional)` are optional.

## Serverbound messages

Messages that the client can send to the server.

### pong

Answers a clientbound ping packet and resets the keepalive timer.

#### Payload

*no payload*

---

### brand

Sets the brand for this client. The client brand consists of an author, project name and (optionally) a version. All
clients should send a brand to allow the group running the Chief instance to plan with their client-base in mind.

#### Payload

Note that all provided strings must match this regex:`/^[0-9A-Za-z_.-]{1,64}$/`.

| name    | type                     | description                                        |
|---------|--------------------------|----------------------------------------------------|
| author  | string                   | The group or individual that created the client.   |
| name    | string                   | The name of the client.                            |
| version | string/number (optional) | The client version, or null if you don't have one. |

#### Response

Assuming your brand change is valid, the server will respond with a `brandUpdated` message to acknowledge the changes.
If your brand is invalid, the `invalidPayload` error will be sent, with `invalidBrand` as the detail.

---

### getOrder

Gets the most recent orders. Your client should send this on connection to ensure it always has the latest orders, since
just subscribing to orders won't send the most recent orders.

#### Payload

	*no payload*

#### Response

The server will respond with an `order` message containing the latest orders. See the clientbound `order` message
documentation for more information.

---

### getStats

Gets current server statistics, similar to what you may get from the REST API route or statistics subscription.

#### Payload

*no payload*

#### Response

The server will respond with a `stats` message containing current statistics about the Chief instance. See the
clientbound `stats` message documentation for more information.

---

### getCapabilities

Gets the capabilities your client has enabled, along with all the capabilities the server supports. For more information
on the capabilities system, see [the capabilities guide](CAPABILITIES.md).

#### Payload

*no payload*

#### Response

The server will respond with a `capabilities` message containing your enabled capabilities. See the
clientbound `capabilities` message documentation for more information.

---

### enableCapability

Marks the specified capability as enabled. For more information on the capabilities system,
see [the capabilities guide](CAPABILITIES.md).

#### Payload

The name of the capability as a string. See [the capabilities guide](CAPABILITIES.md) for a list of supported
capabilities.

#### Response

The server will respond with a `enabledCapability` message to acknowledge the capability being enabled.
If the capability is invalid, the `invalidPayload` error will be sent, with `unknownCapability` as the detail.

---

### disableCapability

Marks the specified capability as disabled. For more information on the capabilities system,
see [the capabilities guide](CAPABILITIES.md).

#### Payload

The name of the capability as a string. See [the capabilities guide](CAPABILITIES.md) for a list of supported
capabilities.

#### Response

The server will respond with a `disabledCapability` message to acknowledge the capability being disabled.
If the capability is invalid, the `invalidPayload` error will be sent, with `unknownCapability` as the detail.

---

### getSubscriptions

Gets the subscriptions your client has enabled, along with all the subscriptions the server supports. For more
information on the subscriptions system, see [the subscriptions guide](SUBSCRIPTIONS.md).

#### Payload

*no payload*

#### Response

The server will respond with a `subcriptions` message containing your enabled subsriptions. See the
clientbound `subscriptions` message documentation for more information.

---

### subscribe

Marks the client as subscribed to the specified subscription. For more information about the subscriptions system,
see [the subscriptions guide](SUBSCRIPTIONS.md).

#### Payload

The name of the subscription as a string. See [the subscriptions guide](SUBSCRIPTIONS.md) for a list of supported
subscriptions.

#### Response

The server will respond with a `subscribed` message to acknowledge the subscription being enabled.
If the capability is invalid, the `invalidPayload` error will be sent, with `unknownSubscription` as the detail.

---

### unsubscribe

Unmarks the client as subscribed to the specified subscription. For more information about the subscriptions system,
see [the subscriptions guide](SUBSCRIPTIONS.md).

#### Payload

The name of the subscription as a string. See [the subscriptions guide](SUBSCRIPTIONS.md) for a list of supported
subscriptions.

#### Response

The server will respond with a `unsubscribed` message to acknowledge the subscription being disabled.
If the capability is invalid, the `invalidPayload` error will be sent, with `unknownSubscription` as the detail.

## Clientbound messages

Messages that the server can send to the client.

### hello

You have connected to the server and the server has given you an id. Take note of the timeout specified in this message,
since you should close the connection if the server hasn't pinged you after that amount of milliseconds.

#### Payload

| name              | type          | description                                                                                                                         |
|-------------------|---------------|-------------------------------------------------------------------------------------------------------------------------------------|
| id                | string (uuid) | Your client id                                                                                                                      |
| keepaliveTimeout  | integer       | The amount of milliseconds before you should consider your connection timed out.                                                    |
| keepaliveInterval | integer       | The amount of milliseconds between pings from the server. This value is purely informational and should not be used for any checks. |

---

### error

Something went wrong or you sent an invalid message! See the errors section below for more information about the
possible errors.

#### Payload

| name   | type   | description                        |
|--------|--------|------------------------------------|
| type   | string | The general category of the error. |
| detail | string | The specific error.                |

---

### disconnect

The server is about to disconnect you. You may try to reconnect after the server closes the connection.

#### Payload

| name    | type   | description                              |
|---------|--------|------------------------------------------|
| reason  | string | The reason code.                         |
| message | string | A human-readable version of the message. |

---

### order

You have received a new order!

#### Payload

| name      | type                | description                                                                                |
|-----------|---------------------|--------------------------------------------------------------------------------------------|
| id        | string (uuid)       |                                                                                            |
| message   | string?             | The message describing the changes made in this order, or null if no message was provided. |
| createdAt | string (datetime)   | The timestamp this order was created at                                                    |
| creator   | object? (see below) | The user that created this order, or null if the user wishes to remain anonymous.          |
| images    | object (see below)  | The images related to this order                                                           |
| size      | object (see below)  | The size of the images related to the order                                                |
| offset    | object (see below)  | The offset of the image on the canvas                                                      |

##### Creator Format

| name   | type         | description                           |
|--------|--------------|---------------------------------------|
| name   | string       | The name of the creator               |
| avatar | string (url) | The URL to the creator's avatar image |

##### Images Format

| name     | type          | description                                                                                                    |
|----------|---------------|----------------------------------------------------------------------------------------------------------------|
| order    | string (url)  | The URL to the order image                                                                                     |
| priority | string? (url) | The URL to the [priority mapping image](../client/PRIORITY-MAPPINGS.md), or null if the order doesn't have one |

##### Size Format

| name   | type    | description                        |
|--------|---------|------------------------------------|
| width  | integer | The width of the images in pixels  |
| height | integer | The height of the images in pixels |

##### Offset Format

| name   | type    | description                              |
|--------|---------|------------------------------------------|
| x      | integer | The x offset of the image on the canvas  |
| y      | integer | The y offset of the image on the canvas  |


---

### announcement

The server has sent an announcement. It should be displayed in a place where the user can see it, such as the console
log for headless clients, or a toast for web clients. Important announcements should try to get the user's attention.

#### Payload

| name      | type     | description                                                                                                                                                    |
|-----------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| message   | string   | The message to show                                                                                                                                            |
| important | boolean  | Whether this announcement should be considered important. If it is, you should try to get the user's attention.                                                |
| showFor   | integer? | The amount of time the announcement should be shown to the user. If null, it should be the default duration of your preferred way of showing text to the user. |
| style     | object?  | The CSS styles to apply (via javascript) to the container containing this announcement. If your client doesn't support HTML, this can be ignored.              |

--- 

### ping

Indicates the client should prove the connection is still alive by responding with the `pong` message with no payload.

#### Payload

*no payload*

---

### stats

Contains statistics about the Chief instance. Can be sent periodically if subscribed to the `stats` subscription, or as
a response to the `getStats` message.

#### Payload

| name              | type    | description                                                            |
| ----------------- | ------- | ---------------------------------------------------------------------- |
| activeConnections | integer | The amount of websocket clients currently connected to this instance.  |
| messagesIn        | integer | The amount of incoming websocket messages this instance has processed. |
| messagesOut       | integer | The amount of outgoing websocket messages this instance has sent.      |
| socketConnections | integer | The amount of socket connections currently connected to this instance  |
| date              | integer | Number of seconds after 1-1-1970 (Unix timestamp)                      |
| capabilities      | object (see below) | Stats about number of clients with enabled capabilities     | 

##### Stats Capabilities Format

| name     | type    | description                             |
| -------- | ------- | --------------------------------------- |
| place    | integer | n clients with place capability         |
| placeNow | integer | n clients who just placed something     |
| priority | integer | n clients who support priority mappings | 


--- 

### capabilities

Response to the `getCapabilities` message. Contains the capabilities this server supports, along with the capabilities your client has enabled.

#### Payload

| name    | type     | description                              |
|---------|----------|------------------------------------------|
| allowed | string[] | The capabilities this server supports.   |
| client  | string[] | The capabilities the client has enabled. |

--- 

### subscriptions

Response to the `getSubscriptions` message. Contains the subscriptions this server supports, along with the
subscriptions your client has enabled.

#### Payload

| name    | type     | description                               |
|---------|----------|-------------------------------------------|
| allowed | string[] | The subscriptions this server supports.   |
| client  | string[] | The subscriptions the client has enabled. |

---

### brandUpdated

Acknowledges the client brand was updated. Sent after a serverbound `brand` message.

#### Payload

*no payload*

---

### enabledCapability

Acknowledges a capability was enabled. Sent after a serverbound `enableCapability` message.

#### Payload

The capability that was enabled, as a string.

---

### disabledCapability

Acknowledges a capability was disabled. Sent after a serverbound `disableCapability` message.

#### Payload

The capability that was disabled, as a string.

---

### subscribed

Acknowledges a subscription was enabled. Sent after a serverbound `subscribe` message.

#### Payload

The subscription that was enabled, as a string.

---

### unsubscribed

Acknowledges a subscription was disabled. Sent after a serverbound `unsubscribe` message.

#### Payload

The subscription that was disabled, as a string.

## Errors

Sometimes, the server may return an error as a response to your message. This can happen when you send an invalid
message, for example. Errors are sent in a message with the `error` type, containing a `type` field, and a `detail`
field.
The `type` field describes the general category of the error, whereas the `detail` parameter tells you where the error
occured.

All possible errors are listed below.

### invalidMessage

The message you sent was invalid for one of the following reasons:

- **invalidLength:** Your message was too short (empty) or longer than 8192 characters.
- **failedToParseJSON:** Your message contains invalid JSON and could not be parsed.
- **noType:** Your message has no (valid) type parameter.
- **unknownType:** Your message contains a type parameter, but the server has no clue how to handle it.

### invalidPayload

The message contains an invalid payload, for one of the following reasons:

- **invalidBrand:** The specified brand is not valid.
- **unknownCapability:** The specified capability does not exist, or you specified no capability.
- **unknownSubscription:** The specified subscription does not exist, or you specified no subscription.
