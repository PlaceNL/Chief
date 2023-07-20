import {application, Router} from 'express';
import {gatherStats} from '../ws/util/statsUtil.js';
import {BASE_URL, FLAG_HAS_PRIORITY_MAPPING, FLAG_SHOW_CREATOR} from '../constants.js';

const {chief} = application;
const router = new Router();

router.get('/stats', (req, res) => {
    res.json(gatherStats(chief, true));
});

router.get('/orders', async (req, res) => {
    const orders = await chief.sql`SELECT * FROM orders ORDER BY created_at DESC;`;

    for (const order of orders) {
        if ((order.flags & FLAG_SHOW_CREATOR) !== 0) {
            [order.creator] = await chief.sql`SELECT *
                                              FROM users
                                              WHERE id = ${order.created_by};`;
            delete order.creator.id;
        } else {
            order.creator = null;
        }

        order.images = {
            order: `${BASE_URL}/orders/${order.id}.png`,
            priority: (order.flags & FLAG_HAS_PRIORITY_MAPPING) !== 0 ? `${BASE_URL}/orders/${order.id}-priority.png` : null
        };

        order.size = {
            height: order.height,
            width: order.width
        };

        order.offset = {
            x: order.offset_x,
            y: order.offset_y
        };

        order.createdAt = order.created_at;

        delete order.created_at;
        delete order.created_by;
        delete order.flags; // implementation detail
        delete order.height;
        delete order.width;
        delete order.offset_x;
        delete order.offset_y;
    }

    res.json(orders);
})

export default router;
