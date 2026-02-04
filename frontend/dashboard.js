// ============================================
// OPTIFLEET - DASHBOARD JAVASCRIPT (FIXED)
// ============================================

let routes = [];
let optimizationResults = null;

// Backend API URL (use relative path so frontend follows the server origin)
const API_URL = '/api';

// Leaflet Map Configuration
let leafletMap = null;
let beforeLayer = null;
let afterLayer = null;

// Load Leaflet CSS and JS dynamically if not already loaded
function ensureLeaflet() {
    if (typeof L === 'undefined') {
        // Load Leaflet CSS
        const leafletCSS = document.createElement('link');
        leafletCSS.rel = 'stylesheet';
        leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(leafletCSS);

        // Load Leaflet JS
        return new Promise((resolve) => {
            const leafletScript = document.createElement('script');
            leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            leafletScript.onload = resolve;
            document.head.appendChild(leafletScript);
        });
    }
    return Promise.resolve();
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚚 OptiFleet Dashboard Loaded');
  console.log('API URL:', API_URL);
  initDashboard();
  initRouteForm();
  initOptimization();
});

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

  // Attach event listeners for sample data and clear buttons
  const loadSampleBtn = document.getElementById('loadSampleBtn');
  if (loadSampleBtn) {
    loadSampleBtn.addEventListener('click', loadSampleData);
  }

  const clearAllBtn = document.getElementById('clearAllBtn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllRoutes);
  }

  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      if (link.getAttribute('href') === '#') {
        e.preventDefault();
        sidebarLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  });
}

// ============================================
// ROUTE FORM HANDLING
// ============================================

function initRouteForm() {
  const form = document.getElementById('routeForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addRoute();
  });
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

  // Validate
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

window.loadSampleData = function () {
  // Deliberately inefficient route - locations jump all over NYC
  // This will show CLEAR optimization results!
  routes = [
    { id: Date.now() + 1, latitude: 40.7128, longitude: -74.0060, quantity: 5 },  // Lower Manhattan
    { id: Date.now() + 2, latitude: 40.8584, longitude: -73.9285, quantity: 5 },  // Bronx (FAR NORTH)
    { id: Date.now() + 3, latitude: 40.7489, longitude: -73.9680, quantity: 8 },  // Midtown
    { id: Date.now() + 4, latitude: 40.6782, longitude: -73.9442, quantity: 7 },  // Brooklyn (FAR SOUTH)
    { id: Date.now() + 5, latitude: 40.7614, longitude: -73.9776, quantity: 4 },  // Central Park
    { id: Date.now() + 6, latitude: 40.7282, longitude: -73.7949, quantity: 6 },  // Queens (FAR EAST)
    { id: Date.now() + 7, latitude: 40.7580, longitude: -73.9855, quantity: 3 }   // Times Square
  ];

  updateRoutesList();
  updateOptimizeButton();
  showSuccessMessage('Sample data loaded - Routes are deliberately inefficient!');
};

window.clearAllRoutes = function () {
  if (routes.length === 0 || confirm('Clear all locations?')) {
    routes = [];
    optimizationResults = null;
    updateRoutesList();
    updateOptimizeButton();
    hideResults();
    showSuccessMessage('All locations cleared');
  }
};

// ============================================
// OPTIMIZATION
// ============================================

function initOptimization() {
  const optimizeBtn = document.getElementById('optimizeBtn');

  optimizeBtn.addEventListener('click', async () => {
    if (routes.length < 2) return;

    showLoadingOverlay('Optimizing routes with REAL mathematics...');

    try {
      console.log('🚀 Starting optimization...');
      console.log('Routes:', routes);

      const response = await fetch(`${API_URL}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ routes })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Optimization complete!');
      console.log('Results:', data);

      // Store original routes as beforeRoutes for map visualization
      data.beforeRoutes = routes;
      
      optimizationResults = data;

      displayResults(data);
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
// RESULTS DISPLAY
// ============================================

function displayResults(data) {
  const resultsSection = document.getElementById('resultsSection');
  const comparisonTable = document.getElementById('comparisonTable');
  const optimizationDetails = document.getElementById('optimizationDetails');
  const environmentalImpact = document.getElementById('environmentalImpact');

  resultsSection.style.display = 'block';

  setTimeout(() => {
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 300);

  // Comparison Table
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

  // Optimization Details
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

  // Environmental Impact
  const treesPlanted = data.environmental?.treesPlanted || (parseFloat(data.savings.carbon) / 21).toFixed(1);
  const carMiles = data.environmental?.carMilesNotDriven || (parseFloat(data.savings.distance) * 0.621371).toFixed(1);
  const costSaved = data.savings?.cost || (parseFloat(data.savings.fuel) * 1.5).toFixed(2);

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

  // Initialize and display the map
  const mapSection = document.getElementById('mapSection');
  if (mapSection) {
    mapSection.style.display = 'block';
    
    // Initialize map asynchronously
    setTimeout(async () => {
      await initMap();
      drawBeforeRoute();
      drawAfterRoute();
      updateMapStats();
      
      // Fit map to bounds
      if (leafletMap && beforeLayer) {
        const group = new L.featureGroup([beforeLayer, afterLayer]);
        leafletMap.fitBounds(group.getBounds().pad(0.1));
      }
    }, 500);
  }
}

function hideResults() {
  document.getElementById('resultsSection').style.display = 'none';
}

// ============================================
// STATS UPDATE
// ============================================

function updateStats(data = null) {
  const totalRoutesEl = document.getElementById('totalRoutes');
  const carbonSavedEl = document.getElementById('carbonSaved');
  const distanceSavedEl = document.getElementById('distanceSaved');
  const fuelSavedEl = document.getElementById('fuelSaved');

  if (data && data.savings) {
    totalRoutesEl.textContent = routes.length;
    carbonSavedEl.textContent = `${data.savings.carbon} kg`;
    distanceSavedEl.textContent = `${data.savings.distance} km`;
    fuelSavedEl.textContent = `${data.savings.fuel} L`;
  } else {
    totalRoutesEl.textContent = routes.length;
    carbonSavedEl.textContent = '0 kg';
    distanceSavedEl.textContent = '0 km';
    fuelSavedEl.textContent = '0 L';
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
// MAP VISUALIZATION
// ============================================

async function initMap() {
  await ensureLeaflet();

  const mapContainer = document.getElementById('mapContainer');
  if (!mapContainer) return;

  // Initialize map centered on NYC
  leafletMap = L.map('mapContainer').setView([40.7128, -74.0060], 11);

  // Add OpenStreetMap tiles with reduced opacity for lighter appearance
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    opacity: 0.5
  }).addTo(leafletMap);
}

function drawBeforeRoute() {
  if (!leafletMap || !optimizationResults) return;

  if (beforeLayer) {
    leafletMap.removeLayer(beforeLayer);
  }

  const beforeRoutes = optimizationResults.beforeRoutes || routes;
  if (beforeRoutes.length < 2) return;

  // Create a feature group for the before route
  const featureGroup = L.featureGroup();

  // Draw polyline for before route
  const beforeCoords = beforeRoutes.map(r => [r.latitude, r.longitude]);
  L.polyline(beforeCoords, {
    color: '#cc0000',
    weight: 6,
    opacity: 1,
    dashArray: '8, 4'
  }).addTo(featureGroup);

  // Add markers for each stop
  beforeRoutes.forEach((route, index) => {
    L.circleMarker([route.latitude, route.longitude], {
      radius: 8,
      fillColor: '#ff6b6b',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    })
      .bindPopup(`<strong>Stop ${index + 1}</strong><br>Before: Qty ${route.quantity}`)
      .addTo(featureGroup);
  });

  beforeLayer = featureGroup;
  featureGroup.addTo(leafletMap);
}

function drawAfterRoute() {
  if (!leafletMap || !optimizationResults) return;

  if (afterLayer) {
    leafletMap.removeLayer(afterLayer);
  }

  const afterRoutes = optimizationResults.optimizedRoutes || [];
  if (afterRoutes.length < 2) return;

  // Create a feature group for the after route
  const featureGroup = L.featureGroup();

  // Draw polyline for after route
  const afterCoords = afterRoutes.map(r => [r.latitude, r.longitude]);
  L.polyline(afterCoords, {
    color: '#00aa00',
    weight: 6,
    opacity: 1
  }).addTo(featureGroup);

  // Add markers for each stop
  afterRoutes.forEach((route, index) => {
    L.circleMarker([route.latitude, route.longitude], {
      radius: 8,
      fillColor: '#51cf66',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    })
      .bindPopup(`<strong>Stop ${index + 1}</strong><br>After: Qty ${route.quantity}`)
      .addTo(featureGroup);
  });

  afterLayer = featureGroup;
  featureGroup.addTo(leafletMap);
}

function updateMapStats() {
  if (!optimizationResults) return;

  const statsDiv = document.getElementById('mapStats');
  if (statsDiv) {
    statsDiv.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
        <div>
          <strong style="color: #ff6b6b;">Before:</strong> ${optimizationResults.before.distance} km
        </div>
        <div>
          <strong style="color: #51cf66;">After:</strong> ${optimizationResults.after.distance} km
        </div>
        <div style="grid-column: 1 / -1;">
          <strong>Savings:</strong> ${optimizationResults.savings.distance} km (${optimizationResults.savings.percentage}%)
        </div>
      </div>
    `;
  }
}

// ============================================

console.log(
  '%c🚚 OptiFleet Dashboard ',
  'background: linear-gradient(135deg, #22c55e 0%, #0284c7 100%); color: white; padding: 10px 20px; font-size: 18px; font-weight: bold; border-radius: 8px;'
);

console.log(
  '%c✅ Dashboard initialized with REAL mathematics',
  'color: #22c55e; font-size: 12px;'
);
