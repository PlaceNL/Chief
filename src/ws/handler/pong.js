export function handlePong(client) {
    client.lastKeepalive = new Date();
}

export function startKeepaliveCheck(chief, INTERVAL, TIMEOUT) {
    setInterval(() => {
        for (const client of chief.clients.values()) {
            if (Date.now() - client.lastKeepalive.getTime() > TIMEOUT) {
                client.ws.sendPayload('disconnect', {
                    reason: 'timedOut',
                    message: 'Connection timed out - client failed to respond to pings in time'
                });
                client.ws.close();
                continue;
            }

            client.ws.sendPayload('ping');
        }
    }, INTERVAL);
}
