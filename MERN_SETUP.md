# ============================================
# OptiFleet MERN Stack - Complete Setup Guide
# ============================================

## 🚀 Quick Setup (5 Steps)

### Step 1: Install Dependencies
```bash
cd c:\Desktop\kishor\optifleet
npm install
```

### Step 2: Create React App
```bash
npx create-react-app client
```

### Step 3: Install MongoDB (if not installed)
Download from: https://www.mongodb.com/try/download/community
Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

### Step 4: Start MongoDB
```bash
# Windows - MongoDB as service (usually auto-starts)
# Or manually:
mongod
```

### Step 5: Start the Application
```bash
# Terminal 1 - Start Backend
npm run server

# Terminal 2 - Start React Frontend
cd client
npm start
```

---

## 📦 What's Been Created

### Backend (Node.js + Express + MongoDB)
- ✅ `server.js` - Main MERN server
- ✅ `models/Route.js` - MongoDB route schema
- ✅ `models/Analytics.js` - Analytics schema
- ✅ `routes/optimization.js` - Optimization API
- ✅ `routes/routes.js` - CRUD operations
- ✅ `routes/analytics.js` - Analytics API
- ✅ `.env` - Environment configuration
- ✅ `package.json` - MERN dependencies

### Frontend (React - To be created)
- 🔄 Will be created in `client/` folder
- 🔄 React components for dashboard
- 🔄 State management with hooks
- 🔄 API integration
- 🔄 Professional UI with Material-UI

---

## 🗄️ MongoDB Setup

### Option 1: Local MongoDB
```bash
# Install MongoDB Community Edition
# Windows: https://www.mongodb.com/try/download/community

# Start MongoDB
mongod

# Verify connection
mongo
> show dbs
```

### Option 2: MongoDB Atlas (Cloud - Recommended)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Update `.env` file:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/optifleet
```

---

## 🔧 Environment Variables

Update `.env` file:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/optifleet
JWT_SECRET=your_secret_key_here
```

---

## 🎯 API Endpoints

### Optimization
- `POST /api/optimize` - Optimize routes
  ```json
  {
    "routes": [...],
    "saveToDatabase": true,
    "routeName": "NYC Delivery Route"
  }
  ```

### Routes Management
- `GET /api/routes` - Get all routes
- `GET /api/routes/:id` - Get single route
- `POST /api/routes` - Create route
- `PUT /api/routes/:id` - Update route
- `DELETE /api/routes/:id` - Delete route
- `GET /api/routes/stats/summary` - Get statistics

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/trends` - Optimization trends
- `GET /api/analytics/impact` - Environmental impact

### Health Check
- `GET /api/health` - Server health status

---

## 🧪 Testing the Backend

### Test 1: Health Check
```bash
curl http://localhost:5000/api/health
```

### Test 2: Optimize Routes
```bash
curl -X POST http://localhost:5000/api/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "routes": [
      {"latitude": 40.7128, "longitude": -74.0060, "quantity": 5},
      {"latitude": 40.7580, "longitude": -73.9855, "quantity": 3}
    ],
    "saveToDatabase": true,
    "routeName": "Test Route"
  }'
```

### Test 3: Get All Routes
```bash
curl http://localhost:5000/api/routes
```

### Test 4: Get Analytics
```bash
curl http://localhost:5000/api/analytics/dashboard
```

---

## 📁 Project Structure

```
optifleet/
├── client/                 # React frontend (to be created)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── models/                 # MongoDB models
│   ├── Route.js
│   └── Analytics.js
│
├── routes/                 # API routes
│   ├── optimization.js
│   ├── routes.js
│   └── analytics.js
│
├── optimizer/              # Python optimization
│   └── optimize.py
│
├── frontend/               # Old static frontend (backup)
│
├── server.js               # MERN server
├── package.json            # Dependencies
└── .env                    # Environment config
```

---

## 🚀 Next Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Create React App
```bash
npx create-react-app client
```

### 3. Install React Dependencies
```bash
cd client
npm install axios react-router-dom @mui/material @mui/icons-material @emotion/react @emotion/styled recharts
```

### 4. Start Development
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
cd client
npm start
```

---

## 🎨 React Components to Create

1. **Dashboard** - Main dashboard with stats
2. **RouteOptimizer** - Route optimization interface
3. **RouteList** - List of saved routes
4. **Analytics** - Charts and metrics
5. **Map** - Interactive route visualization
6. **Navbar** - Navigation component
7. **Stats** - Statistics cards

---

## 🔄 Migration from Old Frontend

The old static frontend (`frontend/` folder) is preserved as backup.
New React app will be in `client/` folder with:
- Modern React components
- State management
- API integration
- Responsive design
- Material-UI components

---

## 💾 Database Schema

### Route Document
```javascript
{
  name: String,
  locations: [{
    latitude: Number,
    longitude: Number,
    quantity: Number,
    address: String
  }],
  optimized: Boolean,
  optimizationResults: {
    before: { distance, fuel, carbon },
    after: { distance, fuel, carbon },
    savings: { distance, fuel, carbon, percentage }
  },
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
mongo

# Or use MongoDB Atlas cloud database
```

### Port Already in Use
```bash
# Change PORT in .env file
PORT=5001
```

### React App Not Starting
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## ✅ Verification Checklist

- [ ] Node.js installed (v18+)
- [ ] MongoDB installed/configured
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Backend starts successfully
- [ ] MongoDB connects
- [ ] API endpoints respond
- [ ] React app created
- [ ] Frontend starts successfully

---

## 🎉 Success Indicators

When everything is working:
1. ✅ Backend: "MongoDB Connected Successfully"
2. ✅ Backend: "OptiFleet MERN Stack Server Started!"
3. ✅ Frontend: React app opens at http://localhost:3000
4. ✅ API: Health check returns OK
5. ✅ Database: Routes can be saved and retrieved

---

**Built with 💚 using MERN Stack for a sustainable future**
