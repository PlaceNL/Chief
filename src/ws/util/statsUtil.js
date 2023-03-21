import {ALLOWED_CAPABILITIES} from '../handler/capabilities.js';

export function gatherStats(chief, complex) {
    const stats = {
        ...chief.stats,
        activeConnections: chief.clients.size
    };

    if (complex) {
        const brands = {};
        for (const {brand} of chief.clients.values()) {
            if (!brand) continue;

            let author = brands[brand.author];
            if (!author) {
                brands[brand.author] = author = {};
            }

            let name = author[brand.name];
            if (!name) {
                author[brand.name] = name = {};
            }

            let version = brand.version ?? 'default';
            name[version] = (name[version] ?? 0) + 1;
        }
        stats.brands = brands;
    }

    const capabilities = {};
    for (const capability of ALLOWED_CAPABILITIES) {
        capabilities[capability] = 0;
    }
    for (const client of chief.clients.values()) {
        for (const [capability, value] of Object.entries(client.capabilities)) {
            if (!value) continue;
            capabilities[capability]++;
        }
    }
    stats.capabilities = capabilities;

    return stats;
}

export function startStatsInterval(chief, INTERVAL) {
    setInterval(() => {
        const stats = gatherStats(chief, false);

        for (const client of chief.clients.values()) {
            if (!client.subscriptions.stats) continue;

            client.ws.sendPayload('stats', stats);
        }
    }, INTERVAL);
}
