// ============================================
// OPTIFLEET - MAP VISUALIZATION WITH REAL ROADS
// ============================================

let map;
let beforeRouteLayer;
let afterRouteLayer;
let markersLayer;
let showBefore = true;
let showAfter = true;

const API_URL = 'http://localhost:3000/api';

// Sample data - same as dashboard
const sampleRoutes = [
    { latitude: 40.7128, longitude: -74.0060, quantity: 5, name: "Lower Manhattan" },
    { latitude: 40.8584, longitude: -73.9285, quantity: 5, name: "Bronx" },
    { latitude: 40.7489, longitude: -73.9680, quantity: 8, name: "Midtown" },
    { latitude: 40.6782, longitude: -73.9442, quantity: 7, name: "Brooklyn" },
    { latitude: 40.7614, longitude: -73.9776, quantity: 4, name: "Central Park" },
    { latitude: 40.7282, longitude: -73.7949, quantity: 6, name: "Queens" },
    { latitude: 40.7580, longitude: -73.9855, quantity: 3, name: "Times Square" }
];

// ============================================
// INITIALIZE MAP
// ============================================

function initMap() {
    // Create map centered on NYC
    map = L.map('map').setView([40.7589, -73.9851], 11);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Initialize layer groups
    beforeRouteLayer = L.layerGroup().addTo(map);
    afterRouteLayer = L.layerGroup().addTo(map);
    markersLayer = L.layerGroup().addTo(map);

    console.log('🗺️ Map initialized');
}

// ============================================
// LOAD SAMPLE DATA AND OPTIMIZE
// ============================================

async function loadSampleAndOptimize() {
    showLoading(true);

    try {
        console.log('🚀 Loading sample data and optimizing...');

        // Call backend API to optimize
        const response = await fetch(`${API_URL}/optimize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ routes: sampleRoutes })
        });

        if (!response.ok) {
            throw new Error('Optimization failed');
        }

        const data = await response.json();
        console.log('✅ Optimization complete:', data);

        // Display routes on map
        await displayRoutes(sampleRoutes, data.optimizedRoutes, data);

        // Update stats
        updateStats(data);

        showLoading(false);

    } catch (error) {
        console.error('❌ Error:', error);
        alert('Failed to optimize routes. Make sure backend is running on port 3000.');
        showLoading(false);
    }
}

// ============================================
// DISPLAY ROUTES ON MAP (WITH REAL ROADS)
// ============================================

async function displayRoutes(beforeRoutes, afterRoutes, optimizationData) {
    // Clear existing layers
    beforeRouteLayer.clearLayers();
    afterRouteLayer.clearLayers();
    markersLayer.clearLayers();

    console.log('📍 Drawing routes on map...');

    // Add markers for all locations
    beforeRoutes.forEach((route, index) => {
        const marker = L.marker([route.latitude, route.longitude], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div style="
                    background: #22c55e;
                    color: white;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 14px;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">${index + 1}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        });

        marker.bindPopup(`
            <div class="popup-title">${route.name || `Location ${index + 1}`}</div>
            <div class="popup-detail">📍 Lat: ${route.latitude.toFixed(4)}</div>
            <div class="popup-detail">📍 Lng: ${route.longitude.toFixed(4)}</div>
            <div class="popup-detail">📦 Packages: ${route.quantity}</div>
        `);

        markersLayer.addLayer(marker);
    });

    // Draw BEFORE route (inefficient - red)
    await drawRouteAlongRoads(beforeRoutes, beforeRouteLayer, '#ef4444', 'Before Optimization');

    // Draw AFTER route (optimized - green)
    await drawRouteAlongRoads(afterRoutes, afterRouteLayer, '#22c55e', 'After Optimization');

    // Fit map to show all markers
    const bounds = L.latLngBounds(beforeRoutes.map(r => [r.latitude, r.longitude]));
    map.fitBounds(bounds, { padding: [50, 50] });

    console.log('✅ Routes displayed on map');
}

// ============================================
// DRAW ROUTE ALONG REAL ROADS
// ============================================

async function drawRouteAlongRoads(routes, layer, color, label) {
    if (routes.length < 2) return;

    console.log(`🛣️ Drawing ${label} along roads...`);

    // Use OSRM (Open Source Routing Machine) for road-based routing
    const waypoints = routes.map(r => `${r.longitude},${r.latitude}`).join(';');
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`;

    try {
        const response = await fetch(osrmUrl);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

            // Draw the route
            const polyline = L.polyline(coordinates, {
                color: color,
                weight: 4,
                opacity: 0.8,
                smoothFactor: 1
            });

            polyline.bindPopup(`
                <div class="popup-title">${label}</div>
                <div class="popup-detail">📏 Distance: ${(route.distance / 1000).toFixed(2)} km</div>
                <div class="popup-detail">⏱️ Duration: ${Math.round(route.duration / 60)} minutes</div>
            `);

            layer.addLayer(polyline);

            console.log(`✅ ${label} drawn: ${(route.distance / 1000).toFixed(2)} km`);
        } else {
            console.warn(`⚠️ Could not get road route for ${label}, using straight lines`);
            drawStraightLineRoute(routes, layer, color);
        }
    } catch (error) {
        console.error(`❌ Error drawing ${label}:`, error);
        // Fallback to straight lines
        drawStraightLineRoute(routes, layer, color);
    }
}

// ============================================
// FALLBACK: DRAW STRAIGHT LINE ROUTE
// ============================================

function drawStraightLineRoute(routes, layer, color) {
    const coordinates = routes.map(r => [r.latitude, r.longitude]);

    const polyline = L.polyline(coordinates, {
        color: color,
        weight: 4,
        opacity: 0.6,
        dashArray: '10, 10'
    });

    layer.addLayer(polyline);
}

// ============================================
// UPDATE STATS
// ============================================

function updateStats(data) {
    document.getElementById('distanceBefore').textContent = `${data.before.distance} km`;
    document.getElementById('distanceAfter').textContent = `${data.after.distance} km`;
    document.getElementById('distanceSaved').textContent = `${data.savings.distance} km`;
    document.getElementById('carbonSaved').textContent = `${data.savings.carbon} kg`;
    document.getElementById('savingsPercent').textContent = `${data.savings.percentage}%`;
}

// ============================================
// TOGGLE ROUTES
// ============================================

function toggleBeforeRoute() {
    showBefore = !showBefore;
    if (showBefore) {
        map.addLayer(beforeRouteLayer);
        document.getElementById('beforeToggleText').textContent = 'Hide Before Route';
    } else {
        map.removeLayer(beforeRouteLayer);
        document.getElementById('beforeToggleText').textContent = 'Show Before Route';
    }
}

function toggleAfterRoute() {
    showAfter = !showAfter;
    if (showAfter) {
        map.addLayer(afterRouteLayer);
        document.getElementById('afterToggleText').textContent = 'Hide After Route';
    } else {
        map.removeLayer(afterRouteLayer);
        document.getElementById('afterToggleText').textContent = 'Show After Route';
    }
}

// ============================================
// CLEAR MAP
// ============================================

function clearMap() {
    beforeRouteLayer.clearLayers();
    afterRouteLayer.clearLayers();
    markersLayer.clearLayers();

    document.getElementById('distanceBefore').textContent = '--';
    document.getElementById('distanceAfter').textContent = '--';
    document.getElementById('distanceSaved').textContent = '--';
    document.getElementById('carbonSaved').textContent = '--';
    document.getElementById('savingsPercent').textContent = '--';

    console.log('🗑️ Map cleared');
}

// ============================================
// LOADING OVERLAY
// ============================================

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🗺️ OptiFleet Map Visualization');
    initMap();
});

// ============================================
// CONSOLE BRANDING
// ============================================

console.log(
    '%c🗺️ OptiFleet Map Visualization ',
    'background: linear-gradient(135deg, #22c55e 0%, #0284c7 100%); color: white; padding: 10px 20px; font-size: 18px; font-weight: bold; border-radius: 8px;'
);

console.log(
    '%c✅ Real road-based routing with OpenStreetMap',
    'color: #22c55e; font-size: 12px;'
);
