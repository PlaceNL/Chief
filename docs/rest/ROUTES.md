# REST API Routes

Chief offers a REST API. It should only be used if you need information on-demand,
if you need realtime data you should connect to the websocket instead, see the
[Creating a client section](../README.md#creating-a-client) for more information.

All routes live under the `/api` path.

All types followed by `?` are nullable.

## /stats

Returns detailed statistics about this Chief instance, such as client count, amount of messages processed, and
connections per client brand.

### Response format

| name              | type               | description                                                            |
|-------------------|--------------------|------------------------------------------------------------------------|
| activeConnections | integer            | The amount of websocket clients currently connected to this instance.  |
| brands            | object (see below) | The amount of current connections to this instance, per client brand.  |
| messageIn         | number             | The amount of incoming websocket messages this instance has processed. |
| messagesOut       | number             | The amount of outgoing websocket messages this instance has sent.      |

#### Brands format

Clients are first grouped by author, then by client name, and finally by version (or "default" if no version was
specified). The value represents the amount of clients that are connected to this instance with the same exact brand.

### Example response

```json
{
    "messagesIn": 2,
    "messagesOut": 138,
    "activeConnections": 1,
    "brands": {
        "PlaceNL": {
            "Userscript": {
                "default": 1
            }
        }
    }
}
```

## /orders

Returns the full order history for this Chief instance.

> **Note:** This endpoint should **NOT** be used for automated placer clients or other clients that rely on up-to-date
> orders. In those cases, you should connect via WebSocket instead, see
> the [Creating a client section](../README.md#creating-a-client) for more information.

### Response format

The response returns an array/list.

| name      | type                | description                                                                                |
|-----------|---------------------|--------------------------------------------------------------------------------------------|
| id        | string (uuid)       |                                                                                            |
| message   | string?             | The message describing the changes made in this order, or null if no message was provided. |
| createdAt | string (datetime)   | The timestamp this order was created at                                                    |
| creator   | object? (see below) | The user that created this order, or null if the user wishes to remain anonymous.          |
| images    | object (see below)  | The images related to this order                                                           |
| size      | object (see below)  | The size of the images related to the order                                                |

#### Creator Format

| name   | type         | description                           |
|--------|--------------|---------------------------------------|
| name   | string       | The name of the creator               |
| avatar | string (url) | The URL to the creator's avatar image |

#### Images Format

| name     | type          | description                                                                                                    |
|----------|---------------|----------------------------------------------------------------------------------------------------------------|
| order    | string (url)  | The URL to the order image                                                                                     |
| priority | string? (url) | The URL to the [priority mapping image](../client/PRIORITY-MAPPINGS.md), or null if the order doesn't have one |

#### Size Format

| name   | type    | description                        |
|--------|---------|------------------------------------|
| width  | integer | The width of the images in pixels  |
| height | integer | The height of the images in pixels |

### Example response

```json
[
    {
        "id": "1e3f9fe9-1e04-43d8-88df-204bc54e516f",
        "message": "World domination plans",
        "createdAt": "2023-03-26T15:37:14.600Z",
        "creator": {
            "name": "NoahvdAa",
            "avatar": "https://cdn.discordapp.com/avatars/499608352624607232/127ea3c5033f8ed345cb10174758e6de.png"
        },
        "images": {
            "order": "https://chief.placenl.nl/orders/1e3f9fe9-1e04-43d8-88df-204bc54e516f.png",
            "priority": null
        },
        "size": {
            "height": 1000,
            "width": 1000
        }
    }
]
```
