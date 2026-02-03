const express = require('express');
const router = express.Router();
const Route = require('../models/Route');

// GET /api/routes - Get all routes
router.get('/', async (req, res) => {
    try {
        const { status, optimized, limit = 50, page = 1 } = req.query;

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

module.exports = router;
