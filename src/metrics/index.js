import {application, Router} from 'express';
import * as client from 'prom-client';
import {ALLOWED_CAPABILITIES} from '../ws/handler/capabilities.js';
import {gatherBrandsStats, gatherCapabilitiesStats} from '../ws/util/statsUtil.js';
import {COLLECT_NODE_METRICS} from '../constants.js';

const {chief} = application;
const router = new Router();

const register = new client.Registry();

if (COLLECT_NODE_METRICS) client.collectDefaultMetrics({register});
register.registerMetric(new client.Counter({
    name: 'websocket_messages_in_total',
    help: 'The amount of messages sent to the websocket server on this instance',
    collect() {
        this.reset();
        this.inc(chief.stats.messagesIn);
    }
}));
register.registerMetric(new client.Counter({
    name: 'websocket_messages_out_total',
    help: 'The amount of messages sent by the websocket server on this instance',
    collect() {
        this.reset();
        this.inc(chief.stats.messagesOut);
    }
}));
register.registerMetric(new client.Gauge({
    name: 'valid_connections',
    help: 'The amount of currently active connections that have sent at least one valid message to the websocket server on this instance',
    collect() {
        this.set([...chief.clients.values()].filter((client) => client.sentValidMessage).length);
    }
}));
register.registerMetric(new client.Gauge({
    name: 'websocket_connections',
    help: 'The amount of currently active connections to the websocket server on this instance',
    collect() {
        this.set(chief.clients.size);
    }
}));
register.registerMetric(new client.Gauge({
    name: 'websocket_capabilities',
    help: 'The amount of currently active connections to the websocket server on this instance',
    labelNames: ['capability'],
    collect() {
        const capabilities = gatherCapabilitiesStats(chief);
        for (const capability of ALLOWED_CAPABILITIES) {
            this.labels({capability}).set(capabilities[capability]);
        }
    }
}));
register.registerMetric(new client.Gauge({
    name: 'websocket_brands',
    help: 'The amount of currently active connections to the websocket server on this instance, per brand',
    labelNames: ['author', 'name', 'version'],
    collect() {
        this.reset();

        const brands = gatherBrandsStats(chief);
        for (const [author, a] of Object.entries(brands)) {
            for (const [name, n] of Object.entries(a)) {
                for (const [version, v] of Object.entries(n)) {
                    this.labels({author, name, version}).set(v);
                }
            }
        }
    }
}));
register.registerMetric(new client.Gauge({
    name: 'average_place_rate',
    help: 'The average amount of pixels being placed per minute by clients on this instance',
    collect() {
        let placeRate = 0;
        for (let i = 1; i < chief.placeCounts.length; i++) {
            placeRate += chief.placeCounts[i];
        }
        this.set(placeRate / (chief.placeCounts.length - 1));
    }
}));
if (chief.placeClient) {
    register.registerMetric(new client.Counter({
        name: 'template_pixels_total',
        help: 'The total amount of pixels in the template',
        collect() {
            this.reset();
            this.inc(chief.stats.completion?.total ?? 0);
        }
    }));
    register.registerMetric(new client.Counter({
        name: 'template_pixels_wrong',
        help: 'The amount of currently wrong in the template',
        collect() {
            this.reset();
            this.inc(chief.stats.completion?.wrong ?? 0);
        }
    }));
    register.registerMetric(new client.Counter({
        name: 'template_pixels_right',
        help: 'The amount of currently right pixels in the template',
        collect() {
            this.reset();
            this.inc(chief.stats.completion?.right ?? 0);
        }
    }));
    register.registerMetric(new client.Counter({
        name: 'place_message_queue_size',
        help: 'The amount of messages in the queue of the place client',
        collect() {
            this.reset();
            this.inc(chief.placeClient.queue.length);
        }
    }));
}

router.get('/', async (req, res) => {
    res.type('text/plain').send(await register.metrics());
});

export default router;
