const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    metrics: {
        totalRoutes: {
            type: Number,
            default: 0
        },
        totalOptimizations: {
            type: Number,
            default: 0
        },
        totalDistance: {
            type: Number,
            default: 0
        },
        totalDistanceSaved: {
            type: Number,
            default: 0
        },
        totalFuelSaved: {
            type: Number,
            default: 0
        },
        totalCarbonSaved: {
            type: Number,
            default: 0
        },
        totalPackages: {
            type: Number,
            default: 0
        },
        averageSavingsPercentage: {
            type: Number,
            default: 0
        }
    },
    period: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        default: 'daily'
    }
}, {
    timestamps: true
});

// Index for efficient date-based queries
AnalyticsSchema.index({ date: -1, period: 1 });

// Static method to aggregate analytics
AnalyticsSchema.statics.aggregateMetrics = async function (startDate, endDate) {
    const Route = mongoose.model('Route');

    const routes = await Route.find({
        createdAt: { $gte: startDate, $lte: endDate },
        optimized: true
    });

    const metrics = routes.reduce((acc, route) => {
        const results = route.optimizationResults;
        if (results && results.savings) {
            acc.totalDistanceSaved += parseFloat(results.savings.distance) || 0;
            acc.totalFuelSaved += parseFloat(results.savings.fuel) || 0;
            acc.totalCarbonSaved += parseFloat(results.savings.carbon) || 0;
            acc.totalOptimizations += 1;
            acc.totalPackages += route.totalPackages || 0;
        }
        return acc;
    }, {
        totalRoutes: routes.length,
        totalOptimizations: 0,
        totalDistanceSaved: 0,
        totalFuelSaved: 0,
        totalCarbonSaved: 0,
        totalPackages: 0
    });

    return metrics;
};

module.exports = mongoose.model('Analytics', AnalyticsSchema);
