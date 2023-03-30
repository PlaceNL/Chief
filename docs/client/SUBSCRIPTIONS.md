# Creating a client - Subscriptions

To prevent wasting data on sending useless information, Chief only sends information to clients that want it. Chief
calls these 'desires for information' subscriptions.

> **Note:** For more information about the data inside the messages you can subscribe to, see the clientbound messages
> section in the [protocol documentation](PROTOCOL.md).

You can currently subscribe to three updates:

- **announcements:** Messages shown via toast/console logs. These messages can be about anything but are most commonly
  used for PSAs about new official client updates, important canvas changes and anything else that needs the user's
  attention. Depending on the severity, you should try to get the user's attention.
- **orders:** Messages about new orders. You should subscribe to this message instead of polling `getOrder` or making a
  request to the REST API.
- **stats:** Periodic statistics about the Chief instance. These statistics are a more compact version of the statistics
  provided by the REST API endpoint and are intended for us in online counters and Discord bots.

You can subscribe to an update by sending a `subscribe` message with the update type (case-sensitive) as the payload. If
you no longer need certain updates, you may unsubscribe from them by sending a `unsubscribe` message with, again, the
update type (also case-sensitive) as the payload.

Please keep in mind that you're only subscribing to broadcasts! You will **NOT** immediately receive the current orders,
for example. If you instantly want information, you'll need to request it after subscribing, for example
with `getOrder`.
