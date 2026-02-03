// Quick test of optimization algorithm
const testRoutes = [
    { latitude: 40.7128, longitude: -74.0060, quantity: 5 },  // Lower Manhattan
    { latitude: 40.8584, longitude: -73.9285, quantity: 5 },  // Bronx (FAR NORTH)
    { latitude: 40.7489, longitude: -73.9680, quantity: 8 },  // Midtown
    { latitude: 40.6782, longitude: -73.9442, quantity: 7 },  // Brooklyn (FAR SOUTH)
    { latitude: 40.7614, longitude: -73.9776, quantity: 4 },  // Central Park
    { latitude: 40.7282, longitude: -73.7949, quantity: 6 },  // Queens (FAR EAST)
    { latitude: 40.7580, longitude: -73.9855, quantity: 3 }   // Times Square
];

fetch('http://localhost:3000/api/optimize', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ routes: testRoutes })
})
    .then(res => res.json())
    .then(data => {
        console.log('✅ OPTIMIZATION RESULTS:');
        console.log('Before:', data.before);
        console.log('After:', data.after);
        console.log('Savings:', data.savings);
        console.log(`\n🎉 Saved ${data.savings.percentage}% distance!`);
    })
    .catch(err => {
        console.error('❌ Error:', err);
    });
