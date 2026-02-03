const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    locations: [{
        latitude: {
            type: Number,
            required: true,
            min: -90,
            max: 90
        },
        longitude: {
            type: Number,
            required: true,
            min: -180,
            max: 180
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        address: String,
        deliveryWindow: {
            start: Date,
            end: Date
        }
    }],
    optimized: {
        type: Boolean,
        default: false
    },
    optimizationResults: {
        before: {
            distance: Number,
            fuel: Number,
            carbon: Number
        },
        after: {
            distance: Number,
            fuel: Number,
            carbon: Number
        },
        savings: {
            distance: Number,
            fuel: Number,
            carbon: Number,
            percentage: Number
        },
        optimizer: String,
        clusters: mongoose.Schema.Types.Mixed,
        vehicles: mongoose.Schema.Types.Mixed
    },
    status: {
        type: String,
        enum: ['draft', 'optimized', 'in-progress', 'completed'],
        default: 'draft'
    },
    createdBy: {
        type: String,
        default: 'system'
    },
    tags: [String],
    notes: String
}, {
    timestamps: true
});

// Indexes for better query performance
RouteSchema.index({ createdAt: -1 });
RouteSchema.index({ status: 1 });
RouteSchema.index({ optimized: 1 });

// Virtual for total packages
RouteSchema.virtual('totalPackages').get(function () {
    return this.locations.reduce((sum, loc) => sum + loc.quantity, 0);
});

// Method to calculate route statistics
RouteSchema.methods.calculateStats = function () {
    return {
        totalLocations: this.locations.length,
        totalPackages: this.totalPackages,
        optimized: this.optimized,
        carbonSaved: this.optimizationResults?.savings?.carbon || 0
    };
};

module.exports = mongoose.model('Route', RouteSchema);
