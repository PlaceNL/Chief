import {gatherStats} from '../util/statsUtil.js';

export function handleGetStats(chief, client) {
    client.ws.sendPayload('stats', gatherStats(chief, false));
}
