const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const Route = require('../models/Route');
const mongoose = require('mongoose');

// GET /api/analytics/dashboard - Get dashboard analytics
router.get('/dashboard', async (req, res) => {
    try {
        const { period = 'daily', days = 30 } = req.query;

        // Check connection
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: "Database disconnected" });
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const metrics = await Analytics.aggregateMetrics(startDate, new Date());

        // Get recent routes
        const recentRoutes = await Route.find({ optimized: true })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('name createdAt optimizationResults.savings');

        res.json({
            metrics,
            recentRoutes,
            period: {
                start: startDate,
                end: new Date(),
                days: parseInt(days)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/analytics/trends - Get optimization trends
router.get('/trends', async (req, res) => {
    try {
        // Check connection
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: "Database disconnected" });
        }
        const { days = 30 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const routes = await Route.find({
            createdAt: { $gte: startDate },
            optimized: true
        }).sort({ createdAt: 1 });

        // Group by date
        const trendData = routes.reduce((acc, route) => {
            const date = route.createdAt.toISOString().split('T')[0];

            if (!acc[date]) {
                acc[date] = {
                    date,
                    count: 0,
                    totalSavings: { distance: 0, fuel: 0, carbon: 0 }
                };
            }

            acc[date].count++;

            if (route.optimizationResults && route.optimizationResults.savings) {
                acc[date].totalSavings.distance += parseFloat(route.optimizationResults.savings.distance) || 0;
                acc[date].totalSavings.fuel += parseFloat(route.optimizationResults.savings.fuel) || 0;
                acc[date].totalSavings.carbon += parseFloat(route.optimizationResults.savings.carbon) || 0;
            }

            return acc;
        }, {});

        res.json(Object.values(trendData));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/analytics/impact - Get environmental impact
router.get('/impact', async (req, res) => {
    try {
        // Check connection
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: "Database disconnected" });
        }
        const routes = await Route.find({ optimized: true });

        const totalImpact = routes.reduce((acc, route) => {
            if (route.optimizationResults && route.optimizationResults.savings) {
                acc.carbonSaved += parseFloat(route.optimizationResults.savings.carbon) || 0;
                acc.fuelSaved += parseFloat(route.optimizationResults.savings.fuel) || 0;
                acc.distanceSaved += parseFloat(route.optimizationResults.savings.distance) || 0;
            }
            return acc;
        }, { carbonSaved: 0, fuelSaved: 0, distanceSaved: 0 });

        // Calculate equivalents
        const treesPlanted = (totalImpact.carbonSaved / 21).toFixed(1); // 21kg CO2 per tree per year
        const carMilesNotDriven = (totalImpact.distanceSaved * 0.621371).toFixed(1); // km to miles
        const costSavings = (totalImpact.fuelSaved * 1.5).toFixed(2); // $1.5 per liter

        res.json({
            totalImpact: {
                carbonSaved: totalImpact.carbonSaved.toFixed(2),
                fuelSaved: totalImpact.fuelSaved.toFixed(2),
                distanceSaved: totalImpact.distanceSaved.toFixed(2)
            },
            equivalents: {
                treesPlanted,
                carMilesNotDriven,
                costSavings
            },
            totalOptimizations: routes.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
