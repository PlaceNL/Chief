# PlaceNL Bot

The PlaceNL bot is designed to help the PlaceNL community coordinate their efforts in the r/place project. It facilitates the organization and management of art templates and priority mappings, providing real-time updates to connected clients.

## Capabilities

- Template management: The bot allows users to push and validate templates, ensuring that they are in the correct format and use valid colors.
- Priority mapping: Users can upload priority maps along with their templates to indicate the importance of individual pixels in the artwork.
- Discord integration: The bot verifies users through Discord, ensuring that only authorized users can push new orders.
- WebSocket communication: The bot communicates with connected clients in real-time, sending updates whenever a new order is pushed.
- Metrics collection: The bot collects metrics such as the number of WebSocket connections, messages sent, and brands, allowing for monitoring and analysis of the bot's performance.

## How it Works

1. Users upload a template (order) image and an optional priority mapping image.
2. The bot validates the images, checking for correct format, size, and colors.
3. If the validation is successful, the user's Discord identity is verified.
4. If the user has the required role, the order is saved, and a notification is sent to all connected clients.
5. Clients receive the order and can display the template and priority mapping to their users, helping the community to coordinate their efforts on the canvas.

Please note that the bot is designed to be used with the PlaceNL community, and its features are tailored to the specific needs of this group.
