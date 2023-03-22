import express from 'express';
import expressWs from 'express-ws';
const app = express();

const chief = {
    clients: new Map(),
    stats: {
        messagesIn: 0,
        messagesOut: 0
    }
};
express.application.chief = chief;

expressWs(app);
app.use('/api', (await import('./api/index.js')).default);
app.use('/metrics', (await import('./metrics/index.js')).default);
app.use('/ws', (await import('./ws/index.js')).default);

const port = process.env.HTTP_PORT ?? 3000;
app.listen(port, () => {
    console.log(`Serving requests on port ${port}!`);
});
