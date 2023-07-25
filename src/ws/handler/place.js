export function handlePlace(chief, client, payload) {
    if (typeof payload !== 'object') {
        client.ws.sendPayload('error', {
            type: 'invalidPayload',
            detail: 'invalidPlace'
        });
        return;
    }

    const {x, y, color} = payload;
    if (typeof x !== 'number' || typeof y !== 'number' || typeof color !== 'number' || x < 0 || x >= 3000 || y < 0 || y >= 2000 || color < 0 || color >= 32) {
        client.ws.sendPayload('error', {
            type: 'invalidPayload',
            detail: 'invalidPlace'
        });
        return;
    }

    if (client.lastPlaced.getTime() + 60_000 > Date.now()) {
        client.ws.sendPayload('error', {
            type: 'ratelimit',
            detail: 'place'
        });
        return;
    }

    if (!client.brand) {
        client.ws.sendPayload('error', {
            type: 'brandRequired',
            detail: 'place'
        });
        return;
    }

    client.lastPlaced = new Date();
    chief.placeCounts[0]++;

    client.ws.sendPayload('confirmPlace');
}
