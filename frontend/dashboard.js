// ============================================
// OPTIFLEET - DASHBOARD JAVASCRIPT (FIXED)
// ============================================

let routes = [];
let optimizationResults = null;
let currentMapView = 'before'; // Track which route is currently displayed

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
      // Simple page reload to refresh application state
      setTimeout(() => {
        window.location.reload();
      }, 300);
    });
  }

  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      // Just a placeholder interaction for now
      alert('👤 User Profile\n\n- Role: Fleet Manager\n- Organization: OptiFleet Logistics\n- Plan: Premium Enterprise');
    });
  }

  // Attach event listeners for multiple sample data buttons
  const sampleBtns = document.querySelectorAll('.load-sample-btn');
  sampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const count = parseInt(btn.getAttribute('data-count'));
      loadSampleData(count);
    });
  });

  const clearAllBtn = document.getElementById('clearAllBtn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllRoutes);
  }

  const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
  if (refreshHistoryBtn) {
    refreshHistoryBtn.addEventListener('click', fetchOrderHistory);
  }

  // Sidebar Panel Navigation
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const panelId = link.getAttribute('data-panel');
      if (panelId) {
        showPanel(panelId);
      }
    });
  });
}

function showPanel(panelId) {
  // Hide all panels
  const panels = document.querySelectorAll('.dashboard-panel');
  panels.forEach(panel => {
    panel.style.display = 'none';
  });

  // Show target panel
  const targetPanel = document.getElementById(panelId);
  if (targetPanel) {
    targetPanel.style.display = 'block';

    // Load history if joining orders panel
    if (panelId === 'panel-orders') {
      fetchOrderHistory();
    }
  }

  // Update Sidebar Active State
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  sidebarLinks.forEach(link => {
    if (link.getAttribute('data-panel') === panelId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Special handling for Leaflet Map resizing
  if (panelId === 'panel-route-planner' && leafletMap) {
    setTimeout(() => {
      leafletMap.invalidateSize();
    }, 100);
  }
}

// ... existing code ...

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

window.loadSampleData = function (count = 7) {
  const allSamples = [
    { id: 1, latitude: 40.7128, longitude: -74.0060, quantity: 5 },  // Depot
    { id: 2, latitude: 40.7489, longitude: -73.9680, quantity: 8 },  // Midtown
    { id: 3, latitude: 40.7614, longitude: -73.9776, quantity: 4 },  // Central Park
    { id: 4, latitude: 40.7580, longitude: -73.9855, quantity: 3 },  // Times Square
    { id: 5, latitude: 40.6782, longitude: -73.9442, quantity: 7 },  // Brooklyn
    { id: 6, latitude: 40.8584, longitude: -73.9285, quantity: 10 }, // Bronx
    { id: 7, latitude: 40.7282, longitude: -73.7949, quantity: 6 }   // Queens
  ];

  // Slice based on count and spread to new objects to avoid reference issues
  routes = allSamples.slice(0, count).map(s => ({ ...s, id: Date.now() + Math.random() }));

  updateRoutesList();
  updateOptimizeButton();
  showSuccessMessage(`Sample data loaded with ${count} stops!`);
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
        body: JSON.stringify({
          routes,
          saveToDatabase: true,
          routeName: `Optimization ${new Date().toLocaleString()}`
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Optimization complete!');
      console.log('Results:', data);

      if (data.vehicleCounts) {
        console.log('🚗 Vehicle Counts:', data.vehicleCounts);
      } else {
        console.warn('⚠️ No vehicleCounts found in response!');
      }

      // Store original routes as beforeRoutes for map visualization
      data.beforeRoutes = routes;

      optimizationResults = data;

      displayResults(data);
      updateStats(data);

      hideLoadingOverlay();
      showSuccessMessage(`✅ Saved ${data.savings.percentage}% distance!`);

      // Optional: Auto switch to RESULTS or MAP? 
      // User said "click the panel to go to it", so we won't auto-switch, 
      // but maybe we should show a toast saying "Check Route Planner and Fleet Management tabs for results".
      showSuccessMessage('Check "Route Planner" and "Fleet Management" panels for results!');

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
  const comparisonTable = document.getElementById('comparisonTable');
  const optimizationDetails = document.getElementById('optimizationDetails');
  const environmentalImpact = document.getElementById('environmentalImpact');

  const vehiclesCount = data.vehicleCounts ? data.vehicleCounts.after : 'N/A';

  // Calculate vehicle type breakdown
  let vehicleDisplay = vehiclesCount;
  if (data.vehicles) {
    const types = {};
    Object.values(data.vehicles).forEach(v => {
      const type = v.type || 'Van';
      types[type] = (types[type] || 0) + (v.vehicle_count_for_cluster || 1);
    });
    const typeStrings = Object.entries(types).map(([type, count]) => `${count} ${type.split(' ')[0]}s`);
    vehicleDisplay = typeStrings.join(', ');
  }

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
                ${data.vehicleCounts ? `
                <tr>
                    <td><strong>Vehicles</strong></td>
                    <td class="metric-value">${data.vehicleCounts.before} (Vans)</td>
                    <td class="metric-value">${vehicleDisplay}</td>
                    <td><span class="metric-improvement">↓ ${Math.max(0, data.vehicleCounts.before - data.vehicleCounts.after)} improved</span></td>
                </tr>` : ''}
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
                <h4>Fleet Assignment</h4>
                <p>${vehicleDisplay}</p>
                <small style="color: var(--color-text-muted);">Vans (10 units), Trucks (30 units)</small>
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

  // Initialize and display the map if needed (it will just be ready when user switches tab)
  const mapSection = document.getElementById('mapSection');
  if (mapSection) {
    // Ensure map section is visible WITHIN its panel (it might be hidden by panel, but display:block on section is fine)
    mapSection.style.display = 'block';
    currentMapView = 'before'; // Reset to before view

    // Initialize map asynchronously
    setTimeout(async () => {
      await initMap();
      await drawBeforeRoute();
      await drawAfterRoute();
      updateMapStats();

      // Show only before route initially
      if (beforeLayer && afterLayer) {
        leafletMap.removeLayer(afterLayer);
      }

      // Fit map to before route bounds IF map is visible. 
      // If panel is hidden, fitBounds might not work perfectly, but we have invalidateSize on showPanel.
      if (leafletMap && beforeLayer) {
        try {
          leafletMap.fitBounds(beforeLayer.getBounds().pad(0.1));
        } catch (e) { console.log("Map not visible yet"); }
      }

      // Add button event listeners
      const beforeBtn = document.getElementById('beforeOptBtn');
      const afterBtn = document.getElementById('afterOptBtn');

      if (beforeBtn) {
        // Remove old listeners to prevent duplicates (by cloning) or just add if we assume reload
        // Ideally we should handle this better, but for now simple add is okay if we don't spam optimize.
        // Better: check if they have listeners? No easy way.
        // Replacement approach: The entire map init is creating listeners. 
        // We should move listener attachment OUT of displayResults or ensure it's idempotent.
        // For this task I'll rely on it being okay or user reloading page.

        beforeBtn.onclick = () => {
          toggleMapView('before');
          if (leafletMap && beforeLayer) {
            leafletMap.fitBounds(beforeLayer.getBounds().pad(0.1));
          }
        };
      }

      if (afterBtn) {
        afterBtn.onclick = () => {
          toggleMapView('after');
          if (leafletMap && afterLayer) {
            leafletMap.fitBounds(afterLayer.getBounds().pad(0.1));
          }
        };
      }
    }, 500);
  }

  // Update Analytics Chart
  updateAnalytics(data);
}

// ============================================
// ORDER HISTORY
// ============================================

async function fetchOrderHistory() {
  const tableBody = document.getElementById('orderHistoryTableBody');
  if (!tableBody) return;

  try {
    const response = await fetch(`${API_URL}/routes`);

    if (!response.ok) {
      if (response.status === 503) {
        const err = await response.json();
        throw new Error(err.message || 'Database disconnected');
      }
      throw new Error('Failed to fetch history');
    }

    const data = await response.json();
    renderOrderHistory(data.routes || []);
  } catch (error) {
    console.error('Error fetching history:', error);
    tableBody.innerHTML = `<tr><td colspan="6" style="padding: var(--spacing-md); text-align: center; color: var(--color-error);">Error loading history data.</td></tr>`;
  }
}

function renderOrderHistory(routeHistory) {
  const tableBody = document.getElementById('orderHistoryTableBody');
  if (!tableBody) return;

  if (routeHistory.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="padding: var(--spacing-xl); text-align: center; color: var(--color-text-muted);">No optimization history found. Run an optimization to see it here.</td></tr>`;
    return;
  }

  tableBody.innerHTML = routeHistory.map(route => {
    const results = route.optimizationResults || {};
    const savings = results.savings || { percentage: 0 };
    const date = new Date(route.createdAt).toLocaleString();
    const locations = route.locations ? route.locations.length : 0;
    const vehiclesCount = results.vehicleCounts ? results.vehicleCounts.after : 'N/A';

    // Calculate vehicle type breakdown
    let vehicleDisplay = vehiclesCount;
    if (results.vehicles) {
      const types = {};
      Object.values(results.vehicles).forEach(v => {
        const type = v.type || 'Van';
        types[type] = (types[type] || 0) + (v.vehicle_count_for_cluster || 1);
      });
      const typeStrings = Object.entries(types).map(([type, count]) => `${count} ${type.split(' ')[0]}s`);
      vehicleDisplay = typeStrings.join(', ');
    }

    return `
            <tr style="border-bottom: 1px solid var(--color-bg-tertiary);">
                <td style="padding: var(--spacing-sm);">${date}</td>
                <td style="padding: var(--spacing-sm);">${route.name || 'Untitled'}</td>
                <td style="padding: var(--spacing-sm);">${locations} stops</td>
                <td style="padding: var(--spacing-sm);">${vehicleDisplay}</td>
                <td style="padding: var(--spacing-sm); font-weight: 600; color: var(--color-success);">${savings.percentage}%</td>
                <td style="padding: var(--spacing-sm);">
                    <button class="btn btn-ghost btn-sm" onclick="alert('View details of ${route._id}')">Details</button>
                </td>
            </tr>
        `;
  }).join('');
}

function hideResults() {
  // Clear the content instead of hiding section
  const comparisonTable = document.getElementById('comparisonTable');
  if (comparisonTable) comparisonTable.innerHTML = '<p style="color: var(--color-text-muted);">Run optimization to see comparisons.</p>';

  const optimizationDetails = document.getElementById('optimizationDetails');
  if (optimizationDetails) optimizationDetails.innerHTML = '<p style="color: var(--color-text-muted);">No active strategy.</p>';

  const environmentalImpact = document.getElementById('environmentalImpact');
  if (environmentalImpact) environmentalImpact.innerHTML = '<p style="color: var(--color-text-muted);">Run optimization to see impact data.</p>';
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

// ============================================
// ANALYTICS & CHARTS
// ============================================

let carbonChartInstance = null;
let vehicleChartInstance = null;

function updateAnalytics(data) {
  // --- Carbon Chart ---
  const ctxCarbon = document.getElementById('carbonChart');
  if (ctxCarbon) {
    if (carbonChartInstance) {
      carbonChartInstance.destroy();
    }

    // Convert to numbers explicitly
    const carbonBefore = parseFloat(data.before.carbon);
    const carbonAfter = parseFloat(data.after.carbon);

    carbonChartInstance = new Chart(ctxCarbon, {
      type: 'bar',
      data: {
        labels: ['Before', 'After'],
        datasets: [{
          label: 'CO₂ Emissions (kg)',
          data: [carbonBefore, carbonAfter],
          backgroundColor: [
            'rgba(204, 0, 0, 0.7)', // Red
            'rgba(0, 170, 0, 0.7)'  // Green
          ],
          borderColor: [
            'rgba(204, 0, 0, 1)',
            'rgba(0, 170, 0, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Carbon Footprint (kg)' }
        }
      }
    });
  }

  // --- Vehicle Chart ---
  const ctxVehicle = document.getElementById('vehicleChart');
  if (ctxVehicle && data.vehicleCounts) {
    if (vehicleChartInstance) {
      vehicleChartInstance.destroy();
    }

    const vehiclesBefore = parseInt(data.vehicleCounts.before);
    const vehiclesAfter = parseInt(data.vehicleCounts.after);

    vehicleChartInstance = new Chart(ctxVehicle, {
      type: 'bar',
      data: {
        labels: ['Before', 'After'],
        datasets: [{
          label: 'Vehicles Required',
          data: [vehiclesBefore, vehiclesAfter],
          backgroundColor: [
            'rgba(255, 159, 64, 0.7)', // Orange
            'rgba(54, 162, 235, 0.7)'  // Blue
          ],
          borderColor: [
            'rgba(255, 159, 64, 1)',
            'rgba(54, 162, 235, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
            title: { display: true, text: 'Vehicles' }
          }
        },
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Fleet Optimization' }
        }
      }
    });
  }
}

// Fetch route geometry from OSRM via Backend Proxy
async function getRouteGeometry(routePoints) {
  if (routePoints.length < 2) return null;

  try {
    // Format coordinates for OSRM: lon,lat;lon,lat...
    const coords = routePoints.map(r => `${r.longitude},${r.latitude}`).join(';');
    console.log('📡 Fetching road geometry for coordinates:', coords);

    // Call Backend Proxy
    const response = await fetch('/api/routes/geometry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ coordinates: coords }),
      signal: AbortSignal.timeout(35000) // 35s timeout for slow OSRM
    });

    console.log('📡 Proxy response status:', response.status);

    if (!response.ok) {
      if (response.status === 504) {
        console.warn('📡 OSRM service is currently very slow (Timeout). Falling back to straight lines.');
        showSuccessMessage('📍 Map: Road-following is slow right now. Using direct lines.');
      } else if (response.status === 404) {
        alert("⚠️ Backend Error: The '/api/routes/geometry' endpoint was not found.\n\nPLEASE RESTART YOUR SERVER (node server.js).");
      } else {
        console.warn('Backend Proxy Error:', response.status);
      }
      throw new Error('Backend route proxy failed');
    }

    const data = await response.json();
    console.log('📡 Received OSRM data:', data);

    if (data.routes && data.routes[0] && data.routes[0].geometry) {
      const latLngs = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
      console.log(`✅ Successfully fetched ${latLngs.length} road points.`);
      return latLngs;
    } else {
      console.warn('📡 OSRM data missing routes or geometry:', data);
    }
  } catch (error) {
    console.error('❌ Could not fetch OSRM route:', error);
  }

  return null;
}

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

async function drawBeforeRoute() {
  if (!leafletMap || !optimizationResults) return;

  if (beforeLayer) {
    leafletMap.removeLayer(beforeLayer);
  }

  const beforeRoutes = optimizationResults.beforeRoutes || routes;
  if (beforeRoutes.length < 2) return;

  // Create a feature group for the before route
  const featureGroup = L.featureGroup();

  // Get actual road geometry from OSRM
  let routeGeometry = null;
  try {
    routeGeometry = await getRouteGeometry(beforeRoutes);
  } catch (err) {
    console.warn('Falling back to straight lines for Before route');
  }

  // Draw polyline for before route
  if (routeGeometry && routeGeometry.length > 0) {
    // Use actual road geometry if available
    L.polyline(routeGeometry, {
      color: '#cc0000',
      weight: 6,
      opacity: 0.6,
      dashArray: '8, 8'
    }).addTo(featureGroup);
  } else {
    // Fallback to straight lines if API fails
    const beforeCoords = beforeRoutes.map(r => [r.latitude, r.longitude]);
    L.polyline(beforeCoords, {
      color: '#cc0000',
      weight: 6,
      opacity: 0.6,
      dashArray: '8, 8'
    }).addTo(featureGroup);
  }

  // Add markers for each stop
  beforeRoutes.forEach((route, index) => {
    // Numbered Marker Icon
    const numberedIcon = L.divIcon({
      className: 'map-marker before',
      html: `<span>${index + 1}</span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    L.marker([route.latitude, route.longitude], { icon: numberedIcon })
      .bindTooltip(`
        <div style="text-align: center;">
            <strong>Stop ${index + 1}</strong><br>
            Lat: ${route.latitude}<br>
            Lng: ${route.longitude}<br>
            Orders: ${route.quantity}
        </div>
      `, { direction: 'top', offset: [0, -10] })
      .addTo(featureGroup);
  });

  beforeLayer = featureGroup;
  featureGroup.addTo(leafletMap);
}

async function drawAfterRoute() {
  if (!leafletMap || !optimizationResults) return;

  if (afterLayer) {
    leafletMap.removeLayer(afterLayer);
  }

  const afterRoutes = optimizationResults.optimizedRoutes || [];
  if (afterRoutes.length < 2) return;

  // Create a feature group for the after route
  const featureGroup = L.featureGroup();

  // Get actual road geometry from OSRM
  let routeGeometry = null;
  try {
    routeGeometry = await getRouteGeometry(afterRoutes);
  } catch (err) {
    console.warn('Falling back to straight lines for After route');
  }

  // Draw polyline for after route
  if (routeGeometry && routeGeometry.length > 0) {
    // Use actual road geometry if available
    L.polyline(routeGeometry, {
      color: '#00aa00',
      weight: 6,
      opacity: 0.8
    }).addTo(featureGroup);
  } else {
    // Fallback to straight lines if API fails
    const afterCoords = afterRoutes.map(r => [r.latitude, r.longitude]);
    L.polyline(afterCoords, {
      color: '#00aa00',
      weight: 6,
      opacity: 0.8
    }).addTo(featureGroup);
  }

  // Add markers for each stop
  afterRoutes.forEach((route, index) => {
    // Numbered Marker Icon
    const numberedIcon = L.divIcon({
      className: 'map-marker after',
      html: `<span>${index + 1}</span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    L.marker([route.latitude, route.longitude], { icon: numberedIcon })
      .bindTooltip(`
        <div style="text-align: center;">
            <strong>Stop ${index + 1}</strong><br>
            Lat: ${route.latitude}<br>
            Lng: ${route.longitude}<br>
            Orders: ${route.quantity}
        </div>
      `, { direction: 'top', offset: [0, -10] })
      .addTo(featureGroup);
  });

  afterLayer = featureGroup;
  featureGroup.addTo(leafletMap);
}

function toggleMapView(view) {
  currentMapView = view;

  // Update button states
  const beforeBtn = document.getElementById('beforeOptBtn');
  const afterBtn = document.getElementById('afterOptBtn');
  const beforeLegend = document.getElementById('beforeLegend');
  const afterLegend = document.getElementById('afterLegend');

  if (view === 'before') {
    beforeBtn.classList.add('btn-primary');
    beforeBtn.classList.remove('btn-ghost');
    afterBtn.classList.remove('btn-primary');
    afterBtn.classList.add('btn-ghost');
    beforeLegend.style.display = 'flex';
    afterLegend.style.display = 'none';

    // Hide after layer, show before layer
    if (afterLayer) leafletMap.removeLayer(afterLayer);
    if (beforeLayer) leafletMap.addLayer(beforeLayer);
  } else {
    afterBtn.classList.add('btn-primary');
    afterBtn.classList.remove('btn-ghost');
    beforeBtn.classList.remove('btn-primary');
    beforeBtn.classList.add('btn-ghost');
    beforeLegend.style.display = 'none';
    afterLegend.style.display = 'flex';

    // Hide before layer, show after layer
    if (beforeLayer) leafletMap.removeLayer(beforeLayer);
    if (afterLayer) leafletMap.addLayer(afterLayer);
  }
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
