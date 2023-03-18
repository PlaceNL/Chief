# REST API Routes

Chief offers a REST API. It should only be used if you need information on-demand,
if you need realtime data you should connect to the websocket instead, see the
[Creating a client section](docs/README.md#creating-a-client) for more information.

All routes live under the `/api` path.

## /stats

Returns detailed statistics about this Chief instance, such as client count, amount of messages processed, and
connections per client brand.

### Response format

| name              | type               | description                                                            |
|-------------------|--------------------|------------------------------------------------------------------------|
| activeConnections | number             | The amount of websocket clients currently connected to this instance.  |
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
