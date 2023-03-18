const VALID_CHARACTERS = /^[0-9A-Za-z_.-]{1,64}$/;

export function handleBrand(client, payload) {
    if (typeof payload !== 'object') {
        client.ws.sendPayload('error', {
            type: 'invalidPayload',
            detail: 'invalidBrand'
        });
        return;
    }

    const {author, name, version} = payload;
    if (
        typeof author !== 'string' || typeof name !== 'string' || (version !== undefined && typeof version !== 'string' && typeof version !== 'number') ||
        !VALID_CHARACTERS.test(author) || !VALID_CHARACTERS.test(name) ||
        (typeof version === 'string' && !VALID_CHARACTERS.test(version))
    ) {
        client.ws.sendPayload('error', {
            type: 'invalidPayload',
            detail: 'invalidBrand'
        });
    }

    client.brand = {
        author,
        name,
        version: version ?? null
    };

    client.ws.sendPayload('brandUpdated');
}
