import {BASE_URL, FLAG_HAS_PRIORITY_MAPPING, FLAG_SHOW_CREATOR} from '../../constants.js';

export async function handleGetOrder(chief, client) {
    const [order] = await chief.sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;`;

    if ((order.flags & FLAG_SHOW_CREATOR) !== 0) {
        [order.creator] = await chief.sql`SELECT * FROM users WHERE id=${order.created_by};`;
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

    delete order.created_by;
    delete order.flags; // implementation detail
    delete order.height;
    delete order.width;

    client.ws.sendPayload('order', order);
}
