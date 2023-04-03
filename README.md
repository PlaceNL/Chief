# Chief

Chief is a Command & Control server designed for coordinating r/Place efforts within the PlaceNL community. It streamlines the process of sharing pixel art templates and allows seamless integration with various clients, from simple overlays to automatic pixel placers.

If you're interested in developing a client, refer to the [developer docs](docs/README.md) for detailed information.

## Features

- Template Management: Chief allows pixel artists to easily push and validate templates, ensuring proper formatting, size, and color usage.
- Priority Mapping: Users can upload priority maps along with their templates to indicate the importance of individual pixels within the artwork.
- Discord Integration: Chief verifies users through Discord, allowing only authorized members with specific roles to push new orders.
- WebSocket Communication: Real-time updates are sent to connected clients using WebSockets, ensuring that everyone stays informed about the latest orders.
- Metrics Collection: Performance metrics, such as WebSocket connections, messages sent, and brands, are collected for monitoring and analysis purposes.

## Contributing

We welcome meaningful contributions from everyone. For major changes, we recommend discussing your ideas in the English development channels within [our Discord server](https://l.placenl.nl/discord) prior to starting your work.

When making changes to the protocol, please ensure that the documentation is updated accordingly.

## Getting Started

To get started with Chief, follow the steps below:

1. Clone the repository and navigate to the project directory.
2. Install the required dependencies using `npm install`.
3. Set up the necessary environment variables, as described in the `.env.example` file.
4. Start the server using `npm run start`.

Once the server is running, you can begin creating clients and pushing templates to coordinate your efforts on r/Place.

We hope you find Chief to be a valuable tool in enhancing your r/Place experience. For any questions or further assistance, don't hesitate to join [our Discord server](https://l.placenl.nl/discord).
