const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const ordersRoute = require("./routes/orders");

app.use(cors());
app.use(express.json());

/* -------- API ROUTES -------- */
app.use("/api", ordersRoute);

/* -------- FRONTEND SERVE -------- */
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

/* -------- SERVER -------- */
app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
