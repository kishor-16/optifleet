// ============================================
// OPTIFLEET - MULTI-PANEL DASHBOARD WITH ROAD-BASED ROUTING
// ============================================

let routes = [];
let optimizationResults = null;
let currentPanel = 'dashboard';
let currentMapView = 'before'; // Track which view is shown

// Backend API URL
const API_URL = '/api';

// Leaflet Map
let leafletMap = null;
let beforeLayer = null;
let afterLayer = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚚 OptiFleet Multi-Panel Dashboard Loaded');
    initDashboard();
    initNavigation();
    initRouteForm();
    initOptimization();
    showPanel('dashboard'); // Show dashboard by default
});

// ============================================
// PANEL NAVIGATION
// ============================================

function initNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Get panel name from data attribute
            const panelName = link.getAttribute('data-panel');

            if (panelName) {
                // Update active state
                sidebarLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Show corresponding panel
                showPanel(panelName);
            }
        });
    });
}

function showPanel(panelName) {
    currentPanel = panelName;

    // Hide all panels
    const panels = document.querySelectorAll('.panel-content');
    panels.forEach(panel => panel.style.display = 'none');

    // Show selected panel
    const selectedPanel = document.getElementById(`${panelName}Panel`);
    if (selectedPanel) {
        selectedPanel.style.display = 'block';

        // Initialize panel-specific features
        if (panelName === 'routePlanner') {
            initMapIfNeeded();
        }
    }

    console.log(`📍 Switched to panel: ${panelName}`);
}

// ============================================
// DASHBOARD INITIALIZATION
// ============================================

function initDashboard() {
    updateStats();

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.classList.add('loading');
            setTimeout(() => {
                updateStats();
                refreshBtn.classList.remove('loading');
                showSuccessMessage('Dashboard refreshed!');
            }, 1000);
        });
    }
}

// ============================================
// ROUTE FORM HANDLING
// ============================================

function initRouteForm() {
    const form = document.getElementById('routeForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            addRoute();
        });
    }

    const loadSampleBtn = document.getElementById('loadSampleBtn');
    if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', loadSampleData);
    }

    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllRoutes);
    }
}

function addRoute() {
    const latInput = document.getElementById('lat');
    const lngInput = document.getElementById('lng');
    const qtyInput = document.getElementById('qty');

    const route = {
        id: Date.now(),
        latitude: parseFloat(latInput.value),
        longitude: parseFloat(lngInput.value),
        quantity: parseInt(qtyInput.value)
    };

    if (isNaN(route.latitude) || isNaN(route.longitude) || isNaN(route.quantity)) {
        alert('Please enter valid numbers');
        return;
    }

    if (route.latitude < -90 || route.latitude > 90) {
        alert('Latitude must be between -90 and 90');
        return;
    }

    if (route.longitude < -180 || route.longitude > 180) {
        alert('Longitude must be between -180 and 180');
        return;
    }

    routes.push(route);

    latInput.value = '';
    lngInput.value = '';
    qtyInput.value = '';
    latInput.focus();

    updateRoutesList();
    updateOptimizeButton();
    showSuccessMessage('Location added!');
}

function updateRoutesList() {
    const routesList = document.getElementById('routesList');
    const routeCount = document.getElementById('routeCount');

    if (!routesList || !routeCount) return;

    if (routes.length === 0) {
        routesList.innerHTML = `
            <div class="empty-state">
                <div style="font-size: var(--font-size-3xl); margin-bottom: var(--spacing-sm);">📍</div>
                <p style="color: var(--color-text-tertiary);">No locations added yet</p>
                <p style="color: var(--color-text-muted); font-size: var(--font-size-sm);">Add delivery locations to start optimizing</p>
            </div>
        `;
        routeCount.textContent = '0 locations';
    } else {
        routesList.innerHTML = routes.map((route, index) => `
            <div class="route-item">
                <div class="route-item-info">
                    <div class="route-item-location">📍 Location ${index + 1}</div>
                    <div class="route-item-details">
                        Lat: ${route.latitude.toFixed(4)}, Lng: ${route.longitude.toFixed(4)} • ${route.quantity} packages
                    </div>
                </div>
                <div class="route-item-actions">
                    <button class="btn-icon" onclick="editRoute(${route.id})" title="Edit">✏️</button>
                    <button class="btn-icon danger" onclick="deleteRoute(${route.id})" title="Delete">🗑️</button>
                </div>
            </div>
        `).join('');

        routeCount.textContent = `${routes.length} location${routes.length !== 1 ? 's' : ''}`;
    }

    updateStats();
}

function deleteRoute(id) {
    if (confirm('Delete this location?')) {
        routes = routes.filter(route => route.id !== id);
        updateRoutesList();
        updateOptimizeButton();
        showSuccessMessage('Location deleted');
    }
}

function editRoute(id) {
    const route = routes.find(r => r.id === id);
    if (route) {
        document.getElementById('lat').value = route.latitude;
        document.getElementById('lng').value = route.longitude;
        document.getElementById('qty').value = route.quantity;
        deleteRoute(id);
    }
}

function updateOptimizeButton() {
    const optimizeBtn = document.getElementById('optimizeBtn');
    if (!optimizeBtn) return;

    optimizeBtn.disabled = routes.length < 2;

    if (routes.length < 2) {
        optimizeBtn.innerHTML = `<span>⚡</span><span>Add at least 2 locations</span>`;
    } else {
        optimizeBtn.innerHTML = `<span>⚡</span><span>Optimize ${routes.length} Locations</span>`;
    }
}

// ============================================
// SAMPLE DATA
// ============================================

function loadSampleData() {
    routes = [
        { id: Date.now() + 1, latitude: 40.7128, longitude: -74.0060, quantity: 5, name: "Lower Manhattan" },
        { id: Date.now() + 2, latitude: 40.8584, longitude: -73.9285, quantity: 5, name: "Bronx" },
        { id: Date.now() + 3, latitude: 40.7489, longitude: -73.9680, quantity: 8, name: "Midtown" },
        { id: Date.now() + 4, latitude: 40.6782, longitude: -73.9442, quantity: 7, name: "Brooklyn" },
        { id: Date.now() + 5, latitude: 40.7614, longitude: -73.9776, quantity: 4, name: "Central Park" },
        { id: Date.now() + 6, latitude: 40.7282, longitude: -73.7949, quantity: 6, name: "Queens" },
        { id: Date.now() + 7, latitude: 40.7580, longitude: -73.9855, quantity: 3, name: "Times Square" }
    ];

    updateRoutesList();
    updateOptimizeButton();
    showSuccessMessage('Sample data loaded - Routes are deliberately inefficient!');
}

function clearAllRoutes() {
    if (routes.length === 0 || confirm('Clear all locations?')) {
        routes = [];
        optimizationResults = null;
        updateRoutesList();
        updateOptimizeButton();
        showSuccessMessage('All locations cleared');
    }
}

// ============================================
// OPTIMIZATION
// ============================================

function initOptimization() {
    const optimizeBtn = document.getElementById('optimizeBtn');
    if (!optimizeBtn) return;

    optimizeBtn.addEventListener('click', async () => {
        if (routes.length < 2) return;

        showLoadingOverlay('Optimizing routes with REAL mathematics...');

        try {
            console.log('🚀 Starting optimization...');

            const response = await fetch(`${API_URL}/optimize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ routes })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Optimization complete!');

            optimizationResults = data;

            // Update all panels with results
            updateFleetManagementPanel(data);
            updateCarbonTrackingPanel(data);
            updateRoutePlannerPanel(data);
            updateStats(data);

            hideLoadingOverlay();
            showSuccessMessage(`✅ Saved ${data.savings.percentage}% distance!`);

        } catch (error) {
            console.error('❌ Error:', error);
            hideLoadingOverlay();
            alert(`Optimization failed: ${error.message}\n\nMake sure backend is running on port 3000`);
        }
    });
}

// ============================================
// UPDATE FLEET MANAGEMENT PANEL
// ============================================

function updateFleetManagementPanel(data) {
    const comparisonTable = document.getElementById('comparisonTable');
    const optimizationDetails = document.getElementById('optimizationDetails');

    if (comparisonTable) {
        comparisonTable.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Before</th>
                        <th>After</th>
                        <th>Savings</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Distance</strong></td>
                        <td class="metric-value">${data.before.distance} km</td>
                        <td class="metric-value">${data.after.distance} km</td>
                        <td><span class="metric-improvement">↓ ${data.savings.distance} km (${data.savings.percentage}%)</span></td>
                    </tr>
                    <tr>
                        <td><strong>Fuel</strong></td>
                        <td class="metric-value">${data.before.fuel} L</td>
                        <td class="metric-value">${data.after.fuel} L</td>
                        <td><span class="metric-improvement">↓ ${data.savings.fuel} L</span></td>
                    </tr>
                    <tr>
                        <td><strong>CO₂</strong></td>
                        <td class="metric-value">${data.before.carbon} kg</td>
                        <td class="metric-value">${data.after.carbon} kg</td>
                        <td><span class="metric-improvement">↓ ${data.savings.carbon} kg</span></td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    if (optimizationDetails) {
        optimizationDetails.innerHTML = `
            <div class="detail-item">
                <div class="detail-icon">🤖</div>
                <div class="detail-content">
                    <h4>Algorithm</h4>
                    <p>${data.optimizer || 'Nearest Neighbor TSP'}</p>
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-icon">📍</div>
                <div class="detail-content">
                    <h4>Locations</h4>
                    <p>${routes.length} delivery locations optimized</p>
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-icon">🚛</div>
                <div class="detail-content">
                    <h4>Vehicle</h4>
                    <p>Standard delivery van (12L/100km)</p>
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-icon">⏱️</div>
                <div class="detail-content">
                    <h4>Time Saved</h4>
                    <p>~${(parseFloat(data.savings.distance) * 2).toFixed(0)} minutes</p>
                </div>
            </div>
        `;
    }
}

// ============================================
// UPDATE CARBON TRACKING PANEL
// ============================================

function updateCarbonTrackingPanel(data) {
    const environmentalImpact = document.getElementById('environmentalImpact');

    if (environmentalImpact) {
        const treesPlanted = (parseFloat(data.savings.carbon) / 21).toFixed(1);
        const carMiles = (parseFloat(data.savings.distance) * 0.621371).toFixed(1);
        const costSaved = (parseFloat(data.savings.fuel) * 1.5).toFixed(2);

        environmentalImpact.innerHTML = `
            <div class="impact-item">
                <div class="impact-label"><span>🌳</span><span>Trees Planted Equivalent</span></div>
                <div class="impact-value">${treesPlanted}</div>
            </div>
            <div class="impact-item">
                <div class="impact-label"><span>🚗</span><span>Car Miles Not Driven</span></div>
                <div class="impact-value">${carMiles}</div>
            </div>
            <div class="impact-item">
                <div class="impact-label"><span>💰</span><span>Cost Savings</span></div>
                <div class="impact-value">$${costSaved}</div>
            </div>
            <div class="impact-item">
                <div class="impact-label"><span>📦</span><span>Packages</span></div>
                <div class="impact-value">${routes.reduce((sum, r) => sum + r.quantity, 0)}</div>
            </div>
        `;
    }
}

// ============================================
// UPDATE ROUTE PLANNER PANEL (MAP WITH REAL ROADS)
// ============================================

function updateRoutePlannerPanel(data) {
    window.optimizationData = data;

    if (currentPanel === 'routePlanner') {
        initMapIfNeeded();
    }
}

function initMapIfNeeded() {
    const mapContainer = document.getElementById('mapContainer');
    if (!mapContainer) return;

    if (!window.optimizationData || !routes || routes.length === 0) {
        mapContainer.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--color-text-tertiary);">
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🗺️</div>
                    <p>Optimize routes first to see map visualization</p>
                    <p style="font-size: 14px; margin-top: 8px;">Go to Dashboard panel and click "Optimize Routes"</p>
                </div>
            </div>
        `;
        return;
    }

    if (!leafletMap) {
        mapContainer.innerHTML = '';

        const firstRoute = routes[0];
        leafletMap = L.map('mapContainer').setView([firstRoute.latitude, firstRoute.longitude], 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(leafletMap);

        beforeLayer = L.layerGroup();
        afterLayer = L.layerGroup();

        console.log('🗺️ Map initialized');
    }

    setupMapToggleButtons();
    showMapView('before');
}

function setupMapToggleButtons() {
    const beforeBtn = document.getElementById('beforeOptBtn');
    const afterBtn = document.getElementById('afterOptBtn');

    if (beforeBtn && afterBtn) {
        beforeBtn.onclick = () => showMapView('before');
        afterBtn.onclick = () => showMapView('after');
    }
}

async function showMapView(view) {
    currentMapView = view;

    const beforeBtn = document.getElementById('beforeOptBtn');
    const afterBtn = document.getElementById('afterOptBtn');
    const beforeLegend = document.getElementById('beforeLegend');
    const afterLegend = document.getElementById('afterLegend');

    if (beforeBtn && afterBtn) {
        if (view === 'before') {
            beforeBtn.className = 'btn btn-primary';
            afterBtn.className = 'btn btn-ghost';
            if (beforeLegend) beforeLegend.style.display = 'flex';
            if (afterLegend) afterLegend.style.display = 'none';
        } else {
            beforeBtn.className = 'btn btn-ghost';
            afterBtn.className = 'btn btn-primary';
            if (beforeLegend) beforeLegend.style.display = 'none';
            if (afterLegend) afterLegend.style.display = 'flex';
        }
    }

    beforeLayer.clearLayers();
    afterLayer.clearLayers();
    leafletMap.removeLayer(beforeLayer);
    leafletMap.removeLayer(afterLayer);

    if (view === 'before') {
        await drawRouteWithRoads(routes, beforeLayer, '#cc0000', 'Before Optimization', window.optimizationData.before);
        leafletMap.addLayer(beforeLayer);
    } else {
        if (window.optimizationData.optimizedRoutes) {
            await drawRouteWithRoads(window.optimizationData.optimizedRoutes, afterLayer, '#00aa00', 'After Optimization', window.optimizationData.after);
            leafletMap.addLayer(afterLayer);
        }
    }

    const bounds = L.latLngBounds(routes.map(r => [r.latitude, r.longitude]));
    leafletMap.fitBounds(bounds, { padding: [50, 50] });

    console.log(`🗺️ Showing ${view} route`);
}

async function drawRouteWithRoads(routePoints, layer, color, label, stats) {
    routePoints.forEach((route, index) => {
        const marker = L.marker([route.latitude, route.longitude], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div style="
                    background: ${color};
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 14px;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">${index + 1}</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            })
        });

        marker.bindPopup(`
            <div style="font-family: Inter, sans-serif;">
                <div style="font-weight: 600; color: ${color}; margin-bottom: 8px;">
                    ${route.name || `Location ${index + 1}`}
                </div>
                <div style="color: #64748b; font-size: 13px; margin: 4px 0;">
                    📍 Lat: ${route.latitude.toFixed(4)}
                </div>
                <div style="color: #64748b; font-size: 13px; margin: 4px 0;">
                    📍 Lng: ${route.longitude.toFixed(4)}
                </div>
                <div style="color: #64748b; font-size: 13px; margin: 4px 0;">
                    📦 Packages: ${route.quantity}
                </div>
            </div>
        `);

        layer.addLayer(marker);
    });

    // Add START marker (green flag 🚩)
    if (routePoints.length > 0) {
        const startPoint = routePoints[0];
        const startMarker = L.marker([startPoint.latitude, startPoint.longitude], {
            icon: L.divIcon({
                className: 'start-marker',
                html: `<div style="
                    font-size: 32px;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                    transform: translate(-8px, -32px);
                ">🚩</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            })
        });

        startMarker.bindPopup(`
            <div style="font-family: Inter, sans-serif;">
                <div style="font-weight: 600; color: #22c55e; margin-bottom: 8px; font-size: 14px;">
                    🚩 START POINT
                </div>
                <div style="color: #64748b; font-size: 13px;">
                    ${startPoint.name || 'First Location'}
                </div>
                <div style="color: #64748b; font-size: 12px; margin-top: 4px;">
                    Begin route here
                </div>
            </div>
        `);

        layer.addLayer(startMarker);
    }

    // Add END marker (checkered flag 🏁)
    if (routePoints.length > 1) {
        const endPoint = routePoints[routePoints.length - 1];
        const endMarker = L.marker([endPoint.latitude, endPoint.longitude], {
            icon: L.divIcon({
                className: 'end-marker',
                html: `<div style="
                    font-size: 32px;
                    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                    transform: translate(-8px, -32px);
                ">🏁</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            })
        });

        endMarker.bindPopup(`
            <div style="font-family: Inter, sans-serif;">
                <div style="font-weight: 600; color: #ef4444; margin-bottom: 8px; font-size: 14px;">
                    🏁 END POINT
                </div>
                <div style="color: #64748b; font-size: 13px;">
                    ${endPoint.name || 'Last Location'}
                </div>
                <div style="color: #64748b; font-size: 12px; margin-top: 4px;">
                    Finish route here
                </div>
            </div>
        `);

        layer.addLayer(endMarker);
    }

    if (routePoints.length >= 2) {
        try {
            const waypoints = routePoints.map(r => `${r.longitude},${r.latitude}`).join(';');
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`;

            console.log(`🛣️ Fetching road route for ${label}...`);
            const response = await fetch(osrmUrl);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

                const polyline = L.polyline(coordinates, {
                    color: color,
                    weight: 5,
                    opacity: 0.8,
                    smoothFactor: 1
                });

                const durationMin = Math.round(route.duration / 60);

                polyline.bindPopup(`
                    <div style="font-family: Inter, sans-serif;">
                        <div style="font-weight: 600; color: ${color}; margin-bottom: 8px;">
                            ${label}
                        </div>
                        <div style="color: #64748b; font-size: 13px; margin: 4px 0;">
                            📏 Distance: ${stats.distance} km
                        </div>
                        <div style="color: #64748b; font-size: 13px; margin: 4px 0;">
                            ⛽ Fuel: ${stats.fuel} L
                        </div>
                        <div style="color: #64748b; font-size: 13px; margin: 4px 0;">
                            💨 CO₂: ${stats.carbon} kg
                        </div>
                        <div style="color: #64748b; font-size: 13px; margin: 4px 0;">
                            ⏱️ Duration: ~${durationMin} min
                        </div>
                        ${label === 'After Optimization' ? `
                        <div style="color: #00aa00; font-size: 13px; margin-top: 8px; font-weight: 600;">
                            ✅ Saved: ${window.optimizationData.savings.percentage}%
                        </div>
                        ` : ''}
                    </div>
                `);

                layer.addLayer(polyline);
                console.log(`✅ ${label} drawn along roads`);
            } else {
                drawStraightLineRoute(routePoints, layer, color, label, stats);
            }
        } catch (error) {
            console.error(`❌ Error fetching road route:`, error);
            drawStraightLineRoute(routePoints, layer, color, label, stats);
        }
    }
}

function drawStraightLineRoute(routePoints, layer, color, label, stats) {
    const coordinates = routePoints.map(r => [r.latitude, r.longitude]);

    const polyline = L.polyline(coordinates, {
        color: color,
        weight: 4,
        opacity: 0.6,
        dashArray: '10, 10'
    });

    polyline.bindPopup(`
        <div style="font-family: Inter, sans-serif;">
            <div style="font-weight: 600; color: ${color}; margin-bottom: 8px;">
                ${label}
            </div>
            <div style="color: #64748b; font-size: 13px;">
                📏 Distance: ${stats.distance} km
            </div>
            <div style="color: #64748b; font-size: 13px;">
                ⛽ Fuel: ${stats.fuel} L
            </div>
            <div style="color: #64748b; font-size: 13px;">
                💨 CO₂: ${stats.carbon} kg
            </div>
        </div>
    `);

    layer.addLayer(polyline);
}

// ============================================
// STATS UPDATE
// ============================================

function updateStats(data = null) {
    const totalRoutesEl = document.getElementById('totalRoutes');
    const carbonSavedEl = document.getElementById('carbonSaved');
    const distanceSavedEl = document.getElementById('distanceSaved');
    const fuelSavedEl = document.getElementById('fuelSaved');

    if (totalRoutesEl) totalRoutesEl.textContent = routes.length;

    if (data && data.savings) {
        if (carbonSavedEl) carbonSavedEl.textContent = `${data.savings.carbon} kg`;
        if (distanceSavedEl) distanceSavedEl.textContent = `${data.savings.distance} km`;
        if (fuelSavedEl) fuelSavedEl.textContent = `${data.savings.fuel} L`;
    } else {
        if (carbonSavedEl) carbonSavedEl.textContent = '0 kg';
        if (distanceSavedEl) distanceSavedEl.textContent = '0 km';
        if (fuelSavedEl) fuelSavedEl.textContent = '0 L';
    }
}

// ============================================
// UI HELPERS
// ============================================

function showLoadingOverlay(message = 'Loading...') {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay active';
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }
}

function showSuccessMessage(message) {
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.innerHTML = `<span>✓</span><span>${message}</span>`;
    document.body.appendChild(successMsg);

    setTimeout(() => {
        successMsg.classList.add('hide');
        setTimeout(() => successMsg.remove(), 300);
    }, 3000);
}

// ============================================
// CONSOLE BRANDING
// ============================================

console.log(
    '%c🚚 OptiFleet Multi-Panel Dashboard ',
    'background: linear-gradient(135deg, #22c55e 0%, #0284c7 100%); color: white; padding: 10px 20px; font-size: 18px; font-weight: bold; border-radius: 8px;'
);

console.log(
    '%c✅ Dashboard with road-based routing initialized',
    'color: #22c55e; font-size: 12px;'
);
