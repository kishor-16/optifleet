const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const Route = require('../models/Route');

// ============================================
// HELPER FUNCTIONS (Haversine & Optimization)
// ============================================

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

function calculateTotalDistance(routeArray) {
    if (routeArray.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < routeArray.length - 1; i++) {
        totalDistance += calculateDistance(
            routeArray[i].latitude,
            routeArray[i].longitude,
            routeArray[i + 1].latitude,
            routeArray[i + 1].longitude
        );
    }
    return totalDistance;
}

function nearestNeighborOptimization(routeArray) {
    if (routeArray.length <= 1) return routeArray;

    const optimized = [routeArray[0]];
    const remaining = routeArray.slice(1);

    while (remaining.length > 0) {
        const current = optimized[optimized.length - 1];
        let nearestIndex = 0;
        let nearestDistance = Infinity;

        remaining.forEach((route, index) => {
            const distance = calculateDistance(
                current.latitude,
                current.longitude,
                route.latitude,
                route.longitude
            );

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = index;
            }
        });

        optimized.push(remaining[nearestIndex]);
        remaining.splice(nearestIndex, 1);
    }

    return optimized;
}

function jsOptimization(routes) {
    const beforeDistance = calculateTotalDistance(routes);
    const beforeFuel = beforeDistance * 0.12;
    const beforeCarbon = beforeFuel * 2.68;

    const optimizedRoutes = nearestNeighborOptimization([...routes]);

    const afterDistance = calculateTotalDistance(optimizedRoutes);
    const afterFuel = afterDistance * 0.12;
    const afterCarbon = afterFuel * 2.68;

    const distanceSavings = beforeDistance - afterDistance;
    const fuelSavings = beforeFuel - afterFuel;
    const carbonSavings = beforeCarbon - afterCarbon;
    const percentageSavings = beforeDistance > 0
        ? ((distanceSavings / beforeDistance) * 100)
        : 0;

    return {
        success: true,
        before: {
            distance: beforeDistance.toFixed(2),
            fuel: beforeFuel.toFixed(2),
            carbon: beforeCarbon.toFixed(2)
        },
        after: {
            distance: afterDistance.toFixed(2),
            fuel: afterFuel.toFixed(2),
            carbon: afterCarbon.toFixed(2)
        },
        savings: {
            distance: distanceSavings.toFixed(2),
            fuel: fuelSavings.toFixed(2),
            carbon: carbonSavings.toFixed(2),
            percentage: percentageSavings.toFixed(1)
        },
        optimizer: "JavaScript Nearest Neighbor Algorithm with Haversine Distance",
        optimizedRoutes: optimizedRoutes
    };
}

function runPythonOptimizer(routes) {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, '../optimizer/optimize.py');
        const pythonProcess = spawn('python', [pythonScript]);

        let outputData = '';
        let errorData = '';

        pythonProcess.stdin.write(JSON.stringify({ routes }));
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python optimizer failed: ${errorData}`));
            } else {
                try {
                    const result = JSON.parse(outputData);
                    if (result.success && result.metrics) {
                        resolve({
                            success: true,
                            before: result.metrics.before,
                            after: result.metrics.after,
                            savings: result.metrics.savings,
                            optimizer: result.optimizer,
                            optimizedRoutes: result.optimizedRoutes,
                            clusters: result.clusters,
                            vehicles: result.vehicles,
                            vehicleCounts: result.vehicleCounts
                        });
                    } else {
                        reject(new Error(result.error || 'Unknown error'));
                    }
                } catch (parseError) {
                    reject(new Error(`Failed to parse Python output: ${parseError.message}`));
                }
            }
        });

        setTimeout(() => {
            pythonProcess.kill();
            reject(new Error('Python optimizer timeout'));
        }, 30000);
    });
}

// ============================================
// ROUTES
// ============================================

// POST /api/optimize - Optimize routes
router.post('/', async (req, res) => {
    try {
        const { routes, saveToDatabase = false, routeName } = req.body;

        if (!routes || routes.length < 2) {
            return res.status(400).json({
                error: "At least 2 routes are required for optimization"
            });
        }

        console.log(`\n🚀 Optimizing ${routes.length} routes...`);

        let result;

        // Try Python optimizer first
        try {
            console.log('📊 Using Python optimizer...');
            result = await runPythonOptimizer(routes);
            console.log('✅ Python optimization successful');
        } catch (pythonError) {
            console.log('⚠️  Python optimizer failed:', pythonError.message);
            console.log('🔄 Falling back to JavaScript optimizer...');
            result = jsOptimization(routes);
            console.log('✅ JavaScript optimization successful');
        }

        // Save to database if requested
        if (saveToDatabase && Route) {
            try {
                const newRoute = new Route({
                    name: routeName || `Route ${new Date().toISOString()}`,
                    locations: routes,
                    optimized: true,
                    optimizationResults: {
                        before: result.before,
                        after: result.after,
                        savings: result.savings,
                        optimizer: result.optimizer,
                        clusters: result.clusters,
                        vehicles: result.vehicles
                    },
                    status: 'optimized'
                });

                await newRoute.save();
                console.log('💾 Route saved to database');
                result.savedRoute = {
                    id: newRoute._id,
                    name: newRoute.name
                };
            } catch (dbError) {
                console.error('Database save error:', dbError.message);
                // Continue even if database save fails
            }
        }

        res.json(result);

    } catch (error) {
        console.error("❌ Optimization error:", error);
        res.status(500).json({
            error: "Optimization failed",
            message: error.message
        });
    }
});

module.exports = router;
