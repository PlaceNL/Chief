export function attachSendFunctions(chief, ws) {
    ws.sendPayload = (type, payload = undefined) => {
        ws.send(JSON.stringify({
            type,
            payload
        }));
        chief.stats.messagesOut++;
    };
}

