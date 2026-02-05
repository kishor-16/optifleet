const express = require('express');
const router = express.Router();
const https = require('https');
const mongoose = require('mongoose');
const Route = require('../models/Route');

// GET /api/routes - Get all routes
router.get('/', async (req, res) => {
    try {
        const { status, optimized, limit = 50, page = 1 } = req.query;

        // Check if MongoDB is connected to avoid buffering timeout
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                error: "Database disconnected",
                message: "The server is currently unable to reach the database. Please ensure MongoDB is running."
            });
        }

        const query = {};
        if (status) query.status = status;
        if (optimized !== undefined) query.optimized = optimized === 'true';

        const routes = await Route.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Route.countDocuments(query);

        res.json({
            routes,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/routes/:id - Get single route
router.get('/:id', async (req, res) => {
    try {
        // Check connection
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: "Database disconnected" });
        }
        const route = await Route.findById(req.params.id);

        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        res.json(route);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/routes - Create new route
router.post('/', async (req, res) => {
    try {
        // Check connection
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: "Database disconnected" });
        }
        const route = new Route(req.body);
        await route.save();

        res.status(201).json(route);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT /api/routes/:id - Update route
router.put('/:id', async (req, res) => {
    try {
        // Check connection
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: "Database disconnected" });
        }
        const route = await Route.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        res.json(route);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE /api/routes/:id - Delete route
router.delete('/:id', async (req, res) => {
    try {
        // Check connection
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: "Database disconnected" });
        }
        const route = await Route.findByIdAndDelete(req.params.id);

        if (!route) {
            return res.status(404).json({ error: 'Route not found' });
        }

        res.json({ message: 'Route deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/routes/stats/summary - Get route statistics
router.get('/stats/summary', async (req, res) => {
    try {
        // Check connection
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: "Database disconnected" });
        }

        const totalRoutes = await Route.countDocuments();
        const optimizedRoutes = await Route.countDocuments({ optimized: true });

        const routes = await Route.find({ optimized: true });

        const totalSavings = routes.reduce((acc, route) => {
            if (route.optimizationResults && route.optimizationResults.savings) {
                acc.distance += parseFloat(route.optimizationResults.savings.distance) || 0;
                acc.fuel += parseFloat(route.optimizationResults.savings.fuel) || 0;
                acc.carbon += parseFloat(route.optimizationResults.savings.carbon) || 0;
            }
            return acc;
        }, { distance: 0, fuel: 0, carbon: 0 });

        res.json({
            totalRoutes,
            optimizedRoutes,
            totalSavings: {
                distance: totalSavings.distance.toFixed(2),
                fuel: totalSavings.fuel.toFixed(2),
                carbon: totalSavings.carbon.toFixed(2)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/routes/geometry - Proxy for OSRM road geometry
router.post('/geometry', async (req, res) => {
    const { coordinates } = req.body;

    if (!coordinates) {
        console.warn('⚠️ OSRM Proxy: No coordinates provided');
        return res.status(400).json({ error: "Coordinates required" });
    }

    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

    console.log(`🗺️ OSRM Proxy: Requesting geometry...`);

    const request = https.get(url, (osrmRes) => {
        let data = '';
        osrmRes.on('data', (chunk) => { data += chunk; });
        osrmRes.on('end', () => {
            if (res.headersSent) return;
            try {
                const json = JSON.parse(data);
                if (json.code === 'Ok') {
                    console.log(`✅ OSRM Proxy: Successfully fetched geometry`);
                    res.json(json);
                } else {
                    console.warn(`⚠️ OSRM Proxy error: ${json.code}`);
                    res.status(400).json({ error: "OSRM Route Failed", details: json });
                }
            } catch (e) {
                console.error(`❌ OSRM Proxy parse error: ${e.message}`);
                res.status(500).json({ error: "Failed to parse OSRM response" });
            }
        });
    });

    request.on('error', (err) => {
        console.error(`❌ OSRM Proxy network error: ${err.message}`);
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to fetch from OSRM" });
        }
    });

    // Set a generous timeout (30s) for the OSRM request
    request.setTimeout(30000, () => {
        console.warn('⚠️ OSRM Proxy: API Request timed out after 30s');
        request.destroy();
        if (!res.headersSent) {
            res.status(504).json({ error: "OSRM API Timeout" });
        }
    });
});

module.exports = router;
