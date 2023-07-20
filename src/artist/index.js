import {application, Router} from 'express';
import * as crypto from 'node:crypto';
import multer from 'multer';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {PNG} from 'pngjs';
import {
    BASE_URL,
    DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET,
    DISCORD_ROLE_ID,
    DISCORD_SERVER_ID,
    FLAG_HAS_PRIORITY_MAPPING,
    FLAG_SHOW_CREATOR,
    IMAGES_DIRECTORY
} from '../constants.js';
import {cleanUploadedFilesMiddleware} from '@myrotvorets/clean-up-after-multer';

const {chief} = application;
const router = new Router();
const upload = multer({dest: './uploads/', limits: {fileSize: 5_000_000}});

const VALID_COLORS = ['#6D001A', '#BE0039', '#FF4500', '#FFA800', '#FFD635', '#FFF8B8', '#00A368', '#00CC78', '#7EED56', '#00756F', '#009EAA', '#00CCC0', '#2450A4', '#3690EA', '#51E9F4', '#493AC1', '#6A5CFF', '#94B3FF', '#811E9F', '#B44AC0', '#E4ABFF', '#DE107F', '#FF3881', '#FF99AA', '#6D482F', '#9C6926', '#FFB470', '#000000', '#515252', '#898D90', '#D4D7D9', '#FFFFFF'];

router.post('/validate', upload.fields([{
    name: 'order',
    maxCount: 1
}, {
    name: 'priority',
    maxCount: 1
}]), async (req, res, next) => {
    try {
        res.json(await validate(req));
    } catch (e) {
        res.json({
            score: 0,
            messages: [
                'An exception was thrown during validation!'
            ]
        });
    }
    next();
});

router.post('/order', upload.fields([{
    name: 'order',
    maxCount: 1
}, {
    name: 'priority',
    maxCount: 1
}]), async (req, res, next) => {
    try {
        const validation = await validate(req);
        if (validation.score === 0) {
            res.type('text/plain').send('Invalid order!');
            next();
            return;
        }
    } catch (e) {
        res.type('text/plain').send('An exception was thrown durnig validation!');
        next();
        return;
    }

    // we know the order is valid now, verify discord identity.
    const tokenParams = new URLSearchParams();
    tokenParams.append('client_id', DISCORD_CLIENT_ID);
    tokenParams.append('client_secret', DISCORD_CLIENT_SECRET);
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('code', req.body.code);
    tokenParams.append('redirect_uri', `${BASE_URL}/artist/createorder`);
    const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
        method: 'POST',
        body: tokenParams
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
        res.type('text/plain').send('Invalid Discord authentication code! It may have expired.');
        next();
        return;
    }
    const accessToken = tokenData.access_token;

    // Get some user info
    const userResponse = await fetch(`https://discord.com/api/v10/users/@me`, {
        headers: {
            authorization: `Bearer ${accessToken}`,
        }
    });
    const userData = await userResponse.json();
    if (!userResponse.ok || !userData.username) {
        res.type('text/plain').send('Failed to identify you via Discord.');
        next();
        return;
    }

    // Verify that the user has the push role
    const guildResponse = await fetch(`https://discord.com/api/v10/users/@me/guilds/${DISCORD_SERVER_ID}/member`, {
        headers: {
            authorization: `Bearer ${accessToken}`,
        }
    });
    const guildData = await guildResponse.json();
    if (!guildResponse.ok || !guildData.roles) {
        res.type('text/plain').send('Failed to identify you via Discord.');
        next();
        return;
    }
    if (!guildData.roles.includes(DISCORD_ROLE_ID)) {
        res.type('text/plain').send('You do not have the role required to push new orders.');
        next();
        return;
    }

    const order = req.files.order[0];
    const orderPng = PNG.sync.read(fs.readFileSync(order.path));

    let avatar = `https://cdn.discordapp.com/embed/avatars/${userData.discriminator % 5}.png`;
    if (userData.avatar) {
        avatar = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}${userData.avatar.startsWith('a_') ? '.gif' : '.png'}`;
    }

    const id = crypto.randomUUID();
    const showCreator = Boolean(req.body['show-creator']);
    let flags = 0;
    if (showCreator) flags |= FLAG_SHOW_CREATOR;
    if (req.files.priority) flags |= FLAG_HAS_PRIORITY_MAPPING;

    fs.copyFileSync(order.path, path.join(IMAGES_DIRECTORY, `${id}.png`));
    if (req.files.priority) {
        const priority = req.files.priority[0];
        fs.copyFileSync(priority.path, path.join(IMAGES_DIRECTORY, `${id}-priority.png`));
    }

    let xOffset = Number(req.body['x-offset']) || 0;
    let yOffset = Number(req.body['y-offset']) || 0;

    await chief.sql`INSERT INTO users (id, name, avatar)
                    VALUES (${userData.id}, ${userData.username}, ${avatar})
                    ON CONFLICT (id) DO UPDATE SET name   = ${userData.username},
                                                   avatar = ${avatar};`;
    await chief.sql`INSERT INTO orders (id, message, flags, width, height, created_by, offset_x, offset_y)
                    VALUES (${id}, ${req.body.message || null}, ${flags}, ${orderPng.width}, ${orderPng.height},
                            ${userData.id}, ${xOffset}, ${yOffset})`;

    const payload = {
        id,
        message: req.body.message || null,
        size: {
            width: orderPng.width,
            height: orderPng.height
        },
        creator: showCreator ? {
            name: userData.username,
            avatar: avatar
        } : null,
        images: {
            order: `${BASE_URL}/orders/${id}.png`,
            priority: req.files.priority ? `${BASE_URL}/orders/${id}-priority.png` : null
        },
        offset: {
            x: xOffset,
            y: yOffset
        },
        createdAt: new Date()
    };

    for (const client of chief.clients.values()) {
        if (!client.subscriptions.orders) continue;

        client.ws.sendPayload('order', payload);
    }

    res.type('text/plain').send('Template has been pushed out.');
    next();
});

router.use(cleanUploadedFilesMiddleware());

async function validate(req) {
    if (!req.files.order) {
        return {
            score: 0,
            messages: [
                'Missing order image!'
            ]
        };
    }

    const order = req.files.order[0];
    if (order.mimetype !== 'image/png') {
        return {
            score: 0,
            messages: [
                'Order image must be png!'
            ]
        };
    }

    const messages = [];
    let perfect = true;
    let acceptable = true;

    const orderPng = PNG.sync.read(fs.readFileSync(order.path));

    if (req.files.priority) {
        const priority = req.files.priority[0];
        if (priority.mimetype !== 'image/png') {
            messages.push('Priority mapping image must be a png!');
            acceptable = perfect = false;
        } else {
            const priorityPng = PNG.sync.read(fs.readFileSync(priority.path));
            if (priorityPng.width !== orderPng.width || priorityPng.height !== orderPng.height) {
                messages.push('Priority mapping image must be the same size as the order image!');
                acceptable = perfect = false;
            }
        }
    } else {
        perfect = false;
        messages.push('No priority mapping has been provided. All pixels will be equally (un)important.');
    }

    for (let y = 0; y < orderPng.height; y++) {
        for (let x = 0; x < orderPng.width; x++) {
            const idx = (orderPng.width * y + x) << 2;
            const hex = '#' + componentToHex(orderPng.data[idx]) + componentToHex(orderPng.data[idx + 1]) + componentToHex(orderPng.data[idx + 2]);
            if (!VALID_COLORS.includes(hex.toUpperCase())) {
                messages.push(`Invalid color '${hex}' at ${x},${y}!`);
                acceptable = perfect = false;
            }
        }
    }

    const [previousOrder] = await chief.sql`SELECT *
                                            FROM orders
                                            ORDER BY created_at DESC
                                            LIMIT 1;`;
    if (previousOrder) {
        if (previousOrder.width !== orderPng.width || previousOrder.height !== orderPng.height) {
            perfect = false;
            messages.push(`Order has a different size than the current order (${orderPng.width}x${orderPng.height} new, ${previousOrder.width}x${previousOrder.height} old). If the canvas has been resized, you can ignore this warning.`);
        }

        let xOffset = Number(req.body['x-offset']) || 0;
        let yOffset = Number(req.body['y-offset']) || 0;
        if (previousOrder.offset_x !== xOffset || previousOrder.offset_y !== yOffset) {
            perfect = false;
            messages.push(`Order has a different offset than the current order (${xOffset},${yOffset} new, ${previousOrder.offset_x},${previousOrder.offset_y} old). If the canvas has been resized, you can ignore this warning.`);
        }
    }

    if (!req.body.message) {
        perfect = false;
        messages.push('Order has no message');
    }

    return {
        score: perfect ? 2 : (acceptable ? 1 : 0),
        messages
    };
}

export default router;

function componentToHex(c) {
    let hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}
