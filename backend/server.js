const express = require("express");
const cors = require("cors");
const path = require("path");
const { spawn } = require("child_process");

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// ============================================
// OPTIMIZATION LOGIC WITH REAL MATHEMATICS
// ============================================

/**
 * Haversine Formula - Calculate great-circle distance between two points
 * This is REAL mathematics for calculating distances on Earth's surface
 * Formula: a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
 *          c = 2 ⋅ atan2( √a, √(1−a) )
 *          d = R ⋅ c
 * where φ is latitude, λ is longitude, R is earth's radius (6371km)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const toRad = (deg) => deg * (Math.PI / 180);

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // Returns distance in kilometers
}

/**
 * Calculate total route distance
 */
function calculateRouteDistance(locations) {
    if (locations.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < locations.length - 1; i++) {
        const dist = haversineDistance(
            locations[i].latitude,
            locations[i].longitude,
            locations[i + 1].latitude,
            locations[i + 1].longitude
        );
        totalDistance += dist;
    }

    return totalDistance;
}

/**
 * Nearest Neighbor Algorithm for TSP (Traveling Salesman Problem)
 * Greedy algorithm that always visits the nearest unvisited location
 * Time Complexity: O(n²)
 */
function nearestNeighborTSP(locations) {
    if (locations.length <= 1) return locations;

    const optimized = [locations[0]];
    const remaining = locations.slice(1);

    while (remaining.length > 0) {
        const current = optimized[optimized.length - 1];
        let nearestIndex = 0;
        let nearestDistance = Infinity;

        // Find nearest unvisited location
        for (let i = 0; i < remaining.length; i++) {
            const distance = haversineDistance(
                current.latitude,
                current.longitude,
                remaining[i].latitude,
                remaining[i].longitude
            );

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = i;
            }
        }

        optimized.push(remaining[nearestIndex]);
        remaining.splice(nearestIndex, 1);
    }

    return optimized;
}

/**
 * Calculate fuel consumption based on real-world data
 * Average delivery van: 12 liters per 100km = 0.12 L/km
 */
function calculateFuelConsumption(distanceKm) {
    const FUEL_CONSUMPTION_RATE = 0.12; // Liters per kilometer
    return distanceKm * FUEL_CONSUMPTION_RATE;
}

/**
 * Calculate CO2 emissions based on real emission factors
 * Diesel fuel: 2.68 kg CO2 per liter (EPA standard)
 */
function calculateCO2Emissions(fuelLiters) {
    const CO2_PER_LITER = 2.68; // kg CO2 per liter of diesel
    return fuelLiters * CO2_PER_LITER;
}

/**
 * Calculate cost savings
 * Average diesel price: $1.50 per liter
 */
function calculateCostSavings(fuelLitersSaved) {
    const FUEL_PRICE_PER_LITER = 1.50; // USD
    return fuelLitersSaved * FUEL_PRICE_PER_LITER;
}

/**
 * Main optimization function with REAL mathematics
 */
function optimizeRoute(routes) {
    // Validate input
    if (!routes || routes.length < 2) {
        throw new Error("At least 2 locations required for optimization");
    }

    console.log('\n📊 OPTIMIZATION START');
    console.log('Input routes:', routes.length);
    console.log('Original order:', routes.map((r, i) => `${i + 1}. (${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)})`));

    // Calculate BEFORE metrics (original order)
    const beforeDistance = calculateRouteDistance(routes);
    const beforeFuel = calculateFuelConsumption(beforeDistance);
    const beforeCarbon = calculateCO2Emissions(beforeFuel);

    console.log(`BEFORE: Distance = ${beforeDistance.toFixed(2)} km`);

    // Perform optimization using Nearest Neighbor algorithm
    const optimizedRoutes = nearestNeighborTSP([...routes]);

    console.log('Optimized order:', optimizedRoutes.map((r, i) => `${i + 1}. (${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)})`));

    // Calculate AFTER metrics (optimized order)
    const afterDistance = calculateRouteDistance(optimizedRoutes);
    const afterFuel = calculateFuelConsumption(afterDistance);
    const afterCarbon = calculateCO2Emissions(afterFuel);

    console.log(`AFTER: Distance = ${afterDistance.toFixed(2)} km`);

    // Calculate savings
    const distanceSaved = beforeDistance - afterDistance;
    const fuelSaved = beforeFuel - afterFuel;
    const carbonSaved = beforeCarbon - afterCarbon;
    const percentageSaved = beforeDistance > 0 ? (distanceSaved / beforeDistance) * 100 : 0;
    const costSaved = calculateCostSavings(fuelSaved);

    console.log(`SAVINGS: ${distanceSaved.toFixed(2)} km (${percentageSaved.toFixed(1)}%)`);
    console.log('📊 OPTIMIZATION COMPLETE\n');

    // Calculate environmental equivalents
    const treesPlanted = carbonSaved / 21; // 21kg CO2 absorbed per tree per year
    const carMilesNotDriven = distanceSaved * 0.621371; // km to miles

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
            distance: distanceSaved.toFixed(2),
            fuel: fuelSaved.toFixed(2),
            carbon: carbonSaved.toFixed(2),
            percentage: percentageSaved.toFixed(1),
            cost: costSaved.toFixed(2)
        },
        environmental: {
            treesPlanted: treesPlanted.toFixed(1),
            carMilesNotDriven: carMilesNotDriven.toFixed(1)
        },
        optimizer: "Nearest Neighbor TSP with Haversine Distance (Real Mathematics)",
        optimizedRoutes: optimizedRoutes,
        algorithm: {
            name: "Nearest Neighbor",
            complexity: "O(n²)",
            description: "Greedy algorithm for Traveling Salesman Problem"
        },
        realWorldData: {
            fuelConsumptionRate: "12 L/100km (Standard delivery van)",
            co2EmissionFactor: "2.68 kg/L (EPA diesel standard)",
            earthRadius: "6371 km (Used in Haversine formula)"
        }
    };
}

// ============================================
// PYTHON OPTIMIZER INTEGRATION (Advanced)
// ============================================

function runPythonOptimizer(routes) {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, 'optimizer/optimize.py');
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
                    if (result.success) {
                        resolve(result);
                    } else {
                        reject(new Error(result.error || 'Unknown error'));
                    }
                } catch (parseError) {
                    reject(new Error(`Failed to parse output: ${parseError.message}`));
                }
            }
        });

        setTimeout(() => {
            pythonProcess.kill();
            reject(new Error('Timeout'));
        }, 30000);
    });
}

// ============================================
// API ROUTES
// ============================================

// POST /api/optimize - Main optimization endpoint
app.post("/api/optimize", async (req, res) => {
    try {
        const { routes } = req.body;

        if (!routes || routes.length < 2) {
            return res.status(400).json({
                error: "At least 2 routes required for optimization"
            });
        }

        console.log(`\n🚀 Optimizing ${routes.length} locations...`);

        let result;

        // Try Python optimizer first (with K-means clustering)
        try {
            console.log('📊 Attempting Python optimizer with K-means clustering...');
            result = await runPythonOptimizer(routes);
            console.log('✅ Python optimization successful');
            console.log(`   Savings: ${result.savings?.percentage}%`);
        } catch (pythonError) {
            console.log('⚠️  Python optimizer unavailable:', pythonError.message);
            console.log('🔄 Using JavaScript optimizer with real mathematics...');

            // Fallback to JavaScript with REAL mathematics
            result = optimizeRoute(routes);
            console.log('✅ JavaScript optimization successful');
            console.log(`   Distance saved: ${result.savings.distance} km`);
            console.log(`   CO₂ saved: ${result.savings.carbon} kg`);
            console.log(`   Savings: ${result.savings.percentage}%`);
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

// GET /api/health - Health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mathematics: "Haversine formula + Real-world emission factors"
    });
});

// ============================================
// SERVE FRONTEND
// ============================================

// Serve static files from frontend folder (one level up from backend)
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dashboard.html"));
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('\n' + '='.repeat(70));
    console.log('🚚 OptiFleet - Sustainable Delivery Optimization Platform');
    console.log('='.repeat(70));
    console.log(`📍 Server running at: http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard.html`);
    console.log(`🔌 API endpoint: http://localhost:${PORT}/api/optimize`);
    console.log('='.repeat(70));
    console.log('\n📐 REAL MATHEMATICS ENABLED:');
    console.log('   ✅ Haversine formula for accurate Earth distances');
    console.log('   ✅ Nearest Neighbor TSP algorithm');
    console.log('   ✅ Real-world fuel consumption (12 L/100km)');
    console.log('   ✅ EPA CO₂ emission factors (2.68 kg/L)');
    console.log('   ✅ Environmental impact calculations');
    console.log('\n✅ Ready to optimize routes with REAL DATA!\n');
});

module.exports = app;
