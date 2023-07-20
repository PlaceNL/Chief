import express from 'express';
import expressWs from 'express-ws';
import postgres from 'postgres';
import {BASE_URL, DISCORD_CLIENT_ID, HTTP_PORT, IMAGES_DIRECTORY, POSTGRES_CONNECTION_URI} from './constants.js';
const app = express();

const chief = {
    clients: new Map(),
    stats: {
        messagesIn: 0,
        messagesOut: 0
    },
    sql: postgres(POSTGRES_CONNECTION_URI)
};
express.application.chief = chief;

await chief.sql.unsafe(`
CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL,
    name VARCHAR NOT NULL,
    avatar VARCHAR NOT NULL,

    CONSTRAINT uq_id UNIQUE (id)
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID NOT NULL UNIQUE PRIMARY KEY,
    message VARCHAR NULL,
    flags INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),

    CONSTRAINT fk_created_by FOREIGN KEY(created_by) REFERENCES users(id)
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS offset_x INTEGER NOT NULL DEFAULT -500;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS offset_y INTEGER NOT NULL DEFAULT -500;
`);

expressWs(app);
app.use('/api', (await import('./api/index.js')).default);
app.use('/artist', (await import('./artist/index.js')).default);
app.use('/metrics', (await import('./metrics/index.js')).default);
app.use('/oauth/login', (req, res) => {
    res.redirect(`https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${BASE_URL}/artist/createorder`)}&scope=identify+guilds.members.read&response_type=code`);
});
app.use('/template', (await import('./template/index.js')).default);
app.use('/ws', (await import('./ws/index.js')).default);

app.use('/orders', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});
app.use('/orders', express.static(IMAGES_DIRECTORY));
app.use('/', express.static('./web'))

app.listen(HTTP_PORT, () => {
    console.log(`Serving requests on port ${HTTP_PORT}!`);
});
