let routes = [];

function addRoute() {
    const route = {
        latitude: Number(document.getElementById("lat").value),
        longitude: Number(document.getElementById("lng").value),
        quantity: Number(document.getElementById("qty").value)
    };

    routes.push(route);

    const li = document.createElement("li");
    li.innerText = `Lat ${route.latitude}, Lng ${route.longitude}, Qty ${route.quantity}`;
    document.getElementById("routes").appendChild(li);
}

function optimize() {
    fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routes })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("result").innerHTML = `
        <table>
            <tr><th>Metric</th><th>Before</th><th>After</th><th>Saved</th></tr>
            <tr><td>Distance (km)</td><td>${data.before.distance}</td><td>${data.after.distance}</td><td>${data.savings.distance}</td></tr>
            <tr><td>Fuel (L)</td><td>${data.before.fuel}</td><td>${data.after.fuel}</td><td>${data.savings.fuel}</td></tr>
            <tr><td>CO₂ (kg)</td><td>${data.before.carbon}</td><td>${data.after.carbon}</td><td>${data.savings.carbon}</td></tr>
        </table>
        <pre>${data.optimizer}</pre>
        `;
    });
}
