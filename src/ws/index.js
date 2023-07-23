import {application, Router} from 'express';
import * as crypto from 'node:crypto';
import {attachSendFunctions} from './util/sendUtil.js';
import {handlePong, startKeepaliveCheck} from './handler/pong.js';
import {handleGetSubscriptions, handleSubscribe, handleUnsubscribe} from './handler/subscriptions.js';
import {handleBrand} from './handler/brand.js';
import {startStatsInterval} from './util/statsUtil.js';
import {handleDisableCapability, handleEnableCapability, handleGetCapabilities} from './handler/capabilities.js';
import {handleGetOrder} from './handler/orders.js';
import {KEEPALIVE_INTERVAL, KEEPALIVE_TIMEOUT, STATS_INTERVAL} from '../constants.js';
import {handleGetStats} from './handler/stats.js';
import {handlePlace} from './handler/place.js';

const {chief} = application;
const router = new Router();

router.ws('/', (ws) => {
    const client = {
        ws,
        id: crypto.randomUUID(),
        connectedAt: new Date(),
        lastKeepalive: new Date(),
        lastPlaced: new Date(0),
        subscriptions: {},
        capabilities: {},
        sentValidMessage: false
    };

    attachSendFunctions(chief, ws);
    chief.clients.set(client.id, client);

    ws.on('close', () => {
        chief.clients.delete(client.id);
    });

    ws.on('error', (e) => {
        ws.close();
    });

    ws.on('message', (rawMessage) => {
        chief.stats.messagesIn++;
        if (rawMessage.length === 0 || rawMessage.length > 8192) {
            ws.sendPayload('error', {
                type: 'invalidMessage',
                detail: 'invalidLength'
            });
            return;
        }

        let message;
        try {
            message = JSON.parse(rawMessage);
        } catch {
            // handled below
        }
        if (typeof message !== 'object') {
            ws.sendPayload('error', {
                type: 'invalidMessage',
                detail: 'failedToParseJSON'
            });
            return;
        }

        const {type, payload} = message;
        if (typeof type !== 'string') {
            ws.sendPayload('error', {
                type: 'invalidMessage',
                detail: 'noType'
            });
            return;
        }

        client.sentValidMessage = true;

        switch (type) {
            case 'pong':
                handlePong(client);
                break;

            case 'brand':
                handleBrand(client, payload);
                break;

            case 'place':
                handlePlace(chief, client, payload);
                break;

            case 'getOrder':
                handleGetOrder(chief, client);
                break;

            case 'getStats':
                handleGetStats(chief, client);
                break;

            case 'getCapabilities':
                handleGetCapabilities(client);
                break;
            case 'enableCapability':
                handleEnableCapability(client, payload);
                break;
            case 'disableCapability':
                handleDisableCapability(client, payload);
                break;

            case 'getSubscriptions':
                handleGetSubscriptions(client);
                break;
            case 'subscribe':
                handleSubscribe(client, payload);
                break;
            case 'unsubscribe':
                handleUnsubscribe(client, payload);
                break;

            default:
                ws.sendPayload('error', {
                    type: 'invalidMessage',
                    detail: 'unknownType'
                });
                break;
        }
    });

    ws.sendPayload('hello', {
        id: client.id,
        keepaliveInterval: KEEPALIVE_INTERVAL,
        keepaliveTimeout: KEEPALIVE_TIMEOUT
    });
});

startKeepaliveCheck(chief, KEEPALIVE_INTERVAL, KEEPALIVE_TIMEOUT);
startStatsInterval(chief, STATS_INTERVAL);

export default router;
