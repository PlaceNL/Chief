export const ALLOWED_CAPABILITIES = ['place', 'placeNow', 'priorityMappings'];

export function handleEnableCapability(client, payload) {
    handleCapability(client, payload, true);
}

export function handleDisableCapability(client, payload) {
    handleCapability(client, payload, false);
}

function handleCapability(client, payload, capable) {
    if (!ALLOWED_CAPABILITIES.includes(payload)) {
        client.ws.sendPayload('error', {
            type: 'invalidPayload',
            detail: 'unknownCapability'
        });
        return;
    }

    client.capabilities[payload] = capable;
    client.ws.sendPayload(capable ? 'enabledCapability' : 'disabledCapability', payload);
}

export function handleGetCapabilities(client) {
    const capabilities = {};

    for (const subscription of ALLOWED_CAPABILITIES) {
        capabilities[subscription] = !!client.capabilities[subscription];
    }

    client.ws.sendPayload('capabilities', {allowed: ALLOWED_CAPABILITIES, client: capabilities});
}
