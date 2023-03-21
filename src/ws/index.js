import {application, Router} from 'express';
import * as crypto from 'node:crypto';
import {attachSendFunctions} from './util/sendUtil.js';
import {handlePong, startKeepaliveCheck} from './handler/pong.js';
import {handleGetSubscriptions, handleSubscribe, handleUnsubscribe} from './handler/subscriptions.js';
import {handleBrand} from './handler/brand.js';
import {startStatsInterval} from './util/statsUtil.js';
import {handleDisableCapability, handleEnableCapability, handleGetCapabilities} from './handler/capabilities.js';

const {chief} = application;
const router = new Router();

const KEEPALIVE_INTERVAL = parseInt(process.env.KEEPALIVE_INTERVAL ?? 5000);
const KEEPALIVE_TIMEOUT = parseInt(process.env.KEEPALIVE_TIMEOUT ?? 15000);
const STATS_INTERVAL = parseInt(process.env.STATS_INTERVAL ?? 10000);

router.ws('/', (ws) => {
    const client = {
        ws,
        id: crypto.randomUUID(),
        connectedAt: new Date(),
        lastKeepalive: new Date(),
        subscriptions: {},
        capabilities: {}
    };

    attachSendFunctions(chief, ws);
    chief.clients.set(client.id, client);

    ws.on('close', () => {
        chief.clients.delete(client.id);
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

        switch (type) {
            case 'pong':
                handlePong(client);
                break;

            case 'brand':
                handleBrand(client, payload);
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
