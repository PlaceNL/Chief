# Creating a client - Capabilities

A client can report what it is capable of via Chief's capabilities system. This information allows us to get more useful
insights than just amount of connected clients, such as the amount of clients that are actually capable of interacting
with the canvas.

There are currently three different capabilities:

- **place:** This capability should be enabled if your client is capable of placing pixels on r/place. Note that this
  also includes checking whether the user is logged in, since anonymous users can't place pixels on r/place.
- **placeNow:** This capability should be enabled when your Reddit's pixel place cooldown expires and your client starts
  checking which pixels it should place. It should be disabled again when your client has placed a pixel.
- **priorityMappings:** This capability should be enabled when your client can understand and
  use [priority mappings](PRIORITY-MAPPINGS.md) when they are provided in an order.

A capability can be enabled by sending the `enableCapability` message with the capability name (case-sensitive) as the
payload. Capabilities can be disabled again by sending the `disableCapability` message with, again, the capability name (still
case-sensitive) as the payload.
