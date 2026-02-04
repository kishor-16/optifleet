const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// Helmet with custom CSP to allow Leaflet and mapping services
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            fontSrc: ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", "https://tile.openstreetmap.org", "https://router.project-osrm.org", "https://api.mapbox.com"],
        }
    }
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// ============================================
// MONGODB CONNECTION
// ============================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/optifleet';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('✅ MongoDB Connected Successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);
    })
    .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.log('⚠️  Running without database - using in-memory storage');
    });

// ============================================
// API ROUTES
// ============================================

const optimizationRoutes = require('./routes/optimization');
const routeRoutes = require('./routes/routes');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/optimize', optimizationRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        uptime: process.uptime()
    });
});

// ============================================
// SERVE REACT APP IN PRODUCTION
// ============================================

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    });
} else {
    // Development mode - serve static frontend
    app.use(express.static(path.join(__dirname, 'frontend')));

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
    });
}

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚚 OptiFleet MERN Stack Server Started!');
    console.log('='.repeat(60));
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}/api`);
    console.log(`💚 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️  Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    console.log('='.repeat(60));
    console.log('✅ Ready to optimize routes and reduce carbon emissions!\n');
});

module.exports = app;
