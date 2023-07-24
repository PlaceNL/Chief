import {WebSocket} from 'ws';
import {createCanvas, loadImage} from 'canvas';

const trackedCanvases = [0, 1, 2, 3, 4, 5];
const canvasPositions = [[0, 0], [1000, 0], [2000, 0], [0, 1000], [1000, 1000], [2000, 1000]];

export class PlaceClient {

    canvasTimestamps = [];
    canvas = createCanvas(3000, 2000).getContext('2d');
    orderCanvas = createCanvas(3000, 2000).getContext('2d');
    connected = false;
    queue = [];

    async connect() {
        console.log('Getting reddit access token...');
        const accessToken = await this.getAccessToken();

        console.log('Connecting to r/place...');
        const ws = new WebSocket('wss://gql-realtime-2.reddit.com/query', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/116.0',
                Origin: 'https://www.reddit.com'
            }
        });

        function subscribeCanvas(id) {
            ws.send(JSON.stringify({
                id: '2',
                type: 'start',
                payload: {
                    variables: {
                        input: {
                            channel: {
                                teamOwner: 'GARLICBREAD',
                                category: 'CANVAS',
                                tag: String(id)
                            }
                        }
                    },
                    extension: {},
                    operationName: 'replace',
                    query: 'subscription replace($input: SubscribeInput!) {  subscribe(input: $input) {    id    ... on BasicMessage {      data {        __typename        ... on FullFrameMessageData {          __typename          name          timestamp        }        ... on DiffFrameMessageData {          __typename          name          currentTimestamp          previousTimestamp        }      }      __typename    }    __typename  }}'
                }
            }));
        }

        ws.on('open', () => {
            console.log('Connected to r/place!');
            this.connected = true;
            ws.send(JSON.stringify({
                type: 'connection_init',
                payload: {
                    Authorization: `Bearer ${accessToken}`
                }
            }));
            trackedCanvases.forEach((canvas) => {
                subscribeCanvas(canvas);
                this.canvasTimestamps[canvas] = 0;
            });
        });

        this.queue = [];
        ws.on('message', async (message) => {
            this.queue.push(message);
        });

        ws.on('close', () => {
            console.log('Disconnected from place, reconnecting...');
            this.connected = false;
            setTimeout(() => this.connect(), 1000);
        });

        ws.on('error', (e) => {
            ws.close();
        });

        while (ws.readyState !== WebSocket.CLOSED) {
            if (this.queue.length === 0) {
                await new Promise((resolve) => setTimeout(resolve, 50));
                continue;
            }

            const {payload} = JSON.parse(this.queue.shift());
            if (!payload?.data?.subscribe?.data) continue;

            const {__typename, name, previousTimestamp, currentTimestamp, timestamp} = payload.data.subscribe.data;
            if (__typename !== 'FullFrameMessageData' && __typename !== 'DiffFrameMessageData') continue;

            const canvas = name.match(/-frame\/(\d)\//)[1];
            if (previousTimestamp && previousTimestamp !== this.canvasTimestamps[canvas]) {
                console.log('Missing diff frame, reconnecting...');
                ws.close();
                continue;
            }
            this.canvasTimestamps[canvas] = currentTimestamp ?? timestamp;

            const canvasPosition = canvasPositions[canvas];

            if (__typename === 'FullFrameMessageData') {
                this.canvas.clearRect(canvasPosition[0], canvasPosition[1], 1000, 1000);
            }

            const image = await fetch(name);
            const parsedImage = await loadImage(Buffer.from(await image.arrayBuffer()));
            this.canvas.drawImage(parsedImage, canvasPosition[0], canvasPosition[1]);
        }
    }

    async getAccessToken() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30_000);
        const response = await fetch('https://reddit.com/r/place', {
            headers: {
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/116.0'
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        const body = await response.text();

        if (!body.includes('<script id="data">window.___r = ')) {
            console.log('Failed to get access token from reddit, retrying...');
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return this.getAccessToken();
        }

        // todo: yuck
        const configRaw = body.split('<script id="data">window.___r = ')[1].split(';</script>')[0];
        const config = JSON.parse(configRaw);

        return config.user.session.accessToken;
    }

    async updateOrders(orderpath, offset) {
        this.orderCanvas = createCanvas(3000, 2000).getContext('2d');

        const parsedImage = await loadImage(orderpath);
        this.orderCanvas.drawImage(parsedImage, offset[0] + 1500, offset[1] + 1000);
    }

    getOrderDifference() {
        let right = 0;
        let wrong = 0;

        const orderData = this.orderCanvas.getImageData(0, 0, 3000, 2000);
        const canvasData = this.canvas.getImageData(0, 0, 3000, 2000);

        for (let x = 0; x < 3000; x++) {
            for (let y = 0; y < 2000; y++) {
                const i = ((y * 3000) + x) * 4;
                const a = orderData.data[i + 3];
                if (a === 0) continue;

                const r = orderData.data[i];
                const g = orderData.data[i + 1];
                const b = orderData.data[i + 2];
                const currentR = canvasData.data[i];
                const currentG = canvasData.data[i + 1];
                const currentB = canvasData.data[i + 2];

                if (r === currentR && g === currentG && b === currentB) {
                    right++;
                } else {
                    wrong++;
                }
            }
        }

        return {right, wrong, total: right + wrong};
    }

}
