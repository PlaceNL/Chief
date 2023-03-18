const ALLOWED_SUBSCRIPTIONS = ['announcement', 'stats'];

export function handleSubscribe(client, payload) {
    handleSub(client, payload, true);
}

export function handleUnsubscribe(client, payload) {
    handleSub(client, payload, false);
}

function handleSub(client, payload, subscribe) {
    if (!ALLOWED_SUBSCRIPTIONS.includes(payload)) {
        client.ws.sendPayload('error', {
            type: 'invalidPayload',
            detail: 'unknownSubscription'
        });
        return;
    }

    client.subscriptions[payload] = subscribe;
    client.ws.sendPayload(subscribe ? 'subscribed' : 'unsubscribed', payload);
}

export function handleGetSubscriptions(client) {
    const subscriptions = {};

    for (const subscription of ALLOWED_SUBSCRIPTIONS) {
        subscriptions[subscription] = !!client.subscriptions[subscription];
    }

    client.ws.sendPayload('subscriptions', subscriptions);
}
