npm run dev          # This starts MERN stack (needs MongoDB)
cd frontend
npm run dev          # This doesn't exist in frontend
cd backend  
npm run dev          # This tries to start MERN server
```

---

# ✅ CORRECT WAY TO START

## Step 1: Stop ALL Running Terminals
- Close ALL terminal windows
- Or press Ctrl+C in each one

## Step 2: Open ONE New Terminal

## Step 3: Run This EXACT Command:
```bash
cd c:\Desktop\kishor\optifleet
node backend/server.js
```

## Step 4: You Should See:
```
======================================================================
🚚 OptiFleet - Sustainable Delivery Optimization Platform
======================================================================
📍 Server running at: http://localhost:3000
📊 Dashboard: http://localhost:3000/dashboard.html
🔌 API endpoint: http://localhost:3000/api/optimize
======================================================================

📐 REAL MATHEMATICS ENABLED:
   ✅ Haversine formula for accurate Earth distances
   ✅ Nearest Neighbor TSP algorithm
   ✅ Real-world fuel consumption (12 L/100km)
   ✅ EPA CO₂ emission factors (2.68 kg/L)
   ✅ Environmental impact calculations

✅ Ready to optimize routes with REAL DATA!
```

## Step 5: Open Browser
Go to: **http://localhost:3000/dashboard.html**

---

# 🐛 Why It's Not Working

## Problem 1: Wrong Command
You're running `npm run dev` which tries to start:
- MERN stack server on port 5000
- MongoDB connection (which you don't have)
- React client (which doesn't exist yet)

## Problem 2: Port Conflicts
Multiple servers trying to use the same ports:
- Port 5000: MERN server (failing)
- Port 3000: Backend server (blocked)

## Problem 3: Missing MongoDB
The MERN server needs MongoDB, but it's not installed/running:
```
ECONNREFUSED ::1:27017
```

---

# ✅ What You Actually Need

You DON'T need:
- ❌ MERN stack
- ❌ MongoDB
- ❌ React (for now)
- ❌ `npm run dev`

You ONLY need:
- ✅ Simple Node.js backend
- ✅ Static HTML frontend
- ✅ One command: `node backend/server.js`

---

# 🎯 EXACT STEPS (Copy-Paste These)

### 1. Stop Everything
Close all terminal windows

### 2. Open PowerShell/CMD

### 3. Copy-Paste This:
```bash
cd c:\Desktop\kishor\optifleet
node backend/server.js
```

### 4. Wait for Success Message
You should see "Ready to optimize routes with REAL DATA!"

### 5. Open Browser
```
http://localhost:3000/dashboard.html
```

### 6. Test
- Click "Load Sample"
- Click "Optimize Routes"
- See results!

---

# 🔍 How to Know It's Working

## Terminal Should Show:
```
✅ Ready to optimize routes with REAL DATA!
```

## When You Click "Optimize Routes":
```
📊 OPTIMIZATION START
Input routes: 7
Original order: 1. (40.7128, -74.0060) ...
BEFORE: Distance = 68.45 km
Optimized order: 1. (40.7128, -74.0060) ...
AFTER: Distance = 47.23 km
SAVINGS: 21.22 km (31.0%)
📊 OPTIMIZATION COMPLETE
```

## Browser Should Show:
- Before: ~68 km
- After: ~47 km
- Savings: ~31%

---

# ❌ Common Mistakes

## Mistake 1: Using `npm run dev`
**Don't do this!** It starts the wrong server.

## Mistake 2: Running from wrong folder
Must be in `c:\Desktop\kishor\optifleet`

## Mistake 3: Multiple terminals
Only need ONE terminal running `node backend/server.js`

## Mistake 4: Wrong URL
Use: `http://localhost:3000/dashboard.html`
Not: `http://localhost:5000/...`

---

# 💡 Quick Fix for Port Issues

If you see "Port already in use":

```bash
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill it (replace PID with the number shown)
taskkill /F /PID <PID>

# Then start server
node backend/server.js
```

---

# 🎉 Success Checklist

- [ ] Closed all terminals
- [ ] Opened ONE new terminal
- [ ] Ran: `cd c:\Desktop\kishor\optifleet`
- [ ] Ran: `node backend/server.js`
- [ ] Saw "Ready to optimize routes" message
- [ ] Opened http://localhost:3000/dashboard.html
- [ ] Dashboard loaded successfully
- [ ] Clicked "Load Sample"
- [ ] Clicked "Optimize Routes"
- [ ] Saw DIFFERENT before/after values
- [ ] Savings > 20%

---

**If you follow these EXACT steps, it WILL work!**

The problem is you're using `npm run dev` which starts the wrong server.
Use `node backend/server.js` instead!
