// Import necessary modules and constants
import {application, Router} from 'express';
import {BASE_URL, FACTION_CONTACT, FACTION_NAME} from '../constants.js';

// Get the chief object from the Express application instance
const {chief} = application;

// Create a new router instance
const router = new Router();

// Define a route handler for GET requests to the '/osuplace' endpoint
router.get('/osuplace', async (req, res) => {
    // Query the database for the latest order
    const [order] = await chief.sql`SELECT *
                                    FROM orders
                                    ORDER BY created_at DESC
                                    LIMIT 1;`;

    // Return a JSON response with faction info and a template object
    res.json({
        faction: FACTION_NAME, // the name of the faction
        contact: FACTION_CONTACT, // the contact info for the faction
        templates: order ? [ // an array of template objects, if an order exists
            {
                name: order.message ?? 'Latest orders', // the name of the template, defaults to 'Latest orders'
                sources: [
                    `${BASE_URL}/orders/${order.id}.png` // the URL of the template image
                ],
                x: 0,
                y: 0
            }
        ] : [] // an empty array if no orders exist
    });
});

// Export the router for use in other modules
export default router;
